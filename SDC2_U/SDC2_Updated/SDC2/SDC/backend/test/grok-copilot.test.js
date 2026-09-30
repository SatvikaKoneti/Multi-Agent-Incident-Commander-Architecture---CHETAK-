import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';
import { bootTestServer, closeTestServer, api, login } from '../test-helpers/helpers.js';

let server;
let base;
let plannerToken;
let citizenToken;

before(async () => {
  const boot = await bootTestServer();
  server = boot.server;
  base = boot.base;
  plannerToken = await login(base, 'planner');
  citizenToken = await login(base, 'citizen');
});

after(async () => {
  await closeTestServer(server);
});

test('copilot presets endpoint returns starter prompts for planner', async () => {
  const res = await api(base, 'GET', '/api/planner/copilot/presets', { token: plannerToken });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data.presets));
  assert.ok(res.data.presets.length >= 3);
  assert.ok(res.data.presets.some((p) => p.id.includes('begumpet')));
});

test('copilot rejects non-planner roles with 403', async () => {
  const res = await api(base, 'POST', '/api/planner/copilot', {
    token: citizenToken,
    body: { message: 'Hello copilot' },
  });
  assert.equal(res.status, 403);
});

test('copilot validates required message payload', async () => {
  const res = await api(base, 'POST', '/api/planner/copilot', {
    token: plannerToken,
    body: {},
  });
  assert.equal(res.status, 400);
});

test('copilot handles query with locality/cluster context and returns structured guidance', async () => {
  const res = await api(base, 'POST', '/api/planner/copilot', {
    token: plannerToken,
    body: {
      message: 'What are the main traffic pain points around Cyber Towers?',
      localityId: 'osm-madhapur',
    },
  });
  assert.equal(res.status, 200);
  assert.equal(res.data.ok, true);
  assert.ok(typeof res.data.reply === 'string' && res.data.reply.length > 0);
  assert.ok(Array.isArray(res.data.suggestedActions));
  assert.ok(res.data.suggestedActions.length > 0);
});
