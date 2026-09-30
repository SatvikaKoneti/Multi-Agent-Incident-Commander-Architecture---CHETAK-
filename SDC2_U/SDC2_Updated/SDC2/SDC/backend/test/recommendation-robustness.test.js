import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';
import { bootTestServer, closeTestServer, api, login } from '../test-helpers/helpers.js';

const { AIProvider } = await import('../src/ai/provider.js');
const { FakeAIProvider } = await import('../src/ai/fake.js');
const { setAI } = await import('../src/di.js');

/**
 * Builds a provider that delegates everything to FakeAIProvider EXCEPT the
 * recommendation agent, which is answered by a REAL AIProvider whose _chat is
 * scripted with the given raw contents (so extractJSON + the controlled strict
 * retry inside generateStructured are exercised end to end).
 */
function scriptedRecommendProvider(contents) {
  const base = new FakeAIProvider();
  const real = new AIProvider({ apiKey: 'x-test', model: 'test' });
  const calls = [];
  real._chat = async ({ messages }) => {
    calls.push(messages.map((m) => ({ role: m.role, content: m.content })));
    const content = contents[Math.min(calls.length - 1, contents.length - 1)];
    return { content };
  };
  base.generateStructured = async (params) => {
    if (params.metadata?.agent === 'recommend') return real.generateStructured(params);
    return FakeAIProvider.prototype.generateStructured.call(base, params);
  };
  base.__recommendCalls = calls;
  return base;
}

function validRecommendationJson() {
  const data = new FakeAIProvider()._recommend('HITEC City / Madhapur congestion GHMC HTP TSSPDCL');
  return JSON.stringify(data, null, 2);
}

// Mimics the exact runtime failure: the recommendation response starts with
// context_diagnosis but is cut off mid-object (truncated by the token limit),
// so it can never be parsed as a complete JSON object.
function truncatedRecommendation() {
  return '{\n  "context_diagnosis": "Madhapur (HITEC City) suffers from severe congestion during evening peak hours with vehicles queueing for over twenty minutes at the Inorbit Mall Junction",\n  "options": [\n    {\n      "name": "Adaptive signal coordination",\n      "description": "Install adaptive signal controllers at the critical junction';
}

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

function trafficPayload() {
  return {
    localityId: 'osm-hitec-madhapur',
    title: 'Evening congestion gridlock at Inorbit junction',
    description: 'Vehicles queue for twenty minutes at the Inorbit Mall Junction with heavy congestion on HITEC City Main Road.',
    category: 'Road Traffic',
  };
}

test('A: a valid recommendation JSON response succeeds', async () => {
  setAI(new FakeAIProvider());
  const { status, data } = await runAnalysis(trafficPayload());
  assert.equal(status, 201);
  assert.equal(data.status, 'recommended');
  assert.ok(data.recommendations && data.recommendations.options.length >= 1, 'recommendation options must be produced');
  assert.ok(Boolean(data.recommendations.diagnosis), 'context_diagnosis must be preserved');
});

test('B: a recommendation wrapped in ```json fences succeeds', async () => {
  setAI(scriptedRecommendProvider([`\`\`\`json\n${validRecommendationJson()}\n\`\`\``]));
  const { status, data } = await runAnalysis(trafficPayload());
  assert.equal(status, 201);
  assert.equal(data.status, 'recommended');
  assert.ok(data.recommendations && data.recommendations.options.length >= 1, 'fenced JSON must still parse');
});

test('C: a malformed first recommendation response triggers exactly one controlled retry and succeeds', async () => {
  const provider = scriptedRecommendProvider([truncatedRecommendation(), validRecommendationJson()]);
  setAI(provider);

  const { status, data } = await runAnalysis(trafficPayload());
  assert.equal(status, 201);
  assert.equal(data.status, 'recommended', 'the strict retry must recover the recommendation');
  assert.ok(data.recommendations && data.recommendations.options.length >= 1);

  const calls = provider.__recommendCalls;
  assert.equal(calls.length, 2, 'exactly one retry - never more');
  assert.ok(
    calls[1]?.some((m) => m.role === 'user' && /Retry now with ONLY one complete, compact, valid JSON object/.test(m.content)),
    'the retry must use the strict compact instruction',
  );
  assert.ok(calls[1]?.some((m) => m.role === 'assistant' && m.content.includes('context_diagnosis')), 'the malformed prior response must be shown back to the model');
});

test('D: a malformed retry still fails cleanly into recommendation_failed, never stuck in running', async () => {
  const provider = scriptedRecommendProvider([truncatedRecommendation(), truncatedRecommendation()]);
  setAI(provider);

  const { status, data } = await runAnalysis(trafficPayload());
  assert.equal(status, 201);
  assert.equal(data.status, 'recommendation_failed', 'a clear recommendation-generation failure state must be returned');
  assert.notEqual(data.status, 'running');
  assert.equal(data.recommendations, null, 'no fabricated recommendation');
  assert.ok(data.recommendation_failure, 'the failure reason must be exposed to the planner');
  assert.ok(!data.authority_request, 'no unnecessary authority request may be created');

  const calls = provider.__recommendCalls;
  assert.equal(calls.length, 2, 'one retry max, never indefinite');

  const detail = await api(base, 'GET', `/api/planner/analyses/${data.analysis_id}`, { token: plannerToken });
  assert.equal(detail.status, 200);
  assert.equal(detail.data.analysis.status, 'recommendation_failed', 'analysis detail must persist the terminal state');
  assert.ok(detail.data.analysis.recommendation_failure, 'analysis detail must expose the failure reason');
});

test('E: specialist partial failure still surfaces as missing information when the recommendation succeeds', async () => {
  const provider = new FakeAIProvider();
  const original = provider.generateStructured.bind(provider);
  provider.generateStructured = async (params) => {
    if (params.metadata?.agent === 'pollution') {
      throw new Error('AI provider error 429: inclusionai/ling-3.0-flash-vl:free is temporarily rate-limited upstream.');
    }
    return original(params);
  };
  setAI(provider);

  const { status, data } = await runAnalysis(trafficPayload());
  assert.equal(status, 201);
  assert.equal(data.status, 'recommended');
  assert.ok(data.specialist_failures.some((f) => f.agent === 'pollution'));
  assert.ok(
    (data.recommendations.missing_information || []).some((m) => /[Pp]ollution/.test(m)),
    'the unavailable specialist must be listed as missing information',
  );
  assert.ok(
    (data.recommendations.verification_needed || []).some((v) => /[Pp]ollution/.test(v)),
    'the unavailable specialist domain must be listed as requiring verification',
  );
});

test('F: existing authority workflow stays intact when recommendation generation succeeds', async () => {
  setAI(new FakeAIProvider());
  const { status, data } = await runAnalysis(trafficPayload());
  assert.equal(status, 201);
  assert.equal(data.status, 'recommended');
  assert.ok(data.authority_request && data.authority_request.involvement_needed, 'the authority draft must still be produced');
  assert.ok(data.authority_request.decision, 'the authority decision must still be produced');
  assert.ok(Array.isArray(data.authority_request.decision.message) || typeof data.authority_request.decision.message === 'string');
});