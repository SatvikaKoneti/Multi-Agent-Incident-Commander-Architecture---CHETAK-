import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';
import { bootTestServer, closeTestServer, api, login, postComplaint, tinyPngBuffer } from '../test-helpers/helpers.js';

let server;
let base;
let citizenToken;
let plannerToken;

before(async () => {
  const boot = await bootTestServer();
  server = boot.server;
  base = boot.base;
  citizenToken = await login(base, 'citizen');
  plannerToken = await login(base, 'planner');
});

after(async () => {
  await closeTestServer(server);
});

test('citizen submits a text+image complaint and receives a valid tracking ID', async () => {
  const { status, data } = await postComplaint(base, citizenToken, {
    title: 'Gridlock near Inorbit on HITEC City Main Road',
    description: 'Evening peak congestion makes crossing take twenty minutes. Image attached.',
    category: '',
    locality: 'HITEC City / Madhapur',
    lat: '17.4496',
    lng: '78.3847',
    severity_input: '9',
  }, { image: new Blob([tinyPngBuffer()], { type: 'image/png' }) });

  assert.equal(status, 201);
  assert.match(data.tracking_id, /^HYD-2026-\d+$/);
  assert.equal(data.status, 'submitted');
  // Real multimodal classification runs (test double) when AI is configured.
  assert.ok(data.classification, 'classification record should exist');
  assert.equal(data.classification.ai_error, undefined);
  assert.match(data.classification.complaint.image_path, /^uploads\/.+\.png$/);
  // The base row stays 'open' until the planner moves it into review.
  assert.equal(data.complaint.status, 'open');
  assert.equal(data.classification.complaint.status, 'in_review');
  assert.ok(data.classification.complaint.priority_score > 0);
});

test('complaint is trackable by public tracking endpoint', async () => {
  const submitted = await postComplaint(base, citizenToken, {
    title: 'Faded lane markings on KPHB road',
    description: 'Lane markings faded after resurfacing near the depot.',
    category: 'Road Traffic',
    locality: 'Kukatpally',
  });
  const { status, data } = await api(base, 'GET', `/api/complaints/track/${submitted.data.tracking_id}`);
  assert.equal(status, 200);
  assert.equal(data.complaint.tracking_id, submitted.data.tracking_id);
  assert.ok(Array.isArray(data.timeline));
  assert.equal(data.timeline[0].step, 'Submitted');
  assert.equal(data.timeline[0].status, 'done');
});

test('complaint submission validates required fields', async () => {
  const { status, data } = await api(base, 'POST', '/api/complaints', { token: citizenToken, body: { description: 'missing title' } });
  assert.equal(status, 400);
  assert.match(data.error, /title and description/);
});

test('unknown tracking ID returns 404', async () => {
  const { status } = await api(base, 'GET', '/api/complaints/track/HYD-2026-999999');
  assert.equal(status, 404);
});

test('planner can list locality complaints and run bulk classification', async () => {
  const list = await api(base, 'GET', '/api/planner/localities/osm-hitec-madhapur/complaints', { token: plannerToken });
  assert.equal(list.status, 200);
  assert.ok(list.data.complaints.length >= 1);

  const classify = await api(base, 'POST', '/api/planner/localities/osm-hitec-madhapur/classify', { token: plannerToken });
  assert.equal(classify.status, 200);
  assert.ok(classify.data.classified > 0);
  const after = await api(base, 'GET', '/api/planner/localities/osm-hitec-madhapur/complaints', { token: plannerToken });
  assert.ok(after.data.complaints.some((c) => c.ai_classified && c.priority_score !== null));
});

test('login rejects bad credentials', async () => {
  const { status } = await api(base, 'POST', '/api/auth/login', { body: { email: 'planner@hyd.city', password: 'wrong' } });
  assert.equal(status, 401);
});

test('protected planner routes reject citizen role', async () => {
  const { status } = await api(base, 'GET', '/api/planner/dashboard', { token: citizenToken });
  assert.equal(status, 403);
});