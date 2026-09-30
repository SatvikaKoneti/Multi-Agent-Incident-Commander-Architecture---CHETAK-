import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';
import { bootTestServer, closeTestServer, api, login } from '../test-helpers/helpers.js';

let server;
let base;
let plannerToken;
let authorityToken;

before(async () => {
  const boot = await bootTestServer();
  server = boot.server;
  base = boot.base;
  plannerToken = await login(base, 'planner');
  authorityToken = await login(base, 'authority');
});

after(async () => {
  await closeTestServer(server);
});

async function energyAnalysis() {
  const { status, data } = await api(base, 'POST', '/api/planner/analyses', {
    token: plannerToken,
    body: {
      localityId: 'osm-gachibowli',
      title: 'Transformer and feeder overload in Gachibowli',
      description: 'Frequent interruptions near feeder GB-1101 with peak demand 48.5 MW against 52 MW installed capacity.',
      category: 'Energy / Power Supply',
    },
  });
  assert.equal(status, 201);
  return data;
}

test('full authority clarification loop: planner gates the send, authority responds, AI refines', async () => {
  const analysis = await energyAnalysis();
  const requestId = analysis.clarification.requestId;
  assert.equal(analysis.status, 'awaiting_clarification');

  // Draft is not visible to the authority until the planner approves and sends.
  let inbox = await api(base, 'GET', '/api/authority/inbox', { token: authorityToken });
  assert.equal(inbox.status, 200);
  assert.equal(inbox.data.authority.code, 'TSSPDCL');
  assert.equal(inbox.data.inbox.length, 0, 'draft must not be in the authority inbox');

  // Only drafts can be edited/sent; the message is still editable pre-send.
  const edit = await api(base, 'POST', `/api/planner/clarifications/${requestId}/edit`, {
    token: plannerToken,
    body: { message: 'Edited clarification message to TSSPDCL requesting feeder load profiles and reinforcement plans.' },
  });
  assert.equal(edit.status, 200);
  assert.match(edit.data.request.message, /Edited clarification/);

  // Planner approves and sends - the request becomes visible.
  const sent = await api(base, 'POST', `/api/planner/clarifications/${requestId}/approve-send`, { token: plannerToken });
  assert.equal(sent.status, 200);
  assert.equal(sent.data.status, 'sent');
  const analysisDetail = await api(base, 'GET', `/api/planner/analyses/${analysis.analysis_id}`, { token: plannerToken });
  assert.equal(analysisDetail.data.analysis.status, 'awaiting_authority');

  inbox = await api(base, 'GET', '/api/authority/inbox', { token: authorityToken });
  assert.equal(inbox.data.inbox.length, 1);
  assert.equal(inbox.data.inbox[0].id, requestId);

  // Re-sending is idempotent.
  const resend = await api(base, 'POST', `/api/planner/clarifications/${requestId}/approve-send`, { token: plannerToken });
  assert.equal(resend.data.status, 'already_sent');

  // Authority acknowledges then responds; response is AI-interpreted and recommendations refined.
  const ack = await api(base, 'POST', `/api/authority/requests/${requestId}/acknowledge`, { token: authorityToken });
  assert.equal(ack.status, 200);
  assert.equal(ack.data.request.status, 'acknowledged');

  const respond = await api(base, 'POST', `/api/authority/requests/${requestId}/respond`, {
    token: authorityToken,
    body: { response: 'Planned feeder load transfers will complete in two cycles; additional infrastructure information is available for planning.' },
  });
  assert.equal(respond.status, 200);
  assert.ok(respond.data.interpretation.provides_clarification);
  assert.ok(respond.data.refined_options.ranked.length >= 1, 'recommendations must be refined after authority input');

  const afterRespond = await api(base, 'GET', `/api/planner/analyses/${analysis.analysis_id}`, { token: plannerToken });
  assert.equal(afterRespond.data.analysis.status, 'refined');
  assert.equal(afterRespond.data.clarifications[0].status, 'responded');
  assert.ok(afterRespond.data.clarifications[0].responses.length === 1);

  // A second response is rejected.
  const dup = await api(base, 'POST', `/api/authority/requests/${requestId}/respond`, {
    token: authorityToken,
    body: { response: 'Duplicate response.' },
  });
  assert.equal(dup.status, 409);
});

test('planner can reject a clarification draft and proceed without authority input', async () => {
  const analysis = await energyAnalysis();
  const requestId = analysis.clarification.requestId;
  const rejected = await api(base, 'POST', `/api/planner/clarifications/${requestId}/reject`, {
    token: plannerToken,
    body: { planner_notes: 'Existing records are sufficient for now.' },
  });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.data.request.status, 'rejected');

  const detail = await api(base, 'GET', `/api/planner/analyses/${analysis.analysis_id}`, { token: plannerToken });
  assert.equal(detail.data.analysis.status, 'recommended');

  // Cannot send a rejected request.
  const send = await api(base, 'POST', `/api/planner/clarifications/${requestId}/approve-send`, { token: plannerToken });
  assert.equal(send.status, 409);
});