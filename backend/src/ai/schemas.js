const stringArray = { type: 'array', items: { type: 'string' } };
const evidenceItem = {
  type: 'object',
  required: ['ref', 'source'],
  properties: {
    ref: { type: 'string' },
    source: { type: 'string' },
    source_label: { type: 'string' },
    is_demo: { type: 'boolean' },
    detail: { type: 'string' },
  },
};

export const classifyComplaintSchema = {
  type: 'object',
  required: [
    'category',
    'domain',
    'severity',
    'locality',
    'confidence',
    'summary',
    'key_indicators',
    'missing_information',
    'priority_dimensions',
  ],
  properties: {
    category: { type: 'string' },
    domain: { type: 'string' },
    severity: { type: 'integer' },
    locality: { type: 'string' },
    confidence: { type: 'number' },
    summary: { type: 'string' },
    key_indicators: stringArray,
    visible_conditions: stringArray,
    missing_information: stringArray,
    likely_assistance: { type: 'string' },
    priority_dimensions: {
      type: 'object',
      required: [
        'severity',
        'population_impact',
        'environmental_impact',
        'urgency',
        'feasibility',
      ],
      properties: {
        severity: { type: 'number' },
        population_impact: { type: 'number' },
        environmental_impact: { type: 'number' },
        urgency: { type: 'number' },
        feasibility: { type: 'number' },
      },
    },
  },
};

const agentTaskItem = {
  type: 'object',
  required: ['agent', 'objective'],
  properties: {
    agent: { type: 'string' },
    objective: { type: 'string' },
    needs_information: stringArray,
  },
};

export const coordinatorSchema = {
  type: 'object',
  required: [
    'understanding',
    'required_agents',
    'clarification_required',
    'missing_information',
    'notes',
  ],
  properties: {
    understanding: { type: 'string' },
    required_agents: { type: 'array', items: agentTaskItem },
    clarification_required: { type: 'boolean' },
    clarification_reason: { type: 'string' },
    missing_information: stringArray,
    new_specialist_required: { type: 'boolean' },
    new_specialist_reason: { type: 'string' },
    notes: { type: 'string' },
  },
};

export const specialistSchema = {
  type: 'object',
  required: ['summary', 'conclusion', 'key_findings', 'evidence_refs', 'tradeoffs', 'missing_information', 'confidence'],
  properties: {
    summary: { type: 'string' },
    conclusion: { type: 'string' },
    key_findings: stringArray,
    evidence_refs: stringArray,
    tradeoffs: stringArray,
    missing_information: stringArray,
    risks: stringArray,
    confidence: { type: 'number' },
    interpretation: { type: 'any' },
  },
};

export const fusionSchema = {
  type: 'object',
  required: ['summary', 'common_findings', 'conflicting_findings', 'cross_domain_impacts', 'tradeoffs', 'dependencies', 'uncertainties', 'missing_information', 'verdict'],
  properties: {
    summary: { type: 'string' },
    common_findings: stringArray,
    conflicting_findings: stringArray,
    cross_domain_impacts: stringArray,
    tradeoffs: stringArray,
    dependencies: stringArray,
    uncertainties: stringArray,
    missing_information: stringArray,
    verdict: { type: 'string' },
  },
};

const recommendationOption = {
  type: 'object',
  required: ['name', 'description', 'components', 'expected_impact', 'feasibility_score'],
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    components: stringArray,
    expected_impact: { type: 'string' },
    impact_score: { type: 'number' },
    feasibility_score: { type: 'number' },
    timeline_months: { type: 'number' },
    environmental_effect: { type: 'string' },
    energy_effect: { type: 'string' },
    population_benefit: { type: 'string' },
    risks: stringArray,
    dependencies: stringArray,
    why_generated: { type: 'string' },
    target_authority: { type: 'string' },
    // XAI scoring breakdown — populated by the deterministic XAI engine,
    // not by the LLM. Present in schema for frontend serialisation.
    xai_scores: { type: 'object' },
  },
};

