import { startAgentRun, completeAgentRun, failAgentRun } from './helper.js';
import { run, get } from '../db/index.js';
import { nowIso } from '../utils/index.js';
import { requestContextFrom } from './authorityRequestContext.js';

/**
 * Authority Communication and Routing — DETERMINISTIC version.
 *
 * Replaces the LLM-based authority routing with a rule-based lookup:
 *  1. Find the top viable (non-blocked) recommendation option.
 *  2. Resolve the responsible authority from the option's `target_authority`
 *     field using the authority DB — no LLM call needed.
 *  3. Draft a structured communication message from a template.
 *  4. Save to clarification_requests in 'draft' state for planner review.
 *
 * This saves one LLM call per analysis, is faster, and always produces a
 * deterministic authority assignment that the planner can audit.
 */
export async function runAuthorityRequestAgent({ ai, analysisId, locality, problem, recommendation, fusionSummary, providers }) {
  // Step 1: find the best viable option.
  const viable = (recommendation?.options || []).filter((o) => !o.blocked)[0];
  if (!viable) {
    return { involvement_needed: false, reason: 'No viable recommendation to route.' };
  }

  const runId = startAgentRun({
    analysisId,
    agentName: 'authorityRequest',
    config: { model: 'deterministic-routing', temperature: 0 },
    input: { analysis_id: analysisId, recommendation_id: viable.id },
  });

  try {
    // Step 2: deterministic authority resolution (DB lookup, no LLM).
    const targetCode = viable.target_authority || viable.authority_code || '';
    const authority =
      providers.authority.byCode(targetCode) ||
      providers.authority.byDomain(viable.name || problem.category || '')[0] ||
      providers.authority.all()[0];

    if (!authority) {
      completeAgentRun(runId, 'authorityRequest', { involvement_needed: false }, []);
      return { involvement_needed: false, reason: 'No matching authority found in registry.' };
    }

    // Step 3: resolve contact details from the contact dataset.
    const contact =
      providers.authorityContact?.byAuthorityId(authority.code) ||
      providers.authorityContact?.byNameOrDomain(authority.name || '') ||
      null;

    // Step 4: determine request type based on option constraint status.
    const requestType = resolveRequestType(viable);

    // Step 5: draft message from template (no LLM).
    const message = buildRequestMessage({
      problem,
      locality,
      option: viable,
      authority,
      requestType,
      fusionSummary,
    });

    // Step 6: persist the draft communication.
    const context = requestContextFrom({ locality, problem, recommendation: viable });
    run(
      `INSERT INTO clarification_requests
         (analysis_id, authority_code, authority_name, authority_id, request_type, reason, message, context,
          contact_name, contact_role, channel, status, sent_at, created_at)
       VALUES
         ($aid, $code, $name, $authorityId, $type, $reason, $message, $context,
          $contactName, $contactRole, $channel, 'draft', NULL, $created)`,
      {
        $aid:         analysisId,
        $code:        authority.code,
        $name:        authority.name,
        $authorityId: contact?.authority_id || authority.code,
        $type:        requestType,
        $reason:      `Recommended intervention "${viable.name || viable.option?.name}" requires ${authority.name} involvement.`,
        $message:     message,
        $context:     JSON.stringify(context),
        $contactName: contact?.contact_name || `${authority.name} Liaison`,
        $contactRole: contact?.contact_role || 'Department Head',
        $channel:     contact?.preferred_channel || 'email',
        $created:     nowIso(),
      },
    );
    const requestId = get('SELECT last_insert_rowid() AS id').id;

    completeAgentRun(runId, 'authorityRequest', { involvement_needed: true, request_type: requestType, authority_code: authority.code }, [
      {
        ref:          'authority-routing',
        source:       'Deterministic Authority Registry',
        source_label: 'Authority Registry',
        is_demo:      providers.authority.isDemo(),
        detail:       `${requestType} → ${authority.name} (${authority.code}) via ${contact?.preferred_channel || 'email'}. Routed by category rule, no LLM call.`,
      },
    ]);

    return {
      involvement_needed: true,
      requestId,
      requestType,
      authority,
      contact,
      message,
      decision: {
        authority_involvement_required: true,
        request_type: requestType,
        responsible_authority_id: authority.code,
        responsible_authority_name: authority.name,
        reason: `${authority.name} is responsible for ${authority.domain}.`,
        message,
      },
      status: 'draft',
    };
  } catch (err) {
    failAgentRun(runId, err.message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determines the request type from the option's constraint_status.
 * This is fully deterministic — no LLM involved.
 */
function resolveRequestType(option) {
  const status = option.constraint_status || 'clear';
  if (status === 'blocked')           return 'APPROVAL_REQUEST';
  if (status === 'approval_required') return 'APPROVAL_REQUEST';
  // Default: the recommendation needs authority co-ordination to execute.
  return 'COORDINATION_REQUEST';
}

/**
 * Builds a professional, structured request message from a template.
 * Avoids LLM cost while still producing a clear, consistent communication.
 */
function buildRequestMessage({ problem, locality, option, authority, requestType, fusionSummary }) {
  const optionName = option.name || option.option?.name || 'recommended intervention';
  const optionDesc = option.description || option.option?.description || '';
  const timeline   = option.timeline_months ? `${option.timeline_months} months` : 'to be confirmed';
  const cost       = option.est_cost_inr
    ? `Estimated cost: ₹${Number(option.est_cost_inr).toLocaleString('en-IN')}.`
    : '';

  const typeLabel = {
    APPROVAL_REQUEST:      'Approval Request',
    COORDINATION_REQUEST:  'Coordination Request',
    SUPPORT_REQUEST:       'Support Request',
    INFORMATION_REQUEST:   'Information Request',
  }[requestType] || 'Coordination Request';

  return [
    `Subject: ${typeLabel} — ${problem.title} | ${locality.name}`,
    '',
    `Dear ${authority.name} Team,`,
    '',
    `The Hyderabad Urban Planning Department is writing to request your ${typeLabel.toLowerCase()} regarding the following urban problem in ${locality.name}:`,
    '',
    `Problem: ${problem.title}`,
    `${problem.description ? problem.description.slice(0, 300) : ''}`,
    '',
    `Proposed Intervention: ${optionName}`,
    `${optionDesc.slice(0, 300)}`,
    `Implementation Timeline: ${timeline}. ${cost}`,
    '',
    fusionSummary ? `Context summary from multi-domain analysis: ${fusionSummary.slice(0, 300)}` : '',
    '',
    `As the responsible authority for ${authority.domain} in Hyderabad, your involvement is essential for successful execution. Please review the above and advise on next steps, any constraints or approval requirements, and your available timeline for engagement.`,
    '',
    'This request was generated by the HYTRACE Urban Intelligence Platform and is pending planner review before dispatch.',
    '',
    'Regards,',
    'Hyderabad Urban Planning Department',
  ].filter((l) => l !== null).join('\n').trim();
}