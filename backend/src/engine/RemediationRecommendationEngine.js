import { runRecommendationAgent, runRefinementAgent } from '../agents/index.js';
import { applyConstraints } from './InfrastructureConstraintChecker.js';
import { formatCostInr } from './FinancialLossCostCalculator.js';
import { run, get, query } from '../db/index.js';
import { nowIso, jsonOrNull } from '../utils/index.js';
import { scoreAllOptions } from './ExplainableAiScoringEngine.js';
import { formatMemoryHints } from '../agents/HistoricalIncidentMemoryAgent.js';
import { retrieveMemory, formatContext } from '../rag/ragSemanticRetriever.js';

/**
 * Recommendation Engine.
 *   DIAGNOSE - evidence + specialist outputs understand the problem (LLM).
 *   GENERATE - LLM proposes multiple interventions (Recommendation Agent).
 *   FILTER   - deterministic constraint filter (budget/spatial/utility/land/timeline).
 *   RANK     - interpretable viability composite; blocked options are excluded
 *              from ranking and reported for revision.
 */
export async function runRecommendationEngine({ ai, analysisId, locality, problem, fusionResult, agentResults, evidenceContext, memoryHints, providers, missingInformation, specialistGap, xaiContext }) {
  const constraintsClause = providers.constraint
    .all()
    .map((c) => `- [${c.authority_code}] ${c.type}: ${c.description}`)
    .join('\n');
  const costInfo = `Component rates available from the Telangana material price dataset. Only refer to components with known rates so cost can be estimated.`;

  const generated = await runRecommendationAgent({
    ai,
    analysisId,
    locality,
    problem,
    fusionSummary: fusionResult.summary,
    agentResults,
    evidenceContext,
    constraintsClause,
    costInfo,
    memoryHints,
    missingInformation,
    specialistGap,
    xaiContext,
  });

  const filtered = applyConstraints({ options: generated.options || [], locality, providers });

  // XAI scoring: replace raw LLM-guessed viability with transparent,
  // dimension-weighted scores. Each option gets a full xai_scores breakdown
  // so planners can see exactly why an option was ranked above another.
  const { scoredOptions, explanation: xaiExplanation } = scoreAllOptions(
    filtered.map((x, idx) => ({
      ...x,
      ...(x.option || {}),
      _filterIdx: idx,
      constraints_applied: x.constraints_applied,
      est_cost_inr: x.cost_estimate?.estimated_cost_inr ?? 0,
    })),
    { ...(xaiContext || {}), reportCount: (generated.options || []).length },
  );

  const scoredMap = new Map(scoredOptions.map((s) => [s._filterIdx, s]));

  // Merge XAI scores back; blocked status from the constraint filter is preserved.
  const mergedFiltered = filtered.map((x, i) => {
    const s = scoredMap.get(i);
    return {
      ...x,
      viability:   s?.viability          ?? x.viability,
      impact:      s?.impact_score        ?? x.impact,
      feasibility: s?.feasibility_score   ?? x.feasibility,
      xai_scores:  s?.xai_scores          ?? null,
    };
  });

  const ranked = mergedFiltered
    .filter((x) => !x.blocked)
    .sort((a, b) => b.viability - a.viability)
    .map((x, i) => ({ ...x, rank: i + 1 }));

  const blocked = mergedFiltered.filter((x) => x.blocked).sort((a, b) => b.viability - a.viability);

  const gaps = normalizeGaps(generated, missingInformation, fusionResult);

  const recPack = {
    diagnosis: generated.context_diagnosis,
    options: ranked,
    blocked,
    missing_information: gaps.missing_information,
    assumptions: gaps.assumptions,
    uncertainty: gaps.uncertainty,
    verification_needed: gaps.verification_needed,
    xai_explanation: xaiExplanation || null,
  };

  const recommendationId = persistRecommendation({ analysisId, recPack, problem });
  return { ...recPack, options: getRecommendationOptions(recommendationId), recommendation_id: recommendationId };
}


/**
 * Deterministic normalization of the LLM's data-gap reporting. Ensures the
 * initial recommendation always states missing information, assumptions,
 * uncertainty and verification needs - never silently returns recommendations
 * without them because the LLM omitted the fields.
 */
