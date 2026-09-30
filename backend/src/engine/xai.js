/**
 * engine/xai.js  –  Explainable AI (XAI) Scoring Engine
 *
 * Provides deterministic, weight-based scoring for recommendation options.
 * Replaces opaque LLM-guessed scores with transparent, auditable computations
 * so planners can see exactly *why* each option was ranked as it was.
 *
 * Design principles:
 *  - Every score is computed from named input dimensions with explicit weights.
 *  - Each dimension's percentage contribution to the final score is exposed.
 *  - All inputs are clamped to [0, 100] to prevent outlier pollution.
 *  - Results are stored alongside options so the frontend can render them.
 */

import { clamp, round } from '../utils/index.js';

// ---------------------------------------------------------------------------
// Dimension weight tables
// ---------------------------------------------------------------------------

/**
 * Impact weights – how much each factor drives the "benefit if implemented" score.
 * Weights must sum to 1.0.
 */
const IMPACT_WEIGHTS = {
  severity_reduction:   0.30,   // How much this option addresses the core severity
  population_benefit:   0.25,   // Breadth of citizens benefited
  environmental_gain:   0.20,   // Environmental improvement expected
  urgency_alignment:    0.15,   // How well it addresses urgency signals from specialist data
  cross_domain_benefit: 0.10,   // Positive spillover to other domains (traffic→air etc.)
};

/**
 * Feasibility weights – how likely the option is to be successfully implemented.
 * Weights must sum to 1.0.
 */
