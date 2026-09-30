export type Role = 'citizen' | 'planner' | 'authority';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  authority_code: string | null;
}

export interface Locality {
  id: string;
  name: string;
  lat: number;
  lng: number;
  population: number;
  area_sqkm: number;
  is_demo?: number | boolean;
}

export interface Complaint {
  id: number;
  tracking_id: string;
  title: string;
  description: string;
  category: string | null;
  locality: string | null;
  area: string | null;
  lat: number | null;
  lng: number | null;
  severity_input: number | null;
  status: string;
  resolution_notes: string | null;
  image_path: string | null;
  video_path: string | null;
  priority_score: number | null;
  ai_classified: boolean;
  created_at: string;
}

export interface PriorityDimensions {
  severity?: number;
  population_impact?: number;
  environmental_impact?: number;
  urgency?: number;
  feasibility?: number;
}

export interface Interpretation {
  acknowledgement?: string;
  status_update?: string;
  provides_clarification?: boolean;
  new_information_summary?: string;
  constraints_or_conditions?: string[];
  requested_changes?: string[];
  interpretation_notes?: string;
}

export interface Classification {
  category: string;
  domain?: string;
  severity: number;
  locality?: string;
  confidence: number;
  summary: string;
  key_indicators: string[];
  visible_conditions: string[];
  missing_information: string[];
  priority_dimensions?: PriorityDimensions;
  score: number;
  priority_score?: number;
  ai_classified_at?: string;
  complaint?: Complaint;
  ai_error?: string;
}

export interface SubmitComplaintResponse {
  tracking_id: string;
  complaint: Complaint;
  status: string;
  classification: Classification | null;
}

export interface TimelineStep {
  step: string;
  key: string;
  status: 'done' | 'active' | 'pending';
  at: string | null;
}

export interface TrackResponse {
  complaint: Complaint;
  timeline: TimelineStep[];
}

export interface Problem {
  id: string;
  category: string;
  locality_id: string;
  complaint_count: number;
  representative_complaint: {
    id: number;
    tracking_id: string;
    title: string;
    description: string;
    severity_input: number | null;
  };
  dimensions: PriorityDimensions;
  priority_score: number;
  level: { level: string; color: string };
  linked_tracking_ids: string[];
  reason: string;
  rank: number;
}

export interface DashboardStats {
  active_problems: number;
  high_priority: number;
  pending_authority_requests: number;
  active_implementations: number;
  ai_agent_runs_completed: number;
}

export interface Dashboard {
  localities: Locality[];
  top_problems: Problem[];
  stats: DashboardStats;
  overview: {
    localities: number;
    avg_speed_kmh: number | null;
    avg_aqi: number | null;
    avg_feeder_utilization: number | null;
  };
  recent_complaints: Complaint[];
  analyses: AnalysisView[];
  providers: Record<string, { name: string; isDemo: boolean }>;
  ai_configured: boolean;
  ai_model: string;
}

export interface SpecialistFailure {
  agent: string;
  label: string;
  kind: 'unavailable' | 'failed';
  reason: string;
}

