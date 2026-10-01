import { promptRecommend } from '../ai/prompts.js';
import { recommendationSchema } from '../ai/schemas.js';
import { startAgentRun, completeAgentRun, failAgentRun } from './agentWorkflowHelpers.js';

const TARGET_AUTHORITIES = [
  { code: 'HTP', name: 'Hyderabad Traffic Police' },
  { code: 'GHMC', name: 'GHMC' },
  { code: 'HMDA', name: 'HMDA' },
  { code: 'TSPCB', name: 'TSPCB' },
  { code: 'HMWSSB', name: 'HMWSSB' },
  { code: 'TSSPDCL', name: 'TSSPDCL' },
  { code: 'TSRTC', name: 'TSRTC' },
  { code: 'GHMC-SWM', name: 'GHMC Solid Waste Management' },
];

/**
 * Recommendation Agent - GENERATE step of DIAGNOSE -> GENERATE -> FILTER -> RANK.
 * The LLM produces multiple candidate interventions; the recommendation engine
 * performs deterministic FILTER and RANK afterwards.
 */
export async function runRecommendationAgent({
  ai,
  analysisId,
  locality,
  problem,
  fusionSummary,
  agentResults,
  evidenceContext,
  constraintsClause,
  costInfo,
  memoryHints,
  missingInformation,
  specialistGap,
}) {
  const runId = startAgentRun({
    analysisId,
    agentName: 'recommendation',
    config: { model: ai.model, temperature: ai.temperature },
    input: { locality, problem },
  });
  try {
    const user = promptRecommend({
      problem: `${problem.title}\n${problem.description}`,
      locality: locality.name,
      fusionSummary,
      agentResults,
      evidenceSummary: evidenceContext,
      constraintsClause,
      costInfo,
      memoryHints,
      availableAuthorities: TARGET_AUTHORITIES,
      missingInformation,
      specialistGap,
    });
    const { data } = await ai.generateStructured({
      system: '',
      user,
      schema: recommendationSchema,
      metadata: { agent: 'recommend' },
      // Controlled retry: on a malformed/truncated response the model is
      // re-instructed once to emit only a compact JSON-only object. Never
      // retried indefinitely and never silently repaired.
      retryStrict: true,
    });
    completeAgentRun(runId, 'recommendation', data, []);
    return data;
  } catch (err) {
    failAgentRun(runId, err.message);
    throw err;
  }
}