function normalizeGaps(generated, missingInformation, fusionResult) {
  const missing =
    Array.isArray(generated.missing_information) && generated.missing_information.length
      ? generated.missing_information
      : missingInformation || [];
  const assumptions =
    Array.isArray(generated.assumptions) && generated.assumptions.length
      ? generated.assumptions
      : missing.length
        ? ['Provisional recommendation based on the evidence and specialists available now; values affected by the listed missing information are interim.']
        : [];
  const uncertainty =
    generated.uncertainty ||
    (Array.isArray(fusionResult?.uncertainties) && fusionResult.uncertainties.length
      ? fusionResult.uncertainties.join('; ')
      : missing.length
        ? 'Confidence is limited by the missing information listed above; figures should be re-validated once it is resolved.'
        : '');
  const verification =
    Array.isArray(generated.verification_needed) && generated.verification_needed.length
      ? generated.verification_needed
      : missing.map((m) => `Verify: ${m}`);
  return { missing_information: missing, assumptions, uncertainty, verification_needed: verification };
}

function persistRecommendation({ analysisId, recPack }) {
  // Recreate recommendation for this analysis (idempotent-ish for a single cycle).
  run(
    `INSERT INTO recommendations (analysis_id, status, missing_information, assumptions, uncertainty, verification_needed, xai_explanation)
     VALUES ($analysisId, 'draft', $missing, $assumptions, $uncertainty, $verification, $xaiExplanation)
     ON CONFLICT(analysis_id) DO UPDATE SET status='draft', missing_information=$missing, assumptions=$assumptions, uncertainty=$uncertainty, verification_needed=$verification, xai_explanation=$xaiExplanation, updated_at=$now`,
    {
      $analysisId: analysisId,
      $now: nowIso(),
      $missing: JSON.stringify(recPack.missing_information || []),
      $assumptions: JSON.stringify(recPack.assumptions || []),
      $uncertainty: recPack.uncertainty || '',
      $verification: JSON.stringify(recPack.verification_needed || []),
      $xaiExplanation: recPack.xai_explanation || null,
    },
  );
  const recommendationId = get('SELECT id FROM recommendations WHERE analysis_id = ?', [analysisId]).id;
  for (const opt of recPack.options) {
    insertOption(recommendationId, opt, opt.rank, false, null);
  }
  for (const opt of recPack.blocked) {
    const reason = opt.constraints_applied
      .filter((c) => c.impact === 'block')
      .map((c) => c.description)
      .join('; ') || 'Failed constraint filter.';
    insertOption(recommendationId, opt, null, true, reason);
  }
  // is_recommended = rank 1 option (AI recommends; planner decides).
  const top = get(
    'SELECT id FROM recommendation_options WHERE recommendation_id = ? AND blocked = 0 ORDER BY rank LIMIT 1',
    [recommendationId],
  );
  if (top) {
    run('UPDATE recommendation_options SET is_recommended = 1 WHERE id = ?', [top.id]);
    run('UPDATE recommendations SET final_option_id = ? WHERE id = ?', [top.id, recommendationId]);
  }
  return recommendationId;
}

