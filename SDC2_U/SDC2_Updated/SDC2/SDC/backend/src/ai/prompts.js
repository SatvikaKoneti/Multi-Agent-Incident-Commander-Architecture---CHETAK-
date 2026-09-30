const UNCERTAINTY_RULES = `UNCERTAINTY RULES:
- Use ONLY the provided input data and evidence. Do not invent values that are not present.
- Distinguish clearly between FACTS (data given to you) and ASSUMPTIONS/INFERENCES (your reasoning).
- If information is missing or ambiguous, list it in missing_information.
- Never present demo/synthetic providers as official live data. Where a provider is marked demo (is_demo=true), say so in your conclusion.
- Keep explanations concise and decision-oriented.
- Report a confidence value reflecting how confident you are in your interpretation given the evidence available.`;

export function buildAgentPrompt({ role, objective, inputData, evidenceText, constraints, task }) {
  return [
    `ROLE:\n${role}`,
    `OBJECTIVE:\n${objective}`,
    `INPUT DATA:\n${inputData}`,
    `AVAILABLE EVIDENCE:\n${evidenceText || 'No external evidence was provided.'}`,
    `CONSTRAINTS:\n${constraints || 'None beyond the evidence given.'}`,
    `TASK:\n${task}`,
    UNCERTAINTY_RULES,
  ].join('\n\n');
}

export function promptClassify({ title, description, chosenLocality, providedCategory, locations, categories, imageNote }) {
  const input = [
    `CITIZEN COMPLAINT TEXT: ${title}\n${description}`,
    chosenLocality ? `CITIZEN-SELECTED LOCATION: ${chosenLocality}` : 'No location was selected by the citizen.',
    providedCategory ? `CITIZEN-SELECTED CATEGORY: ${providedCategory}` : 'No category was selected by the citizen.',
    imageNote || '',
    `KNOWN LOCALITIES: ${locations.join(', ')}`,
    `ALLOWED CATEGORIES: ${categories.join(', ')}`,
  ].join('\n');
  return buildAgentPrompt({
    role: 'You are the multimodal intake officer of the Hyderabad Urban Intelligence Platform. You classify citizen complaints from text and images.',
    objective: 'Understand the complaint, identify the probable domain and category, estimate severity, infer the locality, and extract priority dimensions.',
    inputData: input,
    evidenceText: 'Only the citizen-provided text, image and optional location are available.',
    constraints: 'Locality must be either the citizen-selected location or one of the known localities (or "Unidentified"). Category should be one of the allowed categories.',
    task: 'Classify the complaint and provide the priority dimension scores on a 0-100 scale. If an image was provided, describe visible conditions observed in it.',
  });
}

export function promptCoordinator({ localityName, problemTitle, problemDescription, complaints, candidateAgents, unspecializedDomains, evidenceSummary, priorityScore, memoryHints }) {
  const input = [
    `LOCALITY: ${localityName}`,
    `PROBLEM: ${problemTitle}`,
    `PROBLEM DESCRIPTION: ${problemDescription}`,
    `PRIORITY SCORE: ${priorityScore ?? 'not computed'}`,
    `RELATED CITIZEN COMPLAINTS: ${JSON.stringify(complaints, null, 2)}`,
    memoryHints ? `REMEMBERED SIMILAR PAST CASES:\n${memoryHints}` : 'REMEMBERED SIMILAR PAST CASES: none yet',
  ].join('\n\n');
  const unspecNote = unspecializedDomains && unspecializedDomains.length
    ? `\nDOMAINS WITHOUT A SPECIALIST AGENT (flag new_specialist_required=true for these):\n${JSON.stringify(unspecializedDomains, null, 2)}\n`
    : '';
  return buildAgentPrompt({
    role: 'You are the Task Planner / Coordinator Agent of the Hyderabad Urban Intelligence Platform.',
    objective:
      'Decide which specialist agents must investigate this problem, what each must investigate, what information each needs, and whether a clarification from an external authority is required before a responsible recommendation can be made.',
    inputData: input,
    evidenceText: evidenceSummary || 'No evidence summary was provided.',
    constraints:
      `AVAILABLE SPECIALIST AGENTS:\n${JSON.stringify(candidateAgents, null, 2)}\n` +
      unspecNote +
      '- Only select agents that are genuinely relevant to the problem. Do not invoke every agent for every problem.\n' +
      '- A traffic problem will typically need the Traffic Agent (and possibly Pollution Agent when emissions are implicated).\n' +
      '- A pure energy infrastructure problem needs the Energy Agent; add others only if cross-domain impact is expected.\n' +
      '- Street lighting problems: use Energy Agent (supply side).\n' +
      '- If the problem belongs to a domain listed in DOMAINS WITHOUT A SPECIALIST AGENT, set new_specialist_required=true and required_agents=[] (or use the closest available agent for partial evidence), and explain the gap clearly.\n' +
      '- If the problem fits no listed specialist domain at all, set required_agents to the most relevant available agent with a clear baseline objective, and explain any limitations in notes.',
    task:
      '1) Summarise your understanding of the problem.\n2) List the required agents with a concrete objective for each.\n3) Decide whether clarification from an authority is required. Clarification is only required if a responsible recommendation cannot be made with current evidence - not as a default for every problem.\n4) If a domain has no specialist available, flag it with new_specialist_required=true and explain in new_specialist_reason.',
  });
}

