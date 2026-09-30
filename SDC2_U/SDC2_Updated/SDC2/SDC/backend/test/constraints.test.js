import { test } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';

const { estimateCost, formatCostInr } = await import('../src/engine/costs.js');
const { applyConstraints } = await import('../src/engine/constraints.js');
const { providerRegistry } = await import('../src/providers/index.js');

test('cost engine totals components with 8% overhead and INR formatting', () => {
  const { estimated_cost_inr, overhead_inr, breakdown } = estimateCost(['cement_concrete', 'signal_head'], { providers: providerRegistry });
  const base = providerRegistry.cost.rate('cement_concrete') + providerRegistry.cost.rate('signal_head');
  assert.equal(breakdown.reduce((s, c) => s + c.subtotal_inr, 0), base);
  assert.equal(estimated_cost_inr, Math.round(base * 1.08));
  assert.equal(overhead_inr, estimated_cost_inr - base);
  assert.match(formatCostInr(1234567), /12,34,567/);
});

test('constraint filter flags land + utility approval for battery storage on TSSPDCL option', () => {
  const option = {
    name: 'Feeder load balancing with demand management',
    description: 'test',
    components: ['feeder_reconduction', 'transformer_11kv', 'battery_storage'],
    expected_impact: 'test',
    impact_score: 72,
    feasibility_score: 68,
    timeline_months: 9,
    environmental_effect: 'Positive but minor',
    energy_effect: 'Negligible',
    population_benefit: 'Direct',
    risks: [],
    dependencies: [],
    why_generated: 'test',
    target_authority: 'TSSPDCL',
  };
  const [r] = applyConstraints({ options: [option], locality: providerRegistry.urbanObservatory.getLocalityInfo('Gachibowli'), providers: providerRegistry });
  const types = r.constraints_applied.map((c) => c.type);
  assert.ok(types.includes('utility'), 'TSSPDCL utility window should be flagged');
  assert.ok(types.includes('land'), 'battery storage should trigger land constraint');
  assert.equal(r.blocked, false);
  assert.ok(r.cost_estimate.estimated_cost_inr > 0);
});

test('viability formula is the interpretable composite', () => {
  const option = {
    name: 'x', description: 'x', components: ['cement_concrete'],
    impact_score: 80, feasibility_score: 70, timeline_months: 6,
    environmental_effect: 'Positive improves air', population_benefit: 'x', risks: [], dependencies: [],
    why_generated: 'x', target_authority: 'GHMC',
  };
  const [r] = applyConstraints({ options: [option], locality: providerRegistry.urbanObservatory.getLocalityInfo('Kukatpally'), providers: providerRegistry });
  const expected = 0.4 * 80 + 0.3 * 70 + 0.2 * (100 - 6 * 5) + 0.1 * 90;
  assert.equal(r.viability, Math.round(expected));
});

test('budget overrun blocks an option with a block reason', () => {
  const option = {
    name: 'Gold-plated', description: 'x',
    components: ['feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction', 'feeder_reconduction'],
    impact_score: 60, feasibility_score: 70, timeline_months: 6,
    environmental_effect: 'Positive', population_benefit: 'x', risks: [], dependencies: [],
    why_generated: 'x', target_authority: 'GHMC',
  };
  const [r] = applyConstraints({ options: [option], locality: providerRegistry.urbanObservatory.getLocalityInfo('Kukatpally'), providers: providerRegistry });
  assert.equal(r.blocked, true);
  assert.ok(r.constraints_applied.some((c) => c.impact === 'block' && c.type === 'budget'));
});