export const recommendationSchema = {
  type: 'object',
  required: ['context_diagnosis', 'options'],
  properties: {
    context_diagnosis: { type: 'string' },
    options: { type: 'array', items: recommendationOption },
    // Explicit data-gap reporting so a provisional recommendation never
    // masquerades as fully verified (filled defensively by the engine).
    missing_information: stringArray,
    assumptions: stringArray,
    uncertainty: { type: 'string' },
    verification_needed: stringArray,
    // Populated by the XAI scoring engine after generation.
    xai_explanation: { type: 'string' },
  },
};

export const clarifySchema = {
  type: 'object',
  required: ['clarification_required', 'responsible_authority_code', 'mock', 'message', 'why_information_required', 'missing_information'],
  properties: {
    clarification_required: { type: 'boolean' },
    responsible_authority_code: { type: 'string' },
    responsible_authority_name: { type: 'string' },
    why_information_required: { type: 'string' },
    missing_information: stringArray,
    requested_data: stringArray,
    message: { type: 'string' },
    mock: { type: 'string' },
  },
};

export const authorityRequestSchema = {
  type: 'object',
  required: ['authority_involvement_required'],
  properties: {
    authority_involvement_required: { type: 'boolean' },
    request_type: {
      type: 'string',
      enum: [
        'INFORMATION_REQUEST',
        'CLARIFICATION_REQUEST',
        'SUPPORT_REQUEST',
        'ACTION_REQUEST',
        'COORDINATION_REQUEST',
        'FEASIBILITY_REQUEST',
        'APPROVAL_REQUEST',
      ],
    },
    responsible_authority_id: { type: 'string' },
    responsible_authority_name: { type: 'string' },
    reason: { type: 'string' },
    requested_action: { type: 'string' },
    suggested_channel: { type: 'string' },
    message: { type: 'string' },
    justification: { type: 'string' },
  },
};

export const authorityResponseSchema = {
  type: 'object',
  required: ['acknowledgement', 'provides_clarification', 'new_information_summary', 'interpretation_notes'],
  properties: {
    acknowledgement: { type: 'string' },
    status_update: { type: 'string' },
    provides_clarification: { type: 'boolean' },
    new_information_summary: { type: 'string' },
    constraints_or_conditions: stringArray,
    requested_changes: stringArray,
    interpretation_notes: { type: 'string' },
  },
};

export const refineSchema = {
  type: 'object',
  required: ['analysis_of_response', 'adjusted_options'],
  properties: {
    analysis_of_response: { type: 'string' },
    adjustments: stringArray,
    adjusted_options: { type: 'array', items: recommendationOption },
    revised_recommendation: { type: 'string' },
    confidence: { type: 'number' },
    notes: { type: 'string' },
    // Explicit change reporting so the planner can see what the authority
    // response changed and why.
    what_changed: stringArray,
    why_changed: { type: 'string' },
    authority_information_used: { type: 'string' },
  },
};

export const memorySummarySchema = {
  type: 'object',
  required: ['summary', 'outcome', 'recommendation', 'planner_decision', 'implementation_result', 'kpi_summary', 'tags'],
  properties: {
    summary: { type: 'string' },
    outcome: { type: 'string' },
    recommendation: { type: 'string' },
    planner_decision: { type: 'string' },
    authority_response: { type: 'string' },
    implementation_result: { type: 'string' },
    kpi_summary: { type: 'string' },
    feedback_note: { type: 'string' },
    tags: stringArray,
  },
};

export const evidenceSchema = {
  type: 'array',
  items: evidenceItem,
};

export const ticketTitleSchema = {
  type: 'object',
  required: ['title'],
  properties: {
    title: { type: 'string' },
  },
};

export const SCHEMAS = {
  classifyComplaint: classifyComplaintSchema,
  coordinator: coordinatorSchema,
  specialist: specialistSchema,
  fusion: fusionSchema,
  recommendation: recommendationSchema,
  clarify: clarifySchema,
  authorityResponse: authorityResponseSchema,
  refine: refineSchema,
  memorySummary: memorySummarySchema,
  evidence: evidenceSchema,
  ticketTitle: ticketTitleSchema,
};