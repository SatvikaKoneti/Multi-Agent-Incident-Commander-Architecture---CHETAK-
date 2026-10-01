import { promptRefineRecommendation, promptAuthorityResponse } from '../ai/prompts.js';
import { refineSchema, authorityResponseSchema } from '../ai/schemas.js';
import { startAgentRun, completeAgentRun, failAgentRun } from './agentWorkflowHelpers.js';
import { run, get } from '../db/index.js';
import { nowIso } from '../utils/index.js';

/**
 * Interprets the authority response (AI) and stores it with the request.
 */
export async function ingestAuthorityResponse({ ai, analysisId, request, responseText, context }) {
  const runId = startAgentRun({
    analysisId,
    agentName: 'authorityResponseReader',
    config: { model: ai.model },
    input: { request_id: request.id },
  });
  try {
    const user = promptAuthorityResponse({
      requestMessage: request.message,
      context: JSON.stringify(context || {}),
      responseText,
    });
    const { data } = await ai.generateStructured({
      system: '',
      user,
      schema: authorityResponseSchema,
      metadata: { agent: 'authorityResponse' },
    });

    run(
      `INSERT INTO authority_responses (request_id, response, status, raw, ai_interpretation, received_at)
       VALUES ($requestId, $response, 'received', $raw, $interpretation, $received)`,
      {
        $requestId: request.id,
        $response: responseText,
        $raw: JSON.stringify(data),
        $interpretation: JSON.stringify(data),
        $received: nowIso(),
      },
    );
    completeAgentRun(runId, 'authorityResponseReader', data, []);
    return data;
  } catch (err) {
    failAgentRun(runId, err.message);
    throw err;
  }
}

/**
 * Reconsiders the recommendation with the authority response fed back in.
 */
export async function runRefinementAgent({ ai, analysisId, originalOptions, fusionSummary, authorityResponse, authorityInterpretation, evidenceContext }) {
  const runId = startAgentRun({
    analysisId,
    agentName: 'refinement',
    config: { model: ai.model, temperature: ai.temperature },
    input: { analysis_id: analysisId },
  });
  try {
    const user = promptRefineRecommendation({
      originalOptions,
      fusion: fusionSummary,
      authorityResponse,
      authorityInterpretation,
      evidenceSummary: evidenceContext,
    });
    const { data } = await ai.generateStructured({
      system: '',
      user,
      schema: refineSchema,
      metadata: { agent: 'refine' },
    });
    completeAgentRun(runId, 'refinement', data, []);
    return data;
  } catch (err) {
    failAgentRun(runId, err.message);
    throw err;
  }
}