export interface AnalysisView {
  id: number;
  locality_id: string;
  problem_title: string;
  problem_description: string;
  category: string | null;
  priority_score: number | null;
  status: string;
  coordinator_decision: Record<string, unknown> | null;
  specialist_failures: SpecialistFailure[];
  recommendation_failure?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvidenceItem {
  ref: string;
  source: string;
  source_label: string;
  is_demo: boolean;
  detail?: string;
}

export interface AgentResult {
  agent: string;
  label: string;
  task: string;
  status?: 'complete';
  result: {
    summary: string;
    conclusion: string;
    key_findings: string[];
    evidence_refs: string[];
    tradeoffs: string[];
    missing_information: string[];
    risks?: string[];
    confidence: number;
    interpretation?: Record<string, unknown>;
  };
  evidence: EvidenceItem[];
}

export interface FusionResult {
  summary: string;
  common_findings: string[];
  conflicting_findings: string[];
  cross_domain_impacts: string[];
  tradeoffs: string[];
  dependencies: string[];
  uncertainties: string[];
  missing_information: string[];
  verdict: string;
}

export interface RecommendationOption {
  id: number;
  name: string;
  description: string;
  rank: number;
  components: string[];
  expected_impact?: string;
  impact_score: number;
  feasibility_score: number;
  timeline_months: number;
  environmental_effect?: string;
  energy_effect?: string;
  population_benefit?: string;
  risks: string[];
  dependencies: string[];
  why_generated?: string;
  target_authority?: string;
  est_cost_inr: number;
  viability: number;
  is_recommended: boolean;
  constraints_applied?: Array<{
    type: string;
    authority?: string;
    description?: string;
  }>;
  cost_breakup?: {
    estimated_cost_inr: number | null;
    base_cost_inr: number | null;
    overhead_inr: number | null;
    overhead_pct: number;
    breakdown: Array<{
      item_key?: string;
      component?: string;
      rate_inr: number | null;
      quantity: number;
      subtotal_inr: number | null;
      source?: string;
      is_demo?: boolean;
    }>;
  };
  blocked?: boolean;
  block_reason?: string;
  revised_from_id?: number | null;
  constraint_status?: 'blocked' | 'approval_required' | 'clear';
  evidence?: Array<{
    ref: string;
    source: string;
    source_label: string;
    is_demo: boolean;
    detail: string;
  }>;
  /** Transparent XAI scoring breakdown — populated by the deterministic XAI engine */
  xai_scores?: XaiScores;
}

// ---------------------------------------------------------------------------
// XAI (Explainable AI) scoring types
// ---------------------------------------------------------------------------

/** Per-dimension contribution map: dimension name → % share of total score */
export type XaiContributions = Record<string, number>;

/** Breakdown for one score axis (impact or feasibility) */
export interface XaiScoreBreakdown {
  score: number;
  inputs: Record<string, number>;
  weights: Record<string, number>;
  contributions: XaiContributions;
  top_driver: string;
}

/** Full XAI explanation attached to each recommendation option */
export interface XaiScores {
  impact: XaiScoreBreakdown;
  feasibility: XaiScoreBreakdown;
  viability: number;
  formula: string;
  methodology: string;
}

export interface RefinementEntry {
  at: string;
  authority_response: string;
  what_changed: string[];
  why_changed: string;
  authority_information_used: string;
}

export interface Recommendation {
  id: number;
  analysis_id: number;
  status: string;
  final_option_id: number | null;
  planner_notes: string | null;
  created_at: string;
  updated_at: string;
  options: RecommendationOption[];
  missing_information?: string[];
  assumptions?: string[];
  uncertainty?: string;
  verification_needed?: string[];
  refinement_log?: RefinementEntry[];
  xai_explanation?: string | null;
}

export interface RunResult {
  id: number;
  run_id: number;
  agent_name: string;
  result: string;
  evidence: string;
  created_at: string;
}

export interface AgentRun {
  id: number;
  analysis_id: number;
  agent_name: string;
  status: 'running' | 'complete' | 'error';
  config?: unknown;
  input_context?: unknown;
  started_at: string;
  finished_at: string | null;
  error: string | null;
  results: RunResult[];
}

export interface AuthorityReply {
  id: number;
  request_id: number;
  response: string;
  status: string;
  raw: unknown;
  ai_interpretation: {
    acknowledgement: string;
    status_update?: string;
    provides_clarification: boolean;
    new_information_summary: string;
    constraints_or_conditions?: string[];
    requested_changes?: string[];
    interpretation_notes: string;
  } | null;
  received_at: string;
}

export interface ClarificationRequest {
  id: number;
  analysis_id: number;
  authority_code: string;
  authority_name: string;
  reason: string;
  message: string;
  context: unknown;
  status: string;
  planner_notes?: string | null;
  sent_by?: string | null;
  sent_at: string | null;
  created_at: string;
  request_type?: string;
  responses: AuthorityReply[];
}

export interface ClarificationDraft {
  decision?: Record<string, unknown>;
  authority: {
    code: string;
    name: string;
    domain: string;
    responsibility: string;
    jurisdiction: string;
    contact_method: string;
    simulated_endpoint: string;
    active: boolean;
  };
  requestId: number;
  message: string;
  status: string;
}

export interface AnalysisCoordinator {
  understanding: string;
  required_agents: Array<{ agent: string; objective: string; needs_information: string[] }>;
  clarification_required: boolean;
  clarification_reason?: string;
  missing_information: string[];
  notes: string;
}

export interface AnalysisResult {
  analysis_id: number;
  status: string;
  locality: Locality;
  problem: { id: number; title: string; description: string; category: string | null; locality_id: string };
  coordinator: AnalysisCoordinator;
  new_specialist_required: boolean;
  new_specialist_reason: string | null;
  agent_results: AgentResult[];
  specialist_failures: SpecialistFailure[];
  fusion_result: FusionResult | null;
  recommendations: {
    diagnosis: string;
    options: RecommendationOption[];
    blocked: unknown[];
    recommendation_id: number;
  } | null;
  recommendation_failure?: string | null;
  clarification: ClarificationDraft | null;
  evidence: EvidenceItem[];
  memory_hints: string | null;
}

export interface AnalysisDetail {
  analysis: AnalysisView & { coordinator_decision: Record<string, unknown> | null };
  locality: Locality | null;
  runs: AgentRun[];
  fusion_result: FusionResult | null;
  recommendations: Recommendation | null;
  clarifications: ClarificationRequest[];
  memories: Memory[];
}

export interface Implementation {
  id: number;
  recommendation_id: number;
  recommendation_option_id: number | null;
  status: 'planned' | 'in_progress' | 'completed';
  milestones: string[] | string;
  notes: string;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface Memory {
  id?: number;
  memory_id?: number;
  problem_key: string;
  problem_text: string;
  locality_id: string;
  category: string;
  summary: string;
  recommendation: string;
  planner_decision: string;
  authority_response: string;
  implementation_result: string;
  kpi_summary: string;
  feedback: string;
  tags: string[];
  created_at?: string;
}

export interface KpiRow {
  id: number;
  recommendation_id: number;
  recommendation_option_id: number | null;
  metric_name: string;
  predicted: string | null;
  observed: string | null;
  delta: number | null;
  baseline: string | null;
  unit: string;
  measured_at: string;
  notes: string;
  created_at: string;
}

export interface LocalityDashboard {
  locality: Locality;
  top_problems: Problem[];
  complaints: Complaint[];
  domain: {
    traffic: {
      congestion_level: string;
      avg_speed_kmh: number;
      peak_volume_vph: number;
      bottleneck_intersections: number;
      is_demo: boolean;
    } | null;
    air: { aqi: number; category: string; pm25: number; is_demo: boolean } | null;
    energy: {
      peak_demand_mw: number;
      installed_capacity_mw: number;
      utilization_pct: number;
      interruption_hours_30d: number;
      feeder_name: string;
      is_demo: boolean;
    } | null;
  };
  unclassified_count: number;
  infrastructure: Array<Record<string, unknown>>;
  amenities: Array<Record<string, unknown>>;
  ai_configured: boolean;
}

export interface RefinedResult {
  refined: {
    analysis_of_response: string;
    adjustments?: string[];
    adjusted_options: RecommendationOption[];
    revised_recommendation?: string;
    confidence?: number;
    notes?: string;
  };
  ranked: Array<{
    option: { name: string; description: string; components: string[]; timeline_months?: number };
    impact: number;
    feasibility: number;
    viability: number;
    cost_estimate?: { estimated_cost_inr: number | null };
    constraints_applied?: unknown[];
    authority_code?: string;
  }>;
}

export interface AuthorityRequestDetail {
  request: Omit<ClarificationRequest, 'responses'>;
  analysis: {
    id: number;
    locality_id: string;
    problem_title: string;
    problem_description: string;
    category: string | null;
    status: string;
  };
  locality: Locality | null;
  responses: AuthorityReply[];
}

export interface DemoScenario {
  id: string;
  name: string;
  locality_id: string;
  category: string;
  title: string;
  description: string;
  expects: string[];
}

export interface KpiCatalogEntry {
  key: string;
  name: string;
  description: string;
  baseline: number;
  unit: string;
}

export interface ClusterComplaintItem {
  id: number;
  tracking_id: string;
  title: string;
  description: string;
  area: string | null;
  lat: number | null;
  lng: number | null;
  severity_input: number | null;
  priority_score: number | null;
  image_path: string | null;
  video_path: string | null;
  created_at: string;
  status: string;
}

export interface ProblemCluster {
  cluster_id: string;
  title: string;
  category: string;
  locality_id: string;
  locality_name: string;
  lat: number;
  lng: number;
  report_count: number;
  media_summary: { photos: number; videos: number };
  priority_score: number;
  priority_level: { level: string; color: string };
  sla_hours: number;
  sla_level: string;
  elapsed_hours: number;
  remaining_hours: number;
  is_overdue: boolean;
  status: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  assigned_planner_id: string;
  assigned_planner_name: string;
  authority_code: string;
  authority_name: string;
  first_reported_at: string;
  latest_reported_at: string;
  is_recurring: boolean;
  representative_complaint: {
    id: number;
    tracking_id: string;
    title: string;
    description: string;
    area: string | null;
    image_path: string | null;
    video_path: string | null;
    severity_input: number | null;
  };
  complaints: ClusterComplaintItem[];
  priority_dimensions?: PriorityDimensions;
  xai_priority?: {
    score: number;
    dimensions: PriorityDimensions;
    weights: Record<string, number>;
    contributions: Record<string, number>;
    top_driver: string;
    top_driver_pct: number;
    human_summary: string;
    formula: string;
  };
}

export interface HotspotItem {
  rank: number;
  locality_id: string;
  locality_name: string;
  active_problems: number;
  critical_problems: number;
  total_reports: number;
}

export interface AreaProblemSummary {
  locality_id: string;
  locality_name: string;
  lat: number;
  lng: number;
  population: number;
  active_problems: number;
  total_reports: number;
  critical: number;
  unresolved: number;
  overdue: number;
  assigned_planner: string;
}

export interface CityIntelligenceData {
  stats: {
    total_active_problems: number;
    total_citizen_reports: number;
    critical_problems: number;
    high_priority_problems: number;
    unresolved_problems: number;
    overdue_problems: number;
    in_progress_problems: number;
    affected_areas_count: number;
  };
  hotspots: HotspotItem[];
  problems_by_area: AreaProblemSummary[];
  clusters: ProblemCluster[];
  total_clusters_count: number;
  filtered_clusters_count: number;
  localities: Locality[];
}

export interface AuthorityEntity {
  id?: number;
  code: string;
  name: string;
  short_name?: string;
  domain: string;
  responsibility?: string;
  jurisdiction?: string;
  contact_method?: string;
  assigned_categories?: string[];
  sla_hours?: number;
  active: boolean;
}