import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';
import { bootTestServer, closeTestServer, api, login } from '../test-helpers/helpers.js';

const { FakeAIProvider } = await import('../src/ai/fake.js');
const { setAI } = await import('../src/di.js');

/**
 * Deterministic test double: delegates everything to FakeAIProvider except the
 * named agents, which throw a realistic transient upstream/rate-limit error.
 */
class FlakySpecialistProvider extends FakeAIProvider {
  constructor(throwFor = new Set(['pollution'])) {
    super();
    this.throwFor = throwFor;
  }

  async generateStructured({ metadata, ...rest }) {
    if (this.throwFor.has(metadata?.agent)) {
      throw new Error('AI provider error 429: inclusionai/ling-3.0-flash-vl:free is temporarily rate-limited upstream.');
    }
    return super.generateStructured({ metadata, ...rest });
  }
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

test('a single failing specialist does not abort the pipeline and its gap is exposed in the recommendation', async () => {
  setAI(new FlakySpecialistProvider(new Set(['pollution'])));

  const { status, data } = await runAnalysis({
    localityId: 'osm-hitec-madhapur',
    title: 'Evening congestion gridlock at Inorbit junction',
    description: 'Vehicles queue for twenty minutes at the Inorbit Mall Junction with heavy congestion on HITEC City Main Road.',
    category: 'Road Traffic',
  });
  assert.equal(status, 201);
  assert.equal(data.status, 'recommended', 'analysis must complete instead of staying stuck in running');
  assert.notEqual(data.status, 'running');

  const agentNames = data.agent_results.map((r) => r.agent);
  assert.ok(agentNames.includes('traffic'), 'the successful specialist must be kept');
  assert.ok(!agentNames.includes('pollution'), 'the failed specialist must NOT be fabricated');

  assert.ok(Array.isArray(data.specialist_failures));
  const pollutionFailure = data.specialist_failures.find((f) => f.agent === 'pollution');
  assert.ok(pollutionFailure, 'the failed specialist must be recorded');
  assert.equal(pollutionFailure.kind, 'unavailable');
  assert.ok(/429|rate.?limit/i.test(pollutionFailure.reason), 'the underlying error reason must be preserved');

  assert.ok(data.recommendations && data.recommendations.options.length >= 1, 'a provisional recommendation must still be produced');

  assert.ok(
    (data.recommendations.missing_information || []).some((m) => /[Pp]ollution/.test(m)),
    'the unavailable specialist must be listed as missing information',
  );
  assert.ok(
    (data.recommendations.verification_needed || []).some((v) => /[Pp]ollution/.test(v)),
    'the unavailable specialist domain must be listed as requiring verification',
  );
  assert.ok(Boolean(data.recommendations.uncertainty), 'uncertainty must be stated');

  const runs = await api(base, 'GET', `/api/planner/runs/${data.analysis_id}`, { token: plannerToken });
  const pollutionRun = runs.data.runs.find((r) => r.agent_name === 'pollution');
  assert.ok(pollutionRun, 'the failed run must be recorded');
  assert.equal(pollutionRun.status, 'error');
  assert.ok(/429/.test(pollutionRun.error));

  const detail = await api(base, 'GET', `/api/planner/analyses/${data.analysis_id}`, { token: plannerToken });
  assert.equal(detail.status, 200);
  assert.ok(
    (detail.data.analysis.specialist_failures || []).some((f) => f.agent === 'pollution'),
    'specialist failures must be exposed in the analysis detail',
  );
});

test('when ALL specialists fail the analysis reports insufficient data explicitly', async () => {
  setAI(new FlakySpecialistProvider(new Set(['pollution', 'traffic', 'energy'])));

  const { status, data } = await runAnalysis({
    localityId: 'osm-hitec-madhapur',
    title: 'Evening congestion gridlock at Inorbit junction',
    description: 'Vehicles queue for twenty minutes at the Inorbit Mall Junction.',
    category: 'Road Traffic',
  });
  assert.equal(status, 201);
  assert.equal(data.status, 'insufficient_data');
  assert.equal(data.recommendations, null, 'must never pretend a recommendation exists without specialist evidence');
  assert.equal(data.agent_results.length, 0);
  assert.ok(data.specialist_failures.length >= 2, 'each failed specialist must be recorded');
  assert.ok(data.specialist_failures.every((f) => f.kind === 'unavailable'));
});