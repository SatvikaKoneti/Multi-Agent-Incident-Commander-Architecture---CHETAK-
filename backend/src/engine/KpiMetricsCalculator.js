import { run, get, query } from '../db/index.js';
import { nowIso, round } from '../utils/index.js';
import { readCsv } from '../providers/telemetryDataLoaderProvider.js';

/**
 * KPI tracking: PREDICTED vs OBSERVED.
 * `metric_name` follows the kpi catalog in data/kpi_demo.csv.
 */
export function kpiCatalog() {
  return readCsv('kpi_demo.csv').map((r) => ({
    key: r.kpi_key,
    name: r.metric_name,
    description: r.description,
    baseline: Number(r.baseline),
    unit: r.unit,
  }));
}

export function baselineFor(metricName) {
  const row = readCsv('kpi_demo.csv').find((r) => r.kpi_key === metricName);
  return row
    ? { metric_name: row.metric_name, description: row.description, baseline: Number(row.baseline), unit: row.unit }
    : null;
}

export function derivePredicted(option) {
  return {
    implementation_cost: option.est_cost_inr || 0,
    expected_impact: option.impact_score || 0,
    timeline_months: option.timeline_months || 12,
    population_benefit: option.population_benefit || '',
  };
}

/**
 * delta = observed - predicted by default; when lowerIsBetter=true the sign is
 * inverted so a positive delta always means "worse than predicted".
 */
export function recordKpi({ recommendationId, recommendationOptionId, metricName, predicted, observed, unit, baseline, notes, lowerIsBetter = false }) {
  let delta = null;
  const p = Number(predicted);
  const o = Number(observed);
  if (Number.isFinite(p) && Number.isFinite(o)) {
    delta = round(lowerIsBetter ? p - o : o - p, 2);
  }
  run(
    `INSERT INTO kpis (recommendation_id, recommendation_option_id, metric_name, predicted, observed, delta, baseline, unit, measured_at, notes)
     VALUES ($rec, $opt, $metric, $predicted, $observed, $delta, $baseline, $unit, $measured, $notes)`,
    {
      $rec: recommendationId,
      $opt: recommendationOptionId === undefined || recommendationOptionId === null ? null : recommendationOptionId,
      $metric: metricName,
      $predicted: predicted === undefined || predicted === null ? null : String(predicted),
      $observed: observed === undefined || observed === null ? null : String(observed),
      $delta: delta,
      $baseline: baseline === undefined ? null : String(baseline),
      $unit: unit || '',
      $measured: nowIso(),
      $notes: notes || '',
    },
  );
  return get('SELECT * FROM kpis WHERE id = (SELECT last_insert_rowid())');
}

export function listKpisForRecommendation(recommendationId) {
  return query('SELECT * FROM kpis WHERE recommendation_id = ? ORDER BY created_at DESC', [recommendationId]).map((r) => ({
    ...r,
    predicted: r.predicted === 'null' || r.predicted === null ? null : r.predicted,
    observed: r.observed === 'null' || r.observed === null ? null : r.observed,
  }));
}

export async function writeKpisWithMemory({ recommendationId, kpis, ai, analysisId, problem, recommendationName, plannerDecision }) {
  const results = [];
  for (const k of kpis) {
    results.push(recordKpi({ recommendationId, ...k }));
  }
  if (ai) {
    const { runMemoryAgent } = await import('../agents/index.js');
    const stored = await runMemoryAgent({
      ai,
      analysisId,
      problem,
      recommendation: recommendationName,
      decision: plannerDecision,
      implementationResult: 'KPI recorded; outcome tracked.',
      kpis,
      feedback: null,
    });
    return { kpis: results, memory: stored };
  }
  return { kpis: results, memory: null };
}