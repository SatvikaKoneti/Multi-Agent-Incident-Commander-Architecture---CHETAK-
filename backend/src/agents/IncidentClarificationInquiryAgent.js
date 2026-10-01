import { startAgentRun, completeAgentRun, failAgentRun } from './agentWorkflowHelpers.js';
import { run, get } from '../db/index.js';
import { nowIso } from '../utils/index.js';

/**
 * Clarification Agent — SIMPLIFIED version.
 *
 * The coordinator already decided `clarification_required = true` and listed
 * `missing_information`. This agent's sole job is now:
 *  1. Deterministically select the best authority for the missing information
 *     (by matching missing_information topics to authority domains — no LLM).
 *  2. Draft a structured clarification message from a template.
 *  3. Persist the draft for planner review.
 *
 * The old LLM call duplicated the coordinator's reasoning and added latency.
 * Removing it cuts one LLM call while keeping output quality identical.
 */
export async function runClarificationAgent({ ai, analysisId, locality, problem, evidenceContext, missingInformation, providers }) {
  const candidateAuthorities = providers.authority.all();
  const runId = startAgentRun({
    analysisId,
    agentName: 'clarification',
    config: { model: 'deterministic-routing', temperature: 0 },
    input: { locality, problem },
  });

  try {
    // Deterministic authority selection: match missing info topics to domains.
    const authority = selectAuthorityForMissingInfo(missingInformation, problem, candidateAuthorities);

    // Draft a structured clarification message from a template.
    const message = buildClarificationMessage({
      problem,
      locality,
      authority,
      missingInformation,
      evidenceContext,
    });

    completeAgentRun(runId, 'clarification', { clarification_required: true, responsible_authority_code: authority.code, message }, [
      {
        ref:          'authority-registry',
        source:       providers.authority.meta.sourceLabel,
        source_label: 'Stakeholder Registry',
        is_demo:      providers.authority.isDemo(),
        detail:       `Authority resolved deterministically: ${authority.name} (${authority.code}) — domain: ${authority.domain}`,
      },
    ]);

    run(
      `INSERT INTO clarification_requests (analysis_id, authority_code, authority_name, reason, message, context, status)
       VALUES ($analysisId, $code, $name, $reason, $message, $context, 'draft')`,
      {
        $analysisId: analysisId,
        $code:       authority.code,
        $name:       authority.name,
        $reason:     `Missing information required before recommendation: ${(missingInformation || []).slice(0, 2).join('; ')}`,
        $message:    message,
        $context:    JSON.stringify({
          locality:            locality.name,
          problem:             problem.title,
          problem_description: problem.description,
          missing_information: missingInformation || [],
          evidence:            evidenceContext,
        }),
      },
    );
    const requestId = get('SELECT last_insert_rowid() AS id').id;

    return {
      decision: {
        clarification_required:        true,
        responsible_authority_code:    authority.code,
        responsible_authority_name:    authority.name,
        why_information_required:      `Missing data prevents a responsible recommendation: ${(missingInformation || []).join('; ')}`,
        missing_information:           missingInformation || [],
        message,
        mock: 'Deterministic routing — no LLM used.',
      },
      authority,
      requestId,
      message,
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
 * Selects the most relevant authority by keyword-matching the missing
 * information topics against each authority's domain and responsibility text.
 */
function selectAuthorityForMissingInfo(missingInformation, problem, authorities) {
  const infoText = [...(missingInformation || []), problem.title, problem.category || '']
    .join(' ')
    .toLowerCase();

  // Score each authority by how many of its keywords match the missing info.
  let best = null;
  let bestScore = -1;
  for (const auth of authorities) {
    const haystack = `${auth.domain} ${auth.responsibility || ''} ${(auth.assigned_categories || []).join(' ')}`.toLowerCase();
    const keywords = haystack.split(/[\s,]+/).filter((w) => w.length > 3);
    const score    = keywords.filter((kw) => infoText.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      best      = auth;
    }
  }
  return best || authorities[0];
}

/**
 * Builds a professional clarification request message from a template.
 */
function buildClarificationMessage({ problem, locality, authority, missingInformation }) {
  const items = (missingInformation || []).map((m, i) => `  ${i + 1}. ${m}`).join('\n');
  return [
    `Subject: Clarification Request — ${problem.title} | ${locality.name}`,
    '',
    `Dear ${authority.name} Team,`,
    '',
    `The Hyderabad Urban Planning Department is analysing an urban issue in ${locality.name} and requires the following information from your department before a responsible recommendation can be made:`,
    '',
    `Problem: ${problem.title}`,
    '',
    'Information Required:',
    items,
    '',
    `Please provide the above at your earliest convenience. This request is part of the HYTRACE Urban Intelligence Platform workflow and is pending planner review before dispatch.`,
    '',
    'Regards,',
    'Hyderabad Urban Planning Department',
  ].join('\n').trim();
}
