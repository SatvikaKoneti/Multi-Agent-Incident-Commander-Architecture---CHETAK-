export { runCoordinator, AGENT_CATALOG } from './IncidentWorkflowCoordinatorAgent.js';
export { runTrafficAgent } from './UrbanTransitTrafficSpecialistAgent.js';
export { runPollutionAgent } from './EnvironmentalPollutionSpecialistAgent.js';
export { runEnergyAgent } from './SmartGridTelemetrySpecialistAgent.js';
export { runFusionAgent } from './TelemetryEvidenceFusionAgent.js';
export { runRecommendationAgent } from './RemediationRecommendationAgent.js';
export { runClarificationAgent } from './IncidentClarificationInquiryAgent.js';
export { runAuthorityRequestAgent } from './AuthorityDispatchActionAgent.js';
export { ingestAuthorityResponse, runRefinementAgent } from './RecommendationRefinementAgent.js';
export { runMemoryAgent, formatMemoryHints } from './HistoricalIncidentMemoryAgent.js';
export { classifyComplaint, saveClassification } from './IncidentComplaintClassifierAgent.js';

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
