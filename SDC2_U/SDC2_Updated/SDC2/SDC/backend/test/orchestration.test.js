import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';
import { bootTestServer, closeTestServer, api, login } from '../test-helpers/helpers.js';

let server;
let base;
let plannerToken;

before(async () => {
  const boot = await bootTestServer();
  server = boot.server;
  base = boot.base;
  plannerToken = await login(base, 'planner');
});

after(async () => {
  await closeTestServer(server);
});

function runAnalysis(payload) {
  return api(base, 'POST', '/api/planner/analyses', { token: plannerToken, body: payload });
}

test('energy scenario: coordinator dynamically selects the Energy Agent and requests clarification', async () => {
  const { status, data } = await runAnalysis({
    localityId: 'osm-gachibowli',
    title: 'Transformer and feeder overload in Gachibowli',
    description: 'Frequent interruptions near feeder GB-1101 with peak demand 48.5 MW against 52 MW installed capacity.',
    category: 'Energy / Power Supply',
  });
  assert.equal(status, 201);
  assert.equal(data.status, 'awaiting_clarification');

  const agentNames = data.agent_results.map((r) => r.agent);
  assert.ok(agentNames.includes('energy'), 'energy agent must run');
  assert.ok(!agentNames.includes('traffic'), 'coordinator must not run irrelevant specialists');

  const energy = data.agent_results.find((r) => r.agent === 'energy');
  assert.ok(['48.5', '93.3'].some((v) => energy.result.summary.includes(v)), 'energy must synthesise the actual usage data');
  assert.equal(energy.result.evidence_refs[0], 'energy-feeder');

  assert.ok(data.coordinator.clarification_required);
  assert.ok(data.clarification && data.clarification.requestId, 'a draft clarification must be created');
  assert.equal(data.clarification.status, 'draft');
  assert.equal(data.clarification.authority.code, 'TSSPDCL');

  assert.ok(data.recommendations && data.recommendations.options.length >= 2, 'recommendations should still be generated for consideration');

  const detail = await api(base, 'GET', `/api/planner/analyses/${data.analysis_id}`, { token: plannerToken });
  assert.equal(detail.status, 200);
  assert.equal(detail.data.analysis.status, 'awaiting_clarification');
  assert.equal(detail.data.clarifications.length, 1);
  assert.equal(detail.data.clarifications[0].status, 'draft');
  assert.ok(detail.data.recommendations.options.some((o) => o.constraints_applied.some((c) => c.type === 'utility')));
});

test('traffic scenario: coordinator selects Traffic + Pollution, completes with recommendations (no clarification)', async () => {
  const { status, data } = await runAnalysis({
    localityId: 'osm-hitec-madhapur',
    title: 'Evening congestion gridlock at Inorbit junction',
    description: 'Vehicles queue for twenty minutes at the Inorbit Mall Junction with heavy congestion on HITEC City Main Road.',
    category: 'Road Traffic',
  });
  assert.equal(status, 201);
  assert.equal(data.status, 'recommended');
  assert.equal(data.coordinator.clarification_required, false);

  const agentNames = data.agent_results.map((r) => r.agent);
  assert.ok(agentNames.includes('traffic'));
  assert.ok(agentNames.includes('pollution'));
  assert.ok(!agentNames.includes('energy'));
  assert.ok(data.recommendations.options.length >= 2);
  assert.ok(data.recommendations.options.every((o) => o.rank >= 1 && o.viability > 0));
});

test('waste scenario: coordinator flags a specialist gap but an initial recommendation is still produced', async () => {
  const { status, data } = await runAnalysis({
    localityId: 'osm-kukatpally',
    title: 'Overflowing waste bins across Kukatpally',
    description: 'Community bins overflowing with mixed garbage and no collection schedule.',
    category: 'Waste Management',
  });
  assert.equal(status, 201);
  assert.equal(data.new_specialist_required, true);
  assert.ok(data.new_specialist_reason.length > 0);
  assert.notEqual(data.status, 'awaiting_specialist', 'must not short-circuit to awaiting_specialist without a recommendation');
  assert.ok(data.recommendations && data.recommendations.options.length >= 1, 'an initial recommendation must exist for the planner');
  assert.ok(Array.isArray(data.recommendations.missing_information), 'initial recommendation must state missing information');
  assert.ok(Array.isArray(data.recommendations.assumptions), 'initial recommendation must state assumptions');
  assert.ok('uncertainty' in data.recommendations, 'initial recommendation must state uncertainty');
  assert.ok(Array.isArray(data.recommendations.verification_needed), 'initial recommendation must state verification needs');
});

test('analyses list and AI activity endpoints surface the runs', async () => {
  const list = await api(base, 'GET', '/api/planner/analyses', { token: plannerToken });
  assert.equal(list.status, 200);
  assert.ok(list.data.analyses.length >= 3);

  const id = list.data.analyses[0].id;
  const runs = await api(base, 'GET', `/api/planner/runs/${id}`, { token: plannerToken });
  assert.equal(runs.status, 200);
  assert.ok(runs.data.runs.length > 0);
  assert.ok(runs.data.runs.some((r) => r.status === 'complete'));
});