import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';
import { bootTestServer, closeTestServer, api, login, postComplaint, tinyPngBuffer } from '../test-helpers/helpers.js';

let server;
let base;

before(async () => {
  const boot = await bootTestServer();
  server = boot.server;
  base = boot.base;
});

after(async () => {
  await closeTestServer(server);
});

test('meta endpoint reports a demo provider registry and configured AI', async () => {
  const meta = await api(base, 'GET', '/api/meta');
  assert.equal(meta.status, 200);
  assert.equal(meta.data.ai.configured, true);
  assert.ok(Object.values(meta.data.providers).every((p) => p.isDemo === true));
  const health = await api(base, 'GET', '/api/ai/health');
  assert.equal(health.status, 200);
});

test('end-to-end: citizen registers and submits a multimodal complaint that AI classifies', async () => {
  const reg = await api(base, 'POST', '/api/auth/register', {
    body: { name: 'Test Citizen', email: 'test-citizen@example.com', password: 'pass1234' },
  });
  assert.equal(reg.status, 201);
  const citizenToken = reg.data.token;

  const submit = await postComplaint(base, citizenToken, {
    title: 'Dense smoke from idling autos at IT park gate',
    description: 'Bad air at the IT park gate where autorickshaws idle for hours.',
    locality: 'HITEC City / Madhapur',
    severity_input: '8',
  }, { image: new Blob([tinyPngBuffer()], { type: 'image/png' }) });
  assert.equal(submit.status, 201);
  assert.match(submit.data.tracking_id, /^HYD-2026-\d+$/);
  assert.ok(submit.data.classification, 'multimodal AI classification expected');
  assert.equal(submit.data.classification.category, 'Air Pollution');

  const me = await api(base, 'GET', '/api/auth/me', { token: citizenToken });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.email, 'test-citizen@example.com');

  const mine = await api(base, 'GET', `/api/complaints?status=in_review`, { token: citizenToken });
  assert.ok(mine.data.complaints.some((c) => c.tracking_id === submit.data.tracking_id));
});

test('agent pipeline is traceable end to end with evidence references on the dashboard', async () => {
  const plannerToken = await login(base, 'planner');

  const dashboard = await api(base, 'GET', '/api/planner/dashboard', { token: plannerToken });
  assert.equal(dashboard.status, 200);
  assert.ok(dashboard.data.top_problems.length >= 1);
  assert.ok(Object.values(dashboard.data.providers).every((p) => p.isDemo === true));

  const locDash = await api(base, 'GET', '/api/planner/localities/osm-gachibowli/dashboard', { token: plannerToken });
  assert.equal(locDash.status, 200);
  assert.ok(locDash.data.domain.energy, 'energy domain data expected for Gachibowli');
  assert.equal(locDash.data.domain.energy.is_demo, true);

  const analysis = await api(base, 'POST', '/api/planner/analyses', {
    token: plannerToken,
    body: {
      localityId: 'osm-gachibowli',
      title: 'Grid strain under peak evening load',
      description: 'Feeder GB-1101 peaks at 48.5 MW against 52 MW installed capacity with interruptions detected.',
      sourceComplaintIds: [],
    },
  });
  assert.equal(analysis.status, 201);

  const detail = await api(base, 'GET', `/api/planner/analyses/${analysis.data.analysis_id}`, { token: plannerToken });
  assert.equal(detail.status, 200);
  assert.ok(detail.data.runs.length >= 4, 'coordinator/energy/fusion/clarification runs expected');
  const evidenceInResults = detail.data.runs.some((r) => (r.results || []).some((res) => JSON.parse(res.evidence).length > 0));
  assert.equal(evidenceInResults, true);
});