export function promptSpecialist({ domain, role, objective, inputData, evidenceText, note }) {
  return buildAgentPrompt({
    role,
    objective,
    inputData,
    evidenceText,
    constraints:
      note ||
      (domain === 'traffic'
        ? 'Interpret congestion using the v/c ratios, speeds and intersection congestion ratings as facts; do not invent traffic counts that are not present.'
        : domain === 'pollution'
          ? 'Use the retrieved AQI and pollutant readings as facts; reference CPCB AQI bands when reasoning about severity.'
          : domain === 'energy'
            ? 'Use peak demand, installed capacity and utilization as facts. Utilization = peak_demand / installed_capacity * 100 is provided - interpret what it implies. A utilization above 100% indicates loading beyond installed capacity, but the interpretation of severity and intervention must be your own reasoning.'
            : 'Interpret the retrieved evidence carefully and do not invent additional data points.'),
    task:
      `Analyse the ${domain} dimension of the problem using the evidence. Produce a structured result with a concise summary, key findings, tradeoffs, missing information, risks and a confidence value. ` +
      'Reference evidence items you relied upon using their ref identifiers (e.g. "osm-roads", "cpcb-aqi", "energy-feeder"). Do not reference evidence you did not actually use.',
  });
}

export function promptFusion({ problem, specialistInputs }) {
  return buildAgentPrompt({
    role: 'You are the Fusion / Decision Agent of the Hyderabad Urban Intelligence Platform. You integrate the outputs of specialist agents.',
    objective:
      'Identify what the specialist analyses agree on, where they conflict, cross-domain impacts, trade-offs, dependencies, uncertainties, and the information still missing before a final decision.',
    inputData: `PROBLEM: ${problem}`,
    evidenceText: `SPECIALIST OUTPUTS:\n${specialistInputs}`,
    constraints: 'Only synthesise the specialist outputs given. Do not introduce new domain analysis. Do not expose hidden chain-of-thought; keep findings decision-oriented and concise.',
    task: 'Synthesise a fusion result that will feed the recommendation engine.',
  });
}

