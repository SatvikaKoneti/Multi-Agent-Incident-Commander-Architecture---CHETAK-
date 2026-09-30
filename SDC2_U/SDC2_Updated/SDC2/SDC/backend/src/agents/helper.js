import { run, get, query } from '../db/index.js';
import { nowIso } from '../utils/index.js';

export function evItem(ref, source, sourceLabel, isDemo, detail) {
  return { ref, source, source_label: sourceLabel, is_demo: isDemo, detail };
}

export function pickEvidence(refs, map) {
  if (!Array.isArray(refs) || refs.length === 0) {
    return Object.values(map);
  }
  const out = [];
  for (const ref of refs) {
    if (map[ref]) out.push(map[ref]);
  }
  if (out.length === 0) return Object.values(map);
  return out;
}

export function startAgentRun({ analysisId, agentName, config = {}, input = {} }) {
  run(
    `INSERT INTO agent_runs (analysis_id, agent_name, status, config, input_context, started_at)
     VALUES ($analysisId, $agentName, 'running', $config, $input, $started)`,
    {
      $analysisId: analysisId,
      $agentName: agentName,
      $config: JSON.stringify(config),
      $input: JSON.stringify(input),
      $started: nowIso(),
    },
  );
  return get('SELECT last_insert_rowid() AS id').id;
}

export function completeAgentRun(runId, agentName, result, evidenceItems) {
  run(`UPDATE agent_runs SET status='complete', finished_at=$now WHERE id=$id`, {
    $now: nowIso(),
    $id: runId,
  });
  run(
    `INSERT INTO agent_results (run_id, agent_name, result, evidence) VALUES ($runId, $agentName, $result, $evidence)`,
    {
      $runId: runId,
      $agentName: agentName,
      $result: JSON.stringify(result),
      $evidence: JSON.stringify(evidenceItems || []),
    },
  );
}

export function failAgentRun(runId, error) {
  run(`UPDATE agent_runs SET status='error', error=$error, finished_at=$now WHERE id=$id`, {
    $error: String(error),
    $now: nowIso(),
    $id: runId,
  });
}

export function findLocality(tx, name) {
  if (!name) return null;
  return (
    get('SELECT * FROM localities WHERE LOWER(name) = LOWER($name)', { $name: name }) ||
    get('SELECT * FROM localities WHERE LOWER(id) LIKE $like', { $like: `%${String(name).toLowerCase().replace(/[^a-z0-9]/g, '')}%` })
  );
}

export function openComplaintsForLocality(localityId) {
  return query(
    `SELECT id, tracking_id, title, description, category, severity_input, status, ai_classification, priority_score, created_at
     FROM citizen_complaints
     WHERE locality_id = $localityId AND status IN ('open','in_review')
     ORDER BY priority_score DESC NULLS LAST, created_at DESC`,
    { $localityId: localityId },
  );
}

export function fmtEvidenceList(items) {
  return (items || [])
    .map((e) => `- [${e.ref}] ${e.source_label || e.source}${e.is_demo ? ' (DEMO)' : ''}: ${e.detail}`)
    .join('\n');
}