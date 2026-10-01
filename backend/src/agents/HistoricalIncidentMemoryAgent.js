import { promptMemorySummary } from '../ai/prompts.js';
import { memorySummarySchema } from '../ai/schemas.js';
import { startAgentRun, completeAgentRun, failAgentRun } from './agentWorkflowHelpers.js';
import { run, get } from '../db/index.js';
import { nowIso, generateId } from '../utils/index.js';
import { indexMemory } from '../rag/ragSemanticRetriever.js';

/**
 * Agent Memory / Feedback component - stores a structured, retrievable memory
 * of a planning case so future agents can reuse the outcomes.
 */
export async function runMemoryAgent({ ai, analysisId, problem, recommendation, decision, authorityResponse, implementationResult, kpis, feedback }) {
  const runId = startAgentRun({
    analysisId: analysisId || null,
    agentName: 'memory',
    config: { model: ai.model },
    input: { problem: problem?.title },
  });
  try {
    const user = promptMemorySummary({
      problem: problem ? `${problem.title}\n${problem.description}` : '',
      recommendation,
      decision,
      authorityResponse,
      implementationResult,
      kpis,
      feedback,
    });
    const { data } = await ai.generateStructured({
      system: '',
      user,
      schema: memorySummarySchema,
      metadata: { agent: 'memorySummary' },
    });

    const memory = {
      memory_id: `MEM-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      problem_key: problem?.id ? `PRB-${analysisId}` : null,
      problem_text: problem ? `${problem.title} ${problem.description}` : '',
      locality_id: problem?.locality_id || null,
      category: problem?.category || null,
      summary: data.summary,
      recommendation: data.recommendation,
      planner_decision: data.planner_decision,
      authority_response: data.authority_response,
      implementation_result: data.implementation_result,
      kpi_summary: data.kpi_summary,
      feedback: data.feedback_note || feedback || null,
      tags: data.tags || [],
    };

    run(
      `INSERT INTO agent_memory
       (memory_id, problem_key, problem_text, locality_id, category, summary, recommendation, planner_decision, authority_response, implementation_result, kpi_summary, feedback, tags)
       VALUES ($memoryId, $problemKey, $problemText, $localityId, $category, $summary, $recommendation, $plannerDecision, $authorityResponse, $implementationResult, $kpiSummary, $feedback, $tags)`,
      {
        $memoryId: memory.memory_id,
        $problemKey: `PRB-${analysisId || 'GEN'}`,
        $problemText: memory.problem_text,
        $localityId: memory.locality_id,
        $category: memory.category,
        $summary: memory.summary,
        $recommendation: memory.recommendation,
        $plannerDecision: memory.planner_decision,
        $authorityResponse: memory.authority_response,
        $implementationResult: memory.implementation_result,
        $kpiSummary: memory.kpi_summary,
        $feedback: memory.feedback,
        $tags: JSON.stringify(memory.tags),
      },
    );
    indexMemory(memory);

    completeAgentRun(runId || 1, 'memory', data, []);
    return { ...memory, memory_id: memory.memory_id };
  } catch (err) {
    failAgentRun(runId, err.message);
    throw err;
  }
}

export function formatMemoryHints(memories) {
  if (!memories || memories.length === 0) return '';
  return memories
    .map(
      (m) =>
        `- ${m.category || 'case'} (${m.locality_id || 'unknown locality'}): ${m.summary} Recommendation: ${m.recommendation}. Planner decision: ${m.planner_decision}. Outcome: ${m.implementation_result}. KPI: ${m.kpi_summary}. Feedback: ${m.feedback || 'none'}.`,
    )
    .join('\n');
}