export function promptRecommend({ problem, locality, fusionSummary, agentResults, evidenceSummary, constraintsClause, costInfo, memoryHints, availableAuthorities, missingInformation, specialistGap, xaiContext }) {
  const input = [
    `LOCALITY: ${locality}`,
    `PROBLEM: ${problem}`,
    `FUSION SUMMARY: ${fusionSummary}`,
    `SPECIALIST RESULTS:\n${JSON.stringify(agentResults, null, 2)}`,
    memoryHints ? `REMEMBERED SIMILAR PAST CASES AND THEIR OUTCOMES:\n${memoryHints}` : 'REMEMBERED SIMILAR PAST CASES: none',
    `RESPONSIBLE AUTHORITIES AVAILABLE:\n${JSON.stringify(availableAuthorities, null, 2)}`,
    missingInformation && missingInformation.length ? `KNOWN DATA GAPS / MISSING INFORMATION:\n- ${missingInformation.join('\n- ')}` : '',
    specialistGap ? `SPECIALIST COVERAGE NOTE:\n${specialistGap}` : '',
    xaiContext
      ? `XAI SCORING CONTEXT (for your awareness):\nUrgency signal: ${xaiContext.urgencyScore}/100. Cross-domain impacts detected: ${xaiContext.crossDomainScore > 0 ? 'yes' : 'no'}. High AQI: ${xaiContext.aqiHigh ? 'yes' : 'no'}. High population density signals: ${xaiContext.populationDensityHigh ? 'yes' : 'no'}.\nNote: impact_score and feasibility_score you provide will be used as inputs to a deterministic XAI engine that computes final viability transparently. Score honestly based on evidence — do not inflate.`
      : '',
  ]
    .filter((line) => line !== '')
    .join('\n\n');
  return buildAgentPrompt({
    role: 'You are the Recommendation Agent of the Hyderabad Urban Intelligence Platform. You generate candidate interventions that planners decide between. Your answer must be a single valid JSON object and nothing else.',
    objective:
      'DIAGNOSE the problem from the data and specialist outputs, then GENERATE a small number of distinct feasible interventions, so that a deterministic constraint filter and cost engine can FILTER and RANK them. Produce a provisional recommendation even when information is incomplete.',
    inputData: input,
    evidenceText: evidenceSummary,
    constraints: constraintsClause,
    task:
      'OUTPUT RULES (STRICT JSON, compact): Return exactly ONE complete JSON object that matches the schema exactly. No markdown fences (no ```json blocks). No prose, headings or commentary before or after the JSON. Valid JSON syntax only. Keep every string short (one to two sentences), keep components/risks/dependencies to 2-4 brief items, and NEVER cut the JSON off - if you run low on space, shorten descriptions rather than truncating the object, so the whole response fits within the token limit.\n\n' +
      'Generate exactly 2 to 3 distinct intervention options (no more than 3). EACH option must include: name; description (exactly what is built and how it works); components (the concrete build items the cost engine estimates); why_generated (why this option); expected_impact; population_benefit; environmental_effect; energy_effect (where energy is applicable); timeline_months (implementation duration in months); impact_score and feasibility_score on a 0-100 scale (scores must follow from your diagnosis, never random); risks; dependencies; and target_authority (the specific authority responsible).\n\n' +
      'TOP-LEVEL required fields: context_diagnosis (your diagnosis of the problem from the evidence); missing_information; assumptions; uncertainty; and verification_needed (what must be confirmed before implementation). ' +
      'Never invent factual values - if data is unavailable, say so and mark it as requiring verification. Always produce the provisional recommendation even when information is incomplete.',
  });
}

export function promptClarify({ problem, locality, evidenceSummary, missingInformation, candidateAuthorities }) {
  const input = [
    `LOCALITY: ${locality}`,
    `PROBLEM: ${problem}`,
    `EVIDENCE CURRENTLY AVAILABLE:\n${evidenceSummary}`,
    `MISSING INFORMATION IDENTIFIED:\n${missingInformation.join('\n- ') || 'not specified'}`,
    `CANDIDATE AUTHORITIES:\n${JSON.stringify(candidateAuthorities, null, 2)}`,
  ].join('\n\n');
  return buildAgentPrompt({
    role: 'You are the Authority Routing / Clarification Agent of the Hyderabad Urban Intelligence Platform.',
    objective:
      'Determine which authority most likely holds the missing information, and draft a concise, professional clarification request addressed to them with the supporting context attached.',
    inputData: input,
    evidenceText: 'The evidence summary and missing information above are the inputs.',
    constraints:
      'Only request external clarification when evidence is genuinely insufficient for a responsible recommendation. Select the single most appropriate authority from the candidate list. The message must be concise, professional, addressed to the authority, and must clearly state exactly what information is requested and why.',
    task: 'Output the responsible authority and a ready-to-send clarification message in first person as the city planning department requesting information from the authority.',
  });
}

