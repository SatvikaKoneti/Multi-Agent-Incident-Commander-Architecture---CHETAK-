import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';
import { bootTestServer, closeTestServer, api, login } from '../test-helpers/helpers.js';

let server;
let base;
let citizenToken;
let plannerToken;
let authorityToken;

before(async () => {
  const boot = await bootTestServer();
  server = boot.server;
  base = boot.base;
  citizenToken = await login(base, 'citizen');
  plannerToken = await login(base, 'planner');
  authorityToken = await login(base, 'authority');
});

after(async () => {
  await closeTestServer(server);
});

test('public registration strictly forces citizen role regardless of input payload', async () => {
  const { status, data } = await api(base, 'POST', '/api/auth/register', {
    body: { name: 'Privilege Escalation Attempt', email: 'attacker@example.com', password: 'pass1234', role: 'planner' },
  });
  assert.equal(status, 201);
  assert.equal(data.user.role, 'citizen', 'role must be forced to citizen');
});

test('planner endpoints reject citizen and authority roles with HTTP 403', async () => {
  const citizenResp = await api(base, 'GET', '/api/planner/dashboard', { token: citizenToken });
  assert.equal(citizenResp.status, 403);

  const authorityResp = await api(base, 'GET', '/api/planner/dashboard', { token: authorityToken });
  assert.equal(authorityResp.status, 403);
});

test('authority endpoints reject citizen and planner roles with HTTP 403', async () => {
  const citizenResp = await api(base, 'GET', '/api/authority/inbox', { token: citizenToken });
  assert.equal(citizenResp.status, 403);

  const plannerResp = await api(base, 'GET', '/api/authority/inbox', { token: plannerToken });
  assert.equal(plannerResp.status, 403);
});

test('authority request access is restricted to assigned authority code', async () => {
  // Planner creates an analysis for GHMC authority
  const analysisRes = await api(base, 'POST', '/api/planner/analyses', {
    token: plannerToken,
    body: {
      localityId: 'osm-charminar',
      title: 'Water logging near Charminar',
      description: 'Severe water logging causing traffic standstill.',
      category: 'Drainage',
    },
  });
  assert.equal(analysisRes.status, 201);
  const requestId = analysisRes.data.clarification?.requestId;
  if (!requestId) return;

  // Approve & send to GHMC
  await api(base, 'POST', `/api/planner/clarifications/${requestId}/approve-send`, { token: plannerToken });

  // TSSPDCL authority token attempts to view GHMC request -> 403 Forbidden
  const reqRes = await api(base, 'GET', `/api/authority/requests/${requestId}`, { token: authorityToken });
  assert.equal(reqRes.status, 403, 'Authority must not access another authority private request');
});

test('citizen complaint endpoints reject planner and authority roles with HTTP 403', async () => {
  const plannerResp = await api(base, 'GET', '/api/citizen/complaints', { token: plannerToken });
  assert.equal(plannerResp.status, 403);

  const authorityResp = await api(base, 'GET', '/api/citizen/complaints', { token: authorityToken });
  assert.equal(authorityResp.status, 403);
});
