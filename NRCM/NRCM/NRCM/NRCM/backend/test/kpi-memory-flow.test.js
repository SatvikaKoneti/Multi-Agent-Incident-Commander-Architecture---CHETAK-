import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';
import { bootTestServer, closeTestServer, api, login } from '../test-helpers/helpers.js';

const { recordKpi } = await import('../src/engine/kpi.js');

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

test('KPI delta arithmetic: observed minus predicted with lowerIsBetter inversion', async () => {
  const normal = recordKpi({ recommendationId: 999001, metricName: 'avg_speed_kmh', predicted: 18, observed: 15, unit: 'km/h', lowerIsBetter: false });
  assert.equal(normal.delta, -3);

  const aer = recordKpi({ recommendationId: 999001, metricName: 'trip_time_min', predicted: 40, observed: 35, unit: 'min', lowerIsBetter: true });
  assert.equal(aer.delta, 5, 'positive delta must mean worse-than-predicted');

  const noObserved = recordKpi({ recommendationId: 999001, metricName: 'pollutant_pm25', predicted: 62, observed: undefined, unit: 'ug/m3' });
  assert.equal(noObserved.delta, null);
});

test('full lifecycle: recommend -> approve -> implement -> KPI -> agent memory is stored and retrievable', async () => {
  const analysis = await api(base, 'POST', '/api/planner/analyses', {
    token: plannerToken,
    body: {
      localityId: 'osm-hitec-madhapur',
      title: 'Signal mis-timing at Inorbit junction',
      description: 'Left-turn signal phases cause spillback through the corridor in the evening peak.',
      category: 'Road Traffic',
    },
  });
  assert.equal(analysis.status, 201);
  assert.equal(analysis.data.status, 'recommended');
  const recId = analysis.data.recommendations.recommendation_id;
  const optionId = analysis.data.recommendations.options[0].id;
  const analysisId = analysis.data.analysis_id;

  // Planner approves the AI-recommended option (planner decides, AI recommends).
  const approve = await api(base, 'POST', `/api/planner/recommendations/${optionId}/approve`, {
    token: plannerToken,
    body: { planner_notes: 'Approved with a phased corridor-wide rollout.' },
  });
  assert.equal(approve.status, 200);
  assert.equal(approve.data.recommendation.status, 'approved');
  assert.equal(approve.data.approved_option_id, optionId);

  const approvedDetail = await api(base, 'GET', `/api/planner/analyses/${analysisId}`, { token: plannerToken });
  assert.equal(approvedDetail.data.analysis.status, 'approved');
  assert.equal(approvedDetail.data.recommendations.options.find((o) => o.id === optionId).is_recommended, 1);

  // Start implementation.
  const impl = await api(base, 'POST', '/api/planner/implementation', {
    token: plannerToken,
    body: { recommendationId: recId, recommendationOptionId: optionId, status: 'in_progress' },
  });
  assert.equal(impl.status, 201);
  const implId = impl.data.implementation.id;

  const implementingDetail = await api(base, 'GET', `/api/planner/analyses/${analysisId}`, { token: plannerToken });
  assert.equal(implementingDetail.data.analysis.status, 'implementing');

  // Record KPIs - predicted vs observed.
  const kpiPost = await api(base, 'POST', '/api/planner/kpis', {
    token: plannerToken,
    body: {
      recommendationId: recId,
      kpis: [
        { metricName: 'avg_speed_kmh', predicted: 15, observed: 21, unit: 'km/h', lowerIsBetter: false },
        { metricName: 'trip_time_min', predicted: 20, observed: 13, unit: 'min', lowerIsBetter: true },
      ],
    },
  });
  assert.equal(kpiPost.status, 201);
  assert.equal(kpiPost.data.kpis.length, 2);
  assert.equal(kpiPost.data.kpis[0].delta, 6);
  assert.equal(kpiPost.data.kpis[1].delta, 7);
  assert.ok(kpiPost.data.memory, 'memory entry should be written alongside KPIs');

  const kpis = await api(base, 'GET', `/api/planner/kpis/${recId}`, { token: plannerToken });
  assert.equal(kpis.status, 200);
  assert.equal(kpis.data.kpis.length, 2);

  // Memory is retrievable through the agent memory store.
  const memory = await api(base, 'GET', '/api/planner/memory', { token: plannerToken });
  assert.ok(memory.data.memories.some((m) => m.summary), 'memory list should include the stored case');
  assert.ok(memory.data.memories.some((m) => Array.isArray(m.tags)));

  // Complete implementation -> implemented.
  const done = await api(base, 'PATCH', `/api/planner/implementation/${implId}`, {
    token: plannerToken,
    body: { status: 'completed', notes: 'Works completed within the approved window.' },
  });
  assert.equal(done.status, 200);
  assert.equal(done.data.implementation.status, 'completed');

  const implementedDetail = await api(base, 'GET', `/api/planner/analyses/${analysisId}`, { token: plannerToken });
  assert.equal(implementedDetail.data.analysis.status, 'implemented');
});