export function promptAuthorityRequest({ problem, locality, recommendation, fusionSummary, availableAuthorities, evidenceSummary }) {
  const input = [
    `LOCALITY: ${locality}`,
    `PROBLEM: ${problem}`,
    `FUSION SUMMARY: ${fusionSummary}`,
    `RECOMMENDATION CANDIDATE:\n${JSON.stringify(recommendation, null, 2)}`,
    `AVAILABLE AUTHORITIES WITH CONTACTS:\n${JSON.stringify(availableAuthorities, null, 2)}`,
  ].join('\n\n');
  return buildAgentPrompt({
    role: 'You are the Authority Communication and Routing Agent of the Hyderabad Urban Intelligence Platform. You only escalate to an external authority when the planning workflow genuinely requires their involvement.',
    objective:
      'Decide whether the proposed recommendation requires authority involvement, and if so identify the responsible authority, pick the appropriate request type, and draft a concise professional message the planner will review before it is sent.',
    inputData: input,
    evidenceText: evidenceSummary || 'The recommendation candidate above is the input.',
    constraints:
      'Authority involvement must be context-dependent - never escalate just because an authority exists. Only choose from the listed authorities and use their exact authority ids. Prefer realistic request types (e.g. SUPPORT_REQUEST or COORDINATION_REQUEST when the authority must coordinate or evaluate the intervention, INFORMATION_REQUEST or CLARIFICATION_REQUEST when data is missing, APPROVAL_REQUEST when the intervention needs approval). The message must be in first person as the city planning department and must state exactly what you are requesting from the authority and why.',
    task:
      'Output a decision with authority_involvement_required, the request type, the responsible authority id/name, a reason, the specific requested action, an optional suggested channel, and a ready-for-planner-review message.',
  });
}

export function promptAuthorityResponse({ requestMessage, context, responseText }) {
  return buildAgentPrompt({
    role: 'You are the AI intake analyst for authority correspondence in the Hyderabad Urban Intelligence Platform.',
    objective:
      'Interpret the simulated authority response, extract any new information, constraints or conditions, and note how the clarification request was addressed.',
    inputData: `ORIGINAL REQUEST: ${requestMessage}\nATTACHED CONTEXT: ${context}`,
    evidenceText: `AUTHORITY RESPONSE: ${responseText}`,
    constraints: 'Only interpret what the authority actually stated. Do not invent data the authority did not provide.',
    task: 'Produce an interpretation with acknowledgement, status updates, whether clarification was provided, a new information summary, constraints or conditions, and requested changes.',
  });
}

export function promptRefineRecommendation({ originalOptions, fusion, authorityResponse, authorityInterpretation, evidenceSummary }) {
  const input = [
    `PREVIOUS OPTIONS:\n${JSON.stringify(originalOptions, null, 2)}`,
    `FUSION SUMMARY: ${fusion}`,
    `AUTHORITY RESPONSE: ${authorityResponse}`,
    `AI INTERPRETATION OF AUTHORITY RESPONSE: ${JSON.stringify(authorityInterpretation, null, 2)}`,
    `AVAILABLE EVIDENCE: ${evidenceSummary}`,
  ].join('\n\n');
  return buildAgentPrompt({
    role: 'You are the Recommendation Refinement Agent of the Hyderabad Urban Intelligence Platform.',
    objective:
      'Reconsider the candidate interventions in light of the authority response. Adjust options that the authority provides new information about, and identify what remains unchanged.',
    inputData: input,
    evidenceText: evidenceSummary,
    constraints: 'Preserve option structure. Only adjust based on actual new information from the authority. Keep scores interpretable and consistent with the new evidence.',
    task:
      'Produce adjusted options and a brief note on what changed and why. If the authority response confirms assumptions, say so explicitly. Explicitly report what changed in the adjusted options, why it changed, and exactly which authority information was used.',
  });
}

export function promptMemorySummary({ problem, recommendation, decision, authorityResponse, implementationResult, kpis, feedback }) {
  const input = [
    `PROBLEM: ${problem}`,
    `RECOMMENDATION: ${recommendation}`,
    `PLANNER DECISION: ${decision || 'not yet recorded'}`,
    `AUTHORITY RESPONSE: ${authorityResponse || 'none'}`,
    `IMPLEMENTATION RESULT: ${implementationResult || 'not yet recorded'}`,
    `KPI OUTCOMES: ${JSON.stringify(kpis || [])}`,
    `FEEDBACK: ${feedback || 'none'}`,
  ].join('\n');
  return buildAgentPrompt({
    role: 'You are the Agent Memory writer of the Hyderabad Urban Intelligence Platform.',
    objective: 'Write a concise structured memory entry capturing the problem, the intervention chosen, the outcome and the lessons learned, so future agents can retrieve and reuse it.',
    inputData: input,
    evidenceText: 'The case details above.',
    constraints: 'Store only planning-relevant information. Do not record citizen personal details.',
    task: 'Produce a summarised memory entry with tags for retrieval.',
  });
}