function insertOption(recommendationId, opt, rank, blocked, blockReason) {
  run(
    `INSERT INTO recommendation_options
     (recommendation_id, name, summary, components, est_cost_inr, cost_breakup, impact_score, feasibility_score, timeline_months, environmental_effect, energy_effect, population_benefit, risks, dependencies, evidence, why_generated, constraints_applied, target_authority, constraint_status, rank, viability, blocked, block_reason, is_recommended, xai_scores)
     VALUES ($recId, $name, $summary, $components, $cost, $costBreakup, $impact, $feasibility, $timeline, $env, $energy, $pop, $risks, $deps, $evidence, $why, $constraints, $authority, $constraintStatus, $rank, $viability, $blocked, $blockReason, $recommended, $xaiScores)`,
    {
      $recId: recommendationId,
      $name: opt.option.name,
      $summary: opt.option.description,
      $components: JSON.stringify(opt.option.components || []),
      $cost: safeCost(opt.cost_estimate),
      $costBreakup: JSON.stringify(opt.cost_estimate),
      $impact: opt.impact,
      $feasibility: opt.feasibility,
      $timeline: Number(opt.option.timeline_months) || 12,
      $env: opt.option.environmental_effect || '',
      $energy: opt.option.energy_effect || '',
      $pop: opt.option.population_benefit || '',
      $risks: JSON.stringify(opt.option.risks || []),
      $deps: JSON.stringify(opt.option.dependencies || []),
      $evidence: JSON.stringify(evidenceItems(opt.option)),
      $why: opt.option.why_generated || '',
      $constraints: JSON.stringify(opt.constraints_applied || []),
      $authority: opt.authority_code,
      $constraintStatus: constraintStatusOf(opt),
      $rank: rank,
      $viability: opt.viability,
      $blocked: blocked ? 1 : 0,
      $blockReason: blockReason,
      $recommended: 0,
      $xaiScores: opt.xai_scores ? JSON.stringify(opt.xai_scores) : null,
    },
  );
}

function constraintStatusOf(opt) {
  if (opt.constraint_status) return opt.constraint_status;
  if (opt.blocked) return 'blocked';
  return (opt.constraints_applied || []).some((c) => c.impact === 'approval_required') ? 'approval_required' : 'clear';
}

function safeCost(costEstimate) {
  const v = Number(costEstimate?.estimated_cost_inr);
  return Number.isFinite(v) ? v : 0;
}

function evidenceItems(option) {
  return (option.dependencies || []).map((d, i) => ({
    ref: `dep-${i}`,
    source: 'Dependency',
    source_label: 'Dependency',
    is_demo: false,
    detail: d,
  }));
}

export async function refineAfterAuthorityResponse({ ai, analysisId, recommendationId, authorityResponse, authorityInterpretation, fusionResult, locality, problem }) {
  const existing = getRecommendationOptions(recommendationId);
  const refined = await runRefinementAgent({
    ai,
    analysisId,
    originalOptions: existing,
    fusionSummary: fusionResult.summary,
    authorityResponse,
    authorityInterpretation,
    evidenceContext: 'Authority clarification ingested.',
  });

  // Deterministically normalize the change report so the UI always has
  // what-changed / why-changed / authority-information-used to show.
  const changeInfo = normalizeRefinement(refined);

  // Store refined options as new rows marked revised_from prior options.
  const filtered = applyConstraints({ options: refined.adjusted_options || [], locality, providers: (await import('../providers/index.js')).providerRegistry });
  const ranked = filtered.filter((x) => !x.blocked).sort((a, b) => b.viability - a.viability).map((x, i) => ({ ...x, rank: i + 1 }));
  const base = get('SELECT id FROM recommendation_options WHERE recommendation_id = ? ORDER BY id LIMIT 1', [recommendationId]);

  persistRefinementLog({ recommendationId, authorityResponse, ...changeInfo });

  for (const x of ranked) insertOptionWithBase(recommendationId, x, x.rank, false, null, base);
  const blocked = filtered.filter((x) => x.blocked);
  for (const x of blocked) {
    const reason = (x.constraints_applied || [])
      .filter((c) => c.impact === 'block')
      .map((c) => c.description)
      .join('; ') || 'Failed constraint filter.';
    insertOptionWithBase(recommendationId, x, null, true, reason, base);
  }

  const newTop = get(
    'SELECT id FROM recommendation_options WHERE recommendation_id = ? AND blocked = 0 ORDER BY rank LIMIT 1',
    [recommendationId],
  );
  if (newTop) run('UPDATE recommendations SET final_option_id = ?, status = ? WHERE id = ?', [newTop.id, 'draft', recommendationId]);

  return { refined: { ...refined, ...changeInfo }, ranked, refinement: { at: nowIso(), ...changeInfo } };
}

function normalizeRefinement(refined) {
  return {
    what_changed:
      Array.isArray(refined.what_changed) && refined.what_changed.length ? refined.what_changed : (Array.isArray(refined.adjustments) ? refined.adjustments : []),
    why_changed: refined.why_changed || refined.analysis_of_response || 'Adjusted in response to authority input.',
    authority_information_used: refined.authority_information_used || refined.notes || '',
  };
}

