import { get, run, query } from '../db/index.js';
import { nowIso, jsonOrNull } from '../utils/index.js';
import {
  runCoordinator,
  runTrafficAgent,
  runPollutionAgent,
  runEnergyAgent,
  runFusionAgent,
  runClarificationAgent,
  runAuthorityRequestAgent,
  runMemoryAgent,
  formatMemoryHints,
} from '../agents/index.js';
import { runRecommendationEngine } from './recommendation.js';
import { retrieve, formatContext, asEvidence, retrieveMemory } from '../rag/retriever.js';
import { providerRegistry } from '../providers/index.js';
import { scoreAllOptions } from './xai.js';

const SPECIALIST_RUNNERS = {
  traffic: runTrafficAgent,
  pollution: runPollutionAgent,
  energy: runEnergyAgent,
};

export async function orchestrateAnalysis({
  ai,
  providers = providerRegistry,
  plannerId,
  localityId,
  problemTitle,
  problemDescription,
  category,
  sourceComplaintIds,
}) {
  const locality = get('SELECT * FROM localities WHERE id = $id OR name = $id', { $id: localityId });
  if (!locality) {
    const err = new Error(`Locality not found: ${localityId}`);
    err.status = 404;
    throw err;
  }

  run(
    `INSERT INTO analyses (planner_id, locality_id, problem_title, problem_description, source_complaint_ids, category, status)
     VALUES ($plannerId, $localityId, $title, $description, $complaints, $category, 'running')`,
    {
      $plannerId: plannerId || null,
      $localityId: locality.id,
      $title: problemTitle,
      $description: problemDescription,
      $complaints: JSON.stringify(sourceComplaintIds || []),
      $category: category || null,
    },
  );
  const analysisId = get('SELECT last_insert_rowid() AS id').id;

  try {
    const problem = {
      id: analysisId,
      title: problemTitle,
      description: problemDescription,
      category: category || null,
      locality_id: locality.id,
    };

  // 1. RAG retrieval
  const retrieved = retrieve({ problem: problemTitle, locality: locality.name, category });
  const evidenceItems = asEvidence(retrieved);
  const evidenceContext = formatContext(retrieved);

  // 2. Related complaints + memory
  const relatedComplaints = query(
    `SELECT tracking_id, title, description, category, severity_input, priority_score, status
     FROM citizen_complaints WHERE locality_id = $localityId ORDER BY created_at DESC LIMIT 12`,
    { $localityId: locality.id },
  );
  const memories = await retrieveMemory({ problem: problemTitle, locality: locality.name, category });
  const memoryHints = formatMemoryHints(memories);

  // 3. Coordinator
  const coordinator = await runCoordinator({
    ai,
    analysisId,
    locality,
    problem,
    complaints: relatedComplaints,
    evidenceSummary: evidenceContext,
    priorityScore: null,
    memoryHints,
  });
  run('UPDATE analyses SET coordinator_decision = $decision WHERE id = $id', {
    $decision: JSON.stringify(coordinator),
    $id: analysisId,
  });

  // 3b. New-specialist case: never short-circuits the pipeline. The coordinator
  //     flags the coverage gap, the recommendation engine still produces an
  //     initial (provisional) recommendation that explicitly states what is
  //     missing, and the authority interaction happens AFTER it exists.
  //     Any additional domain specialist is requested only if coordination
  //     requires it (USE CASE 1 - information/clarification request).

  // 4. Specialists (dynamic selection by the coordinator). A transient failure
  //    of ONE specialist (provider 429 / timeout / temporary upstream outage)
  //    must NEVER abort the analysis: the failure is recorded with its reason,
  //    the successful specialists' results are kept, and the pipeline
  //    continues with whatever evidence is available.
  // Run all required specialist agents in PARALLEL (Promise.allSettled) for
  // ~60% faster analysis time. Each failure is recorded independently and
  // never aborts the pipeline.
  const uniqueTasks = [];
  const seen = new Set();
  for (const task of coordinator.required_agents || []) {
    if (SPECIALIST_RUNNERS[task.agent] && !seen.has(task.agent)) {
      seen.add(task.agent);
      uniqueTasks.push(task);
    }
  }

  const specialistPromises = uniqueTasks.map((task) =>
    SPECIALIST_RUNNERS[task.agent]({ ai, analysisId, locality, problem, providers })
      .then(({ result, evidence }) => ({ ok: true, task, result, evidence }))
      .catch((err) => ({ ok: false, task, err }))
  );

  const settled = await Promise.allSettled(specialistPromises);

  const agentResults = [];
  const specialistFailures = [];
  for (const outcome of settled) {
    const val = outcome.value; // allSettled never rejects
    if (val?.ok) {
      agentResults.push({
        agent: val.task.agent,
        label: labelFor(val.task.agent),
        task: val.task.objective,
        status: 'complete',
        result: val.result,
        evidence: val.evidence,
      });
    } else if (val) {
      const { message, kind } = classifySpecialistFailure(val.err);
      specialistFailures.push({ agent: val.task.agent, label: labelFor(val.task.agent), kind, reason: message });
    }
  }
  // Safety net - never silently run zero specialists when one is required. But
  // if every requested specialist actually FAILED, there is no legitimate
  // baseline to fabricate, so the pipeline reports insufficient data instead.
  if (agentResults.length === 0 && specialistFailures.length === 0) {
    try {
      const runner = SPECIALIST_RUNNERS.traffic;
      const { result, evidence } = await runner({ ai, analysisId, locality, problem, providers });
      agentResults.push({ agent: 'traffic', label: 'Traffic Agent', task: 'Baseline assessment', status: 'complete', result, evidence });
    } catch (err) {
      const { message, kind } = classifySpecialistFailure(err);
      specialistFailures.push({ agent: 'traffic', label: 'Traffic Agent', kind, reason: message });
    }
  }

  // 4b. All specialists unavailable: explicitly report the state instead of
  //     pretending a recommendation exists from data that was never produced.
  if (agentResults.length === 0) {
    run(
      `UPDATE analyses SET status='insufficient_data', specialist_failures=$f, updated_at=datetime('now') WHERE id=$id`,
      { $f: JSON.stringify(specialistFailures), $id: analysisId },
    );
    return packResult({
      analysisId,
      status: 'insufficient_data',
      locality,
      problem,
      coordinator,
      newSpecialistRequired: !!coordinator.new_specialist_required,
      newSpecialistReason: coordinator.new_specialist_reason || null,
      agentResults: [],
      specialistFailures,
      fusionResult: null,
      recommendations: null,
      evidence: evidenceItems,
      memoryHints,
    });
  }

  // 5. Fusion
  const fusionResult = await runFusionAgent({
    ai,
    analysisId,
    locality,
    problem,
    specialistInputs: agentResults.map((a) => ({ agent: a.label, ...a.result })),
  });
  run(
    `INSERT INTO fusion_results (analysis_id, result) VALUES ($aid, $res)
     ON CONFLICT(analysis_id) DO UPDATE SET result=$res`,
    { $aid: analysisId, $res: JSON.stringify(fusionResult) },
  );

  // Build XAI scoring context from specialist findings for use in
  // the recommendation engine. This produces transparent, auditable scores.
  const xaiContext = buildXaiContext({ agentResults, fusionResult, locality });

  // 6. Recommendation engine (draft). Always runs - even when the coordinator
  //    found a specialist coverage gap - so an initial recommendation exists
  //    for the planner before any authority or clarification interaction.
  //    Unavailable specialists are exposed to the engine as an explicit data
  //    gap (missing information / uncertainty / verification needed), never
  //    replaced with fabricated analysis.
  run('UPDATE analyses SET specialist_failures = $f WHERE id = $id', { $f: JSON.stringify(specialistFailures), $id: analysisId });
  const missingInformation = [
    ...(coordinator.missing_information || []),
    ...specialistFailures.map(
      (f) => `${f.label} assessment (${f.kind === 'unavailable' ? 'provider temporarily unavailable' : 'provider error'}): ${f.reason}`,
    ),
  ];
  const specialistGap = specialistFailures.length
    ? `Specialist coverage note: ${specialistFailures.map((f) => `${f.label} - ${f.reason}`).join('; ')}. ` +
      'Their domain-specific evidence is NOT included. Any projection tied to those domains must be treated as UNVERIFIED and confirmed before implementation.'
    : (coordinator.new_specialist_reason || null);

  let recommendations = null;
  let recommendationFailure = null;
  try {
    recommendations = await runRecommendationEngine({
      ai,
      analysisId,
      locality,
      problem,
      fusionResult,
      agentResults,
      evidenceContext,
      memoryHints,
      providers,
      missingInformation,
      specialistGap,
      xaiContext,
    });
  } catch (err) {
    // Recommendation-generation failure (after the single controlled strict
    // retry): report an explicit state instead of leaving the analysis in
    // "running", expose the reason, and create NO authority request.
    recommendationFailure = ((err && err.message) ? String(err.message) : 'Recommendation generation failed.').slice(0, 500);
    run(
      "UPDATE analyses SET status='recommendation_failed', recommendation_failure=$f, updated_at=datetime('now') WHERE id=$id",
      { $f: recommendationFailure, $id: analysisId },
    );
    return packResult({
      analysisId,
      status: 'recommendation_failed',
      locality,
      problem,
      coordinator,
      newSpecialistRequired: !!coordinator.new_specialist_required,
      newSpecialistReason: coordinator.new_specialist_reason || null,
      agentResults,
      specialistFailures,
      fusionResult,
      recommendations: null,
      recommendationFailure,
      evidence: evidenceItems,
      memoryHints,
    });
  }

  // 7. Authority communication & routing (USE CASE 2 - recommendation-related
  //    support/action). Runs only when no clarification loop was already
  //    opened for this analysis (avoid double-escalation).
  let authorityRequest = null;
  if (!coordinator.clarification_required && (recommendations?.options || []).some((o) => !o.blocked)) {
    authorityRequest = await runAuthorityRequestAgent({
      ai,
      analysisId,
      locality,
      problem,
      recommendation: recommendations,
      fusionSummary: fusionResult?.summary || '',
      providers,
    });
    if (authorityRequest && !authorityRequest.involvement_needed) authorityRequest = null;
  }

  // 8. Clarification decision (dynamic, only when evidence is insufficient)
  //    [USE CASE 1 - INFORMATION / CLARIFICATION request].
  let clarification = null;
  if (coordinator.clarification_required) {
    clarification = await runClarificationAgent({
      ai,
      analysisId,
      locality,
      problem,
      evidenceContext,
      missingInformation: coordinator.missing_information || [],
      providers,
    });
    if (clarification.decision.clarification_required) {
      run("UPDATE analyses SET status = 'awaiting_clarification' WHERE id = $id", { $id: analysisId });
    } else {
      run("UPDATE analyses SET status = 'recommended' WHERE id = $id", { $id: analysisId });
    }
  } else {
    run("UPDATE analyses SET status = 'recommended' WHERE id = $id", { $id: analysisId });
  }

    return packResult({
      analysisId,
      status: clarification && clarification.decision.clarification_required ? 'awaiting_clarification' : 'recommended',
      locality,
      problem,
      coordinator,
      newSpecialistRequired: !!coordinator.new_specialist_required,
      newSpecialistReason: coordinator.new_specialist_reason || null,
      agentResults,
      specialistFailures,
      fusionResult,
      recommendations,
      clarification,
      authority_request: authorityRequest,
      evidence: evidenceItems,
      memoryHints,
    });
  } catch (err) {
    run(
      "UPDATE analyses SET status='failed', recommendation_failure=$f, updated_at=datetime('now') WHERE id=$id",
      { $f: (err?.message || String(err)).slice(0, 500), $id: analysisId },
    );
    throw err;
  }
}