const FEASIBILITY_WEIGHTS = {
  implementation_ease:  0.35,   // Technical simplicity (inverse of component complexity)
  budget_fit:           0.25,   // How well the cost fits within typical authority budgets
  authority_alignment:  0.20,   // Whether the responsible authority is active & reachable
  timeline_realism:     0.10,   // Shorter realistic timelines score higher
  constraint_clearance: 0.10,   // Fewer constraint blocks = higher score
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scores a single recommendation option using XAI-style transparent weighting.
 *
 * @param {object} option     Raw option from the LLM recommendation agent.
 * @param {object} context    Rich context object with specialist findings and metadata.
 * @returns {object}          Option enriched with xai_scores (full breakdown).
 */
export function scoreOption(option, context) {
  const impactInputs  = deriveImpactInputs(option, context);
  const feasInputs    = deriveFeasibilityInputs(option, context);

  const impactScore   = weightedSum(impactInputs,  IMPACT_WEIGHTS);
  const feasScore     = weightedSum(feasInputs,     FEASIBILITY_WEIGHTS);

  // Viability composite (mirrors the existing constraint engine's formula but
  // now computed from auditable inputs rather than raw LLM scores).
  const viability = round(impactScore * 0.55 + feasScore * 0.45, 1);

  // Per-dimension percentage contributions — what planners will see in the UI.
  const impactContributions  = contributions(impactInputs,  IMPACT_WEIGHTS, impactScore);
  const feasContributions    = contributions(feasInputs,     FEASIBILITY_WEIGHTS, feasScore);

  return {
    ...option,
    impact_score:     round(impactScore, 1),
    feasibility_score: round(feasScore, 1),
    viability,
    xai_scores: {
      impact: {
        score: round(impactScore, 1),
        inputs: impactInputs,
        weights: IMPACT_WEIGHTS,
        contributions: impactContributions,
        top_driver: topDriver(impactContributions),
      },
      feasibility: {
        score: round(feasScore, 1),
        inputs: feasInputs,
        weights: FEASIBILITY_WEIGHTS,
        contributions: feasContributions,
        top_driver: topDriver(feasContributions),
      },
      viability,
      formula: 'viability = 0.55 * impact_score + 0.45 * feasibility_score',
      methodology: 'XAI weighted-sum scoring. Each dimension contribution = (weight * input) / total_score * 100.',
    },
  };
}

/**
 * Scores all options and appends a cross-option explanation comparing them.
 *
 * @param {object[]} options  Array of LLM-generated options.
 * @param {object}   context  Shared context for all options.
 * @returns {object}          { scoredOptions, explanation }
 */
export function scoreAllOptions(options, context) {
  if (!options || options.length === 0) return { scoredOptions: [], explanation: null };

  const scoredOptions = options.map((opt) => scoreOption(opt, context));

  // Sort by viability descending so rank 1 = best.
  scoredOptions.sort((a, b) => b.viability - a.viability);

  const explanation = buildCrossOptionExplanation(scoredOptions);
  return { scoredOptions, explanation };
}

/**
 * Generates the priority-level XAI explanation for a problem cluster.
 * Explains to the planner WHY a cluster has a specific priority score.
 *
 * @param {object} dimensions  { severity, population_impact, environmental_impact, urgency, feasibility }
 * @param {number} score       Computed priority score.
 * @returns {object}           Human-readable XAI breakdown.
 */
export function explainPriority(dimensions, score) {
  const PRIORITY_WEIGHTS = {
    severity:             0.30,
    population_impact:    0.25,
    environmental_impact: 0.20,
    urgency:              0.15,
    feasibility:          0.10,
  };

  const contrib = contributions(dimensions, PRIORITY_WEIGHTS, score);
  const sorted  = Object.entries(contrib).sort((a, b) => b[1] - a[1]);

  return {
    score,
    dimensions,
    weights: PRIORITY_WEIGHTS,
    contributions: contrib,
    top_driver: sorted[0]?.[0] ?? 'severity',
    top_driver_pct: sorted[0]?.[1] ?? 0,
    human_summary: buildPrioritySummary(sorted, score),
    formula: 'priority = 30%*severity + 25%*population_impact + 20%*environmental_impact + 15%*urgency + 10%*feasibility',
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Derives impact input dimensions from the option and context.
 * Each dimension is normalised to [0, 100].
 */
function deriveImpactInputs(option, context) {
  // Use LLM-provided scores as a starting signal but clamp them.
  // If not provided, fall back to context-derived heuristics.
  const llmImpact = clamp(option.impact_score ?? 50, 0, 100);
  const llmPop    = estimatePopulationScore(option, context);
  const llmEnv    = estimateEnvironmentalScore(option, context);

  return {
    severity_reduction:   clamp(llmImpact, 0, 100),
    population_benefit:   clamp(llmPop, 0, 100),
    environmental_gain:   clamp(llmEnv, 0, 100),
    urgency_alignment:    clamp(context.urgencyScore ?? 50, 0, 100),
    cross_domain_benefit: clamp(context.crossDomainScore ?? 30, 0, 100),
  };
}

/**
 * Derives feasibility input dimensions from the option and context.
 */
function deriveFeasibilityInputs(option, context) {
  const llmFeas     = clamp(option.feasibility_score ?? 50, 0, 100);
  const budgetScore = estimateBudgetFit(option, context);
  const authScore   = estimateAuthorityScore(option, context);
  const timeScore   = estimateTimelineScore(option);
  const constraintScore = estimateConstraintScore(option);

  return {
    implementation_ease:  clamp(llmFeas, 0, 100),
    budget_fit:           clamp(budgetScore, 0, 100),
    authority_alignment:  clamp(authScore, 0, 100),
    timeline_realism:     clamp(timeScore, 0, 100),
    constraint_clearance: clamp(constraintScore, 0, 100),
  };
}

/** Weighted sum of inputs against a weight map. */
function weightedSum(inputs, weights) {
  return round(
    Object.entries(weights).reduce((sum, [key, w]) => sum + (inputs[key] ?? 0) * w, 0),
    1,
  );
}

/**
 * Computes the % contribution of each dimension to the final score.
 * contribution_i = (weight_i * input_i) / score * 100
 */
function contributions(inputs, weights, score) {
  if (!score || score === 0) {
    return Object.fromEntries(Object.keys(weights).map((k) => [k, 0]));
  }
  return Object.fromEntries(
    Object.entries(weights).map(([key, w]) => [
      key,
      round(((inputs[key] ?? 0) * w) / score * 100, 1),
    ]),
  );
}

/** Returns the key with the highest contribution percentage. */
function topDriver(contrib) {
  return Object.entries(contrib).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
}

// -- Domain heuristics -------------------------------------------------------

function estimatePopulationScore(option, context) {
  // If specialist data says high population impact, boost score.
  const base = option.population_benefit ? 60 : 40;
  const boost = (context.populationDensityHigh ? 15 : 0) + (context.reportCount > 10 ? 10 : 0);
  return base + boost;
}

function estimateEnvironmentalScore(option, context) {
  const hasEnvEffect = option.environmental_effect && !option.environmental_effect.toLowerCase().includes('none');
  const aqiPenalty   = context.aqiHigh ? 20 : 0;  // High AQI boosts env urgency
  return hasEnvEffect ? 60 + aqiPenalty : 30 + aqiPenalty;
}

function estimateBudgetFit(option, context) {
  // Estimate how well the cost fits within typical authority annual budgets.
  // Thresholds (INR): < 10L = easy, < 1Cr = moderate, < 10Cr = challenging, >= 10Cr = difficult.
  const est = option.est_cost_inr ?? context.estimatedCostInr ?? 0;
  if (est <= 1_000_000)  return 90;   // <= 10L
  if (est <= 10_000_000) return 70;   // <= 1 Cr
  if (est <= 100_000_000) return 50;  // <= 10 Cr
  return 30;
}

function estimateAuthorityScore(option, context) {
  // High score if the target authority is active and has fast SLA.
  const auth = context.targetAuthority;
  if (!auth) return 50;
  const slaBonus = (auth.sla_hours ?? 48) <= 24 ? 10 : 0;
  return auth.active ? 75 + slaBonus : 30;
}

function estimateTimelineScore(option) {
  // Shorter timelines score higher. Scale: <= 3 months = 90, <= 6 = 75, <= 12 = 60, > 12 = 40.
  const months = Number(option.timeline_months) || 12;
  if (months <= 3)  return 90;
  if (months <= 6)  return 75;
  if (months <= 12) return 60;
  return 40;
}

function estimateConstraintScore(option) {
  // More constraint blocks = lower score.
  const applied = option.constraints_applied ?? [];
  const blocks   = applied.filter((c) => c.impact === 'block' || c.type === 'block').length;
  const approvals = applied.filter((c) => c.impact === 'approval_required').length;
  return Math.max(0, 100 - blocks * 30 - approvals * 15);
}

// -- Cross-option explanation ------------------------------------------------

function buildCrossOptionExplanation(scoredOptions) {
  if (scoredOptions.length === 0) return null;

  const top   = scoredOptions[0];
  const lines = [
    `${scoredOptions.length} option(s) ranked by XAI viability score (impact × 0.55 + feasibility × 0.45).`,
    `Top option: "${top.name || top.option?.name}" (viability ${top.viability}).`,
  ];

  if (scoredOptions.length > 1) {
    const second = scoredOptions[1];
    const impactDiff  = round((top.xai_scores.impact.score  - second.xai_scores?.impact?.score)  ?? 0, 1);
    const feasDiff    = round((top.xai_scores.feasibility.score - second.xai_scores?.feasibility?.score) ?? 0, 1);
    lines.push(
      `Compared to option 2 ("${second.name || second.option?.name}", viability ${second.viability}): ` +
      `impact Δ${impactDiff > 0 ? '+' : ''}${impactDiff}, feasibility Δ${feasDiff > 0 ? '+' : ''}${feasDiff}.`,
    );
  }

  lines.push(`Primary ranking driver: ${top.xai_scores.impact.top_driver} (impact) and ${top.xai_scores.feasibility.top_driver} (feasibility).`);
  return lines.join(' ');
}

function buildPrioritySummary(sorted, score) {
  const top = sorted[0];
  const label = score >= 75 ? 'Critical' : score >= 60 ? 'High' : score >= 40 ? 'Medium' : 'Low';
  const dimLabel = top?.[0]?.replace(/_/g, ' ') ?? 'severity';
  return `${label} priority (${score}). Primary driver: ${dimLabel} contributes ${top?.[1] ?? 0}% of score.`;
}