function persistRefinementLog({ recommendationId, authorityResponse, what_changed, why_changed, authority_information_used }) {
  const row = get('SELECT * FROM recommendations WHERE id = ?', [recommendationId]);
  const log = jsonOrNull(row?.refinement_log) || [];
  log.push({
    at: nowIso(),
    authority_response: authorityResponse,
    what_changed: what_changed || [],
    why_changed: why_changed || '',
    authority_information_used: authority_information_used || '',
  });
  run('UPDATE recommendations SET refinement_log=$log WHERE id=$id', { $log: JSON.stringify(log), $id: recommendationId });
}

function insertOptionWithBase(recommendationId, opt, rank, blocked, blockReason, base) {
  run(
    `INSERT INTO recommendation_options
     (recommendation_id, name, summary, components, est_cost_inr, cost_breakup, impact_score, feasibility_score, timeline_months, environmental_effect, energy_effect, population_benefit, risks, dependencies, evidence, why_generated, constraints_applied, target_authority, constraint_status, rank, viability, blocked, block_reason, is_recommended, revised_from_id, xai_scores)
     VALUES ($recId, $name, $summary, $components, $cost, $costBreakup, $impact, $feasibility, $timeline, $env, $energy, $pop, $risks, $deps, $evidence, $why, $constraints, $authority, $constraintStatus, $rank, $viability, $blocked, $blockReason, $recommended, $revised, $xaiScores)`,
    {
      $recId: recommendationId,
      $name: opt.option.name,
      $summary: opt.option.description,
      $components: JSON.stringify(opt.option.components || []),
      $cost: opt.cost_estimate.estimated_cost_inr,
      $costBreakup: JSON.stringify(opt.cost_estimate),
      $impact: opt.impact,
      $feasibility: opt.feasibility,
      $timeline: Number(opt.option.timeline_months) || 12,
      $env: opt.option.environmental_effect || '',
      $energy: opt.option.energy_effect || '',
      $pop: opt.option.population_benefit || '',
      $risks: JSON.stringify(opt.option.risks || []),
      $deps: JSON.stringify(opt.option.dependencies || []),
      $evidence: '[]',
      $why: opt.option.why_generated || '',
      $constraints: JSON.stringify(opt.constraints_applied || []),
      $authority: opt.authority_code,
      $constraintStatus: constraintStatusOf(opt),
      $rank: rank,
      $viability: opt.viability,
      $blocked: blocked ? 1 : 0,
      $blockReason: blockReason,
      $recommended: rank === 1 && !blocked ? 1 : 0,
      $revised: base ? base.id : null,
      $xaiScores: opt.xai_scores ? JSON.stringify(opt.xai_scores) : null,
    },
  );
}

export function getRecommendationOptions(recommendationId) {
  return query('SELECT * FROM recommendation_options WHERE recommendation_id = ? AND blocked = 0 ORDER BY rank, id', [recommendationId]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.summary,
    rank: r.rank,
    components: jsonOrNull(r.components) || [],
    expected_impact: r.summary,
    impact_score: r.impact_score,
    feasibility_score: r.feasibility_score,
    timeline_months: r.timeline_months,
    environmental_effect: r.environmental_effect,
    energy_effect: r.energy_effect,
    population_benefit: r.population_benefit,
    risks: jsonOrNull(r.risks) || [],
    dependencies: jsonOrNull(r.dependencies) || [],
    why_generated: r.why_generated,
    target_authority: r.target_authority,
    est_cost_inr: r.est_cost_inr,
    viability: r.viability,
    is_recommended: r.is_recommended,
    constraints_applied: jsonOrNull(r.constraints_applied) || [],
    constraint_status: r.constraint_status || constraintStatusOf({ constraints_applied: jsonOrNull(r.constraints_applied) || [], blocked: r.blocked }),
    evidence: jsonOrNull(r.evidence) || [],
    xai_scores: jsonOrNull(r.xai_scores) || null,
  }));
}