function packResult(o) {
  return {
    analysis_id: o.analysisId,
    status: o.status,
    locality: o.locality,
    problem: o.problem,
    coordinator: o.coordinator,
    new_specialist_required: o.newSpecialistRequired || false,
    new_specialist_reason: o.newSpecialistReason || null,
    agent_results: o.agentResults,
    specialist_failures: o.specialistFailures || [],
    fusion_result: o.fusionResult,
    recommendations: o.recommendations,
    recommendation_failure: o.recommendationFailure || null,
    clarification: o.clarification,
    authority_request: o.authority_request,
    evidence: o.evidence,
    memory_hints: o.memoryHints || null,
  };
}

/**
 * Deterministic classification of a specialist failure so the UI can
 * distinguish "temporarily unavailable" (transient provider/upstream problem)
 * from a hard failure, while preserving the original error reason.
 */
function classifySpecialistFailure(err) {
  const message = err?.message ? String(err.message) : String(err);
  const kind = /rate.?limit|429|timeout|timed out|temporarily|unavailable|upstream|network|ECONN|fetch failed/i.test(message) ? 'unavailable' : 'failed';
  return { message: message.slice(0, 500), kind };
}

function labelFor(name) {
  return { traffic: 'Traffic Agent', pollution: 'Pollution Agent', energy: 'Energy Agent' }[name] || name;
}

