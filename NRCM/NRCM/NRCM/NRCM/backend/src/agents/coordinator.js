import { promptCoordinator } from '../ai/prompts.js';
import { coordinatorSchema } from '../ai/schemas.js';
import { startAgentRun, completeAgentRun, failAgentRun } from './helper.js';

export const AGENT_CATALOG = [
  {
    name: 'traffic',
    label: 'Traffic Agent',
    domain: 'Traffic and transportation',
    uses: ['OSM road network', 'traffic metrics', 'intersections'],
    description: 'Analyses congestion, capacity, intersections, bottlenecks, delays, mobility, public transport and pedestrian implications. Also relevant for pothole/road damage, junction problems, parking and signal failures.',
  },
  {
    name: 'pollution',
    label: 'Pollution Agent',
    domain: 'Environment and air quality',
    uses: ['CPCB AQI readings', 'pollutants'],
    description: 'Analyses AQI, PM2.5, PM10, related pollutants and environmental impact. Relevant for dust, industrial smoke, vehicular emissions, and construction site pollution.',
  },
  {
    name: 'energy',
    label: 'Energy Agent',
    domain: 'Electricity distribution',
    uses: ['Energy provider records', 'feeder demand/capacity'],
    description: 'Analyses demand, capacity, feeder loading, transformer condition, interruptions and peak load. Also relevant for street lighting failures (supply side) and power outages.',
  },
];

/**
 * Domains with NO specialist agent yet — used to guide the coordinator LLM.
 * When the coordinator flags new_specialist_required for these domains, the
 * orchestrator proceeds with provisional recommendations from available evidence.
 */
export const UNSPECIALIZED_DOMAINS = [
  { domain: 'Waste Management / Sanitation', authority: 'GHMC-SWM', keywords: ['waste', 'garbage', 'sanitation', 'bin', 'solid waste'] },
  { domain: 'Water Supply / Drainage', authority: 'HMWSSB', keywords: ['water supply', 'pipeline', 'drainage', 'sewerage', 'waterlogging', 'flood'] },
  { domain: 'Public Transport', authority: 'TSRTC', keywords: ['bus', 'metro', 'public transport', 'commuting', 'bus stop', 'TSRTC'] },
];

export async function runCoordinator({ ai, analysisId, locality, problem, complaints, evidenceSummary, priorityScore, memoryHints }) {
  const runId = startAgentRun({
    analysisId,
    agentName: 'coordinator',
    config: { model: ai.model, temperature: ai.temperature },
    input: { locality, problem },
  });
  try {
    const user = promptCoordinator({
      localityName: locality,
      problemTitle: problem.title,
      problemDescription: problem.description,
      complaints,
      candidateAgents: AGENT_CATALOG,
      unspecializedDomains: UNSPECIALIZED_DOMAINS,
      evidenceSummary,
      priorityScore,
      memoryHints,
    });
    const { data } = await ai.generateStructured({
      system: '',
      user,
      schema: coordinatorSchema,
      metadata: { agent: 'coordinator' },
    });
    completeAgentRun(runId, 'coordinator', data, []);
    return data;
  } catch (err) {
    failAgentRun(runId, err.message);
    throw err;
  }
}