import { promptFusion } from '../ai/prompts.js';
import { fusionSchema } from '../ai/schemas.js';
import { startAgentRun, completeAgentRun, failAgentRun } from './helper.js';

export async function runFusionAgent({ ai, analysisId, locality, problem, specialistInputs }) {
  const runId = startAgentRun({
    analysisId,
    agentName: 'fusion',
    config: { model: ai.model, temperature: ai.temperature },
    input: { locality, problem },
  });
  try {
    const user = promptFusion({
      problem: `${problem.title}\n${problem.description}`,
      specialistInputs: JSON.stringify(specialistInputs, null, 2),
    });
    const { data } = await ai.generateStructured({
      system: '',
      user,
      schema: fusionSchema,
      metadata: { agent: 'fusion' },
    });
    completeAgentRun(runId, 'fusion', data, []);
    return data;
  } catch (err) {
    failAgentRun(runId, err.message);
    throw err;
  }
}