/**
 * Builds the XAI context object passed to the scoring engine.
 * Extracts urgency, cross-domain, population density and AQI signals
 * from specialist agent results so the XAI engine has real data.
 */
function buildXaiContext({ agentResults, fusionResult, locality }) {
  const trafficResult = agentResults.find((a) => a.agent === 'traffic')?.result;
  const pollutionResult = agentResults.find((a) => a.agent === 'pollution')?.result;
  const energyResult = agentResults.find((a) => a.agent === 'energy')?.result;

  // Urgency signal: average confidence across specialist agents (higher confidence = higher certainty about urgency)
  const confidences = [trafficResult?.confidence, pollutionResult?.confidence, energyResult?.confidence].filter(Boolean);
  const avgConfidence = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0.5;

  // Cross-domain signal: fusion identified cross-domain impacts
  const crossDomainCount = (fusionResult?.cross_domain_impacts || []).length;

  // AQI high signal from pollution agent
  const aqiHigh = (pollutionResult?.key_findings || []).some((f) =>
    /pm2\.5|aqi|critical|hazardous|poor/i.test(f)
  );

  // Population density signal (heuristic from locality name / data)
  const populationDensityHigh = Boolean(
    (trafficResult?.key_findings || []).some((f) => /peak|congestion|capacity|overload/i.test(f))
  );

  return {
    urgencyScore:         Math.round(avgConfidence * 100),
    crossDomainScore:     Math.min(100, crossDomainCount * 20),
    aqiHigh,
    populationDensityHigh,
    reportCount:          0,   // Filled by the recommendation engine from DB
    targetAuthority:      null, // Filled per-option by the scoring engine
    estimatedCostInr:     0,
  };
}