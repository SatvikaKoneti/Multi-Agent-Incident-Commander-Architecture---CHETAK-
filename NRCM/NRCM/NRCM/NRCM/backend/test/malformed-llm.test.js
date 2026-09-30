import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';
import { bootTestServer, closeTestServer, api, login, postComplaint, tinyPngBuffer } from '../test-helpers/helpers.js';

const { AIProvider, getAIProvider } = await import('../src/ai/provider.js');
const { FakeAIProvider } = await import('../src/ai/fake.js');
const { setAI } = await import('../src/di.js');
const { classifyComplaintSchema } = await import('../src/ai/schemas.js');
const { AppError } = await import('../src/utils/index.js');

test('generatedStructured retries then throws a friendly 502 when the LLM returns non-JSON', async () => {
  const provider = new AIProvider({ apiKey: 'x-test', model: 'test' });
  provider._chat = async () => ({ content: 'I cannot do that. Here is prose only.' });
  await assert.rejects(
    provider.generateStructured({ system: '', user: 'u', schema: classifyComplaintSchema }),
    (err) => err instanceof AppError && err.status === 502 && /structured result/.test(err.message),
  );
});

test('generatedStructured recovers on retry when the second attempt is valid', async () => {
  const provider = new AIProvider({ apiKey: 'x-test', model: 'test' });
  let calls = 0;
  provider._chat = async () => {
    calls += 1;
    if (calls === 1) return { content: '```json\n{"category": "Road Traffic" ' };
    return { content: '{"category":"Road Traffic","severity":"7","confidence":0.9,"summary":"ok","priority_dimensions":{"severity":70,"population_impact":60,"environmental_impact":40,"urgency":50,"feasibility":80},"key_indicators":[],"visible_conditions":[],"missing_information":[],"locality":"HITEC City / Madhapur","domain":"road"}' };
  };
  const { data, attempts } = await provider.generateStructured({ system: '', user: 'u', schema: classifyComplaintSchema });
  assert.equal(data.category, 'Road Traffic');
  assert.equal(attempts, 2);
});

test('network failure surfaces as a 502 AppError, never a raw throw', async () => {
  const provider = new AIProvider({ apiKey: 'x-test', model: 'test' });
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('ECONNRESET');
  };
  try {
    await assert.rejects(
      provider.generateText({ system: '', user: 'u' }),
      (err) => err instanceof AppError && err.status === 502,
    );
  } finally {
    globalThis.fetch = realFetch;
  }
});

let server;
let base;
let plannerToken;
let citizenToken;

class ExplodingAIProvider extends FakeAIProvider {
  constructor(throwFor = new Set(['coordinator', 'classify'])) {
    super();
    this.throwFor = throwFor;
  }

  async generateStructured({ metadata }) {
    if (this.throwFor.has(metadata?.agent)) {
      throw new Error('simulated LLM outage');
    }
    return super.generateStructured(...arguments);
  }
}

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

test('a failing classifier never breaks complaint intake and reports the error gracefully', async () => {
  setAI(new ExplodingAIProvider(new Set(['classify'])));
  const { status, data } = await postComplaint(base, citizenToken, {
    title: 'Burst water pipeline on Road No 12',
    description: 'Water is leaking on to the road surface overnight.',
    locality: 'Banjara Hills',
  });
  assert.equal(status, 201);
  assert.ok(data.classification.ai_error, 'classification failure must be captured, not crash intake');
  assert.match(data.classification.ai_error, /simulated LLM outage/);
  // The complaint remains reviewable.
  const track = await api(base, 'GET', `/api/complaints/track/${data.tracking_id}`);
  assert.equal(track.status, 200);
});

test('an AI outage during analysis returns a controlled error and the server stays healthy', async () => {
  setAI(new ExplodingAIProvider(new Set(['coordinator'])));
  const analysis = await api(base, 'POST', '/api/planner/analyses', {
    token: plannerToken,
    body: {
      localityId: 'osm-gachibowli',
      title: 'Transformer overloading in Gachibowli',
      description: 'Peak demand 48.5 MW against 52 MW installed capacity with interruptions.',
    },
  });
  assert.equal(analysis.status, 500);
  assert.equal(analysis.data.error, 'An internal error occurred.');

  // Recovery: swap back the working provider and a further request succeeds.
  setAI(new FakeAIProvider());
  const health = await api(base, 'GET', '/api/health');
  assert.equal(health.status, 200);
  const recovery = await api(base, 'POST', '/api/planner/analyses', {
    token: plannerToken,
    body: { localityId: 'osm-gachibowli', title: 'Recovery check', description: 'Verify the pipeline still runs after an outage.' },
  });
  assert.equal(recovery.status, 201);
});