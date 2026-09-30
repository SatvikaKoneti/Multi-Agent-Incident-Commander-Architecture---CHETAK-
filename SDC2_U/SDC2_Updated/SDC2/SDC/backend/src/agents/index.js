export { runCoordinator, AGENT_CATALOG } from './coordinator.js';
export { runTrafficAgent } from './traffic.js';
export { runPollutionAgent } from './pollution.js';
export { runEnergyAgent } from './energy.js';
export { runFusionAgent } from './fusion.js';
export { runRecommendationAgent } from './recommendation.js';
export { runClarificationAgent } from './clarification.js';
export { runAuthorityRequestAgent } from './authorityRequest.js';
export { ingestAuthorityResponse, runRefinementAgent } from './refinement.js';
export { runMemoryAgent, formatMemoryHints } from './memory.js';
export { classifyComplaint, saveClassification } from './classifier.js';

export const AGENTS = {
  coordinator: 'coordinator',
  traffic: 'traffic',
  pollution: 'pollution',
  energy: 'energy',
  fusion: 'fusion',
  recommendation: 'recommendation',
  clarification: 'clarification',
  authorityRequest: 'authorityRequest',
  memory: 'memory',
};

export const AGENT_DISPLAY = {
  coordinator: 'Coordinator Agent',
  traffic: 'Traffic Agent',
  pollution: 'Pollution Agent',
  energy: 'Energy Agent',
  fusion: 'Fusion Agent',
  recommendation: 'Recommendation Agent',
  clarification: 'Authority Clarification Agent',
  authorityRequest: 'Authority Communication & Routing Agent',
  memory: 'Agent Memory',
};