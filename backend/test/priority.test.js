import { test } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';

const { computePriority, priorityLevel } = await import('../src/engine/IncidentPriorityRanker.js');

test('priority score uses the exact mandated weights', () => {
  // 30% severity + 25% population + 20% environment + 15% urgency + 10% feasibility
  const r = computePriority({ severity: 100, population_impact: 100, environmental_impact: 100, urgency: 100, feasibility: 100 });
  assert.equal(r.score, 100);
  assert.deepEqual(r.weights, { severity: 0.3, population_impact: 0.25, environmental_impact: 0.2, urgency: 0.15, feasibility: 0.1 });

  const mixed = computePriority({ severity: 80, population_impact: 60, environmental_impact: 40, urgency: 50, feasibility: 70 });
  const expected = 80 * 0.3 + 60 * 0.25 + 40 * 0.2 + 50 * 0.15 + 70 * 0.1;
  assert.equal(mixed.score, Math.round(expected * 10) / 10);
});

test('priority normalises inputs to a clear 0-100 scale', () => {
  const r = computePriority({ severity: 250, population_impact: -20, environmental_impact: 80, urgency: 90, feasibility: 100 });
  assert.equal(r.dimensions.severity, 100);
  assert.equal(r.dimensions.population_impact, 0);
  assert.equal(r.score, 100 * 0.3 + 0 * 0.25 + 80 * 0.2 + 90 * 0.15 + 100 * 0.1);
});

test('priority levels are interpretable', () => {
  assert.equal(priorityLevel(90).level, 'Critical');
  assert.equal(priorityLevel(70).level, 'High');
  assert.equal(priorityLevel(55).level, 'Medium');
  assert.equal(priorityLevel(30).level, 'Low');
});