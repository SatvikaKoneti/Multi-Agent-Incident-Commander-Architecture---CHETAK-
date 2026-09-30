import { clamp, round } from '../utils/index.js';

/**
 * Priority Score = 30% Severity + 25% Population Impact + 20% Environmental
 * Impact + 15% Urgency + 10% Feasibility.
 * All dimension inputs are normalized to a clear 0-100 scale.
 */
export function computePriority({ severity, population_impact, environmental_impact, urgency, feasibility }) {
  const dims = {
    severity: clamp(severity ?? 0, 0, 100),
    population_impact: clamp(population_impact ?? 0, 0, 100),
    environmental_impact: clamp(environmental_impact ?? 0, 0, 100),
    urgency: clamp(urgency ?? 0, 0, 100),
    feasibility: clamp(feasibility ?? 0, 0, 100),
  };
  const score = round(
    dims.severity * 0.3 +
      dims.population_impact * 0.25 +
      dims.environmental_impact * 0.2 +
      dims.urgency * 0.15 +
      dims.feasibility * 0.1,
    1,
  );
  return {
    score,
    dimensions: dims,
    weights: { severity: 0.3, population_impact: 0.25, environmental_impact: 0.2, urgency: 0.15, feasibility: 0.1 },
    formula: 'Priority Score = 30%*Severity + 25%*PopulationImpact + 20%*EnvironmentalImpact + 15%*Urgency + 10%*Feasibility',
  };
}

export function priorityLevel(score) {
  if (score >= 80) return { level: 'Critical', color: '#ef4444' };
  if (score >= 65) return { level: 'High', color: '#f97316' };
  if (score >= 50) return { level: 'Medium', color: '#eab308' };
  return { level: 'Low', color: '#22c55e' };
}