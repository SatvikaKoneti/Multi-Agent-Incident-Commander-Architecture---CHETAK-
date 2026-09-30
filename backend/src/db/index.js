import { openDatabase, execute, persistNow, get, query } from './engine.js';
import { SCHEMA } from './schema.js';
import { INCIDENT_SCHEMA } from './incidentSchema.js';

let initialized = false;

/**
 * Adds columns to existing tables when the database was created by an older
 * schema version. CREATE TABLE IF NOT EXISTS never alters existing tables, so
 * local databases from previous runs need these migrations.
 */
function migrate() {
  const existing = query("PRAGMA table_info('clarification_requests')");
  const cols = new Set(existing.map((c) => c.name));
  const additions = [
    ['authority_id', "TEXT DEFAULT ''"],
    ['request_type', "TEXT NOT NULL DEFAULT 'CLARIFICATION_REQUEST'"],
    ['contact_name', "TEXT DEFAULT ''"],
    ['contact_role', "TEXT DEFAULT ''"],
    ['channel', "TEXT DEFAULT ''"],
    ['provider', "TEXT DEFAULT ''"],
    ['delivery', 'TEXT'],
    ['responded_at', 'TEXT'],
  ];
  for (const [name, ddl] of additions) {
    if (!cols.has(name)) {
      execute(`ALTER TABLE clarification_requests ADD COLUMN ${name} ${ddl}`);
    }
  }

  const recCols = new Set(query("PRAGMA table_info('recommendations')").map((c) => c.name));
  const recAdds = [
    ['missing_information', 'TEXT'],
    ['assumptions', 'TEXT'],
    ['uncertainty', 'TEXT'],
    ['verification_needed', 'TEXT'],
    ['refinement_log', 'TEXT'],
    ['xai_explanation', 'TEXT'],
  ];
  for (const [name, ddl] of recAdds) {
    if (!recCols.has(name)) {
      execute(`ALTER TABLE recommendations ADD COLUMN ${name} ${ddl}`);
    }
  }

  const optCols = new Set(query("PRAGMA table_info('recommendation_options')").map((c) => c.name));
  if (!optCols.has('constraint_status')) {
    execute('ALTER TABLE recommendation_options ADD COLUMN constraint_status TEXT DEFAULT "clear"');
  }
  if (!optCols.has('xai_scores')) {
    execute('ALTER TABLE recommendation_options ADD COLUMN xai_scores TEXT');
  }

  const aCols = new Set(query("PRAGMA table_info('analyses')").map((c) => c.name));
  if (!aCols.has('specialist_failures')) {
    execute('ALTER TABLE analyses ADD COLUMN specialist_failures TEXT');
  }
  if (!aCols.has('recommendation_failure')) {
    execute('ALTER TABLE analyses ADD COLUMN recommendation_failure TEXT');
  }
}

export async function initDatabase() {
  if (initialized) return;
  await openDatabase();
  execute(SCHEMA);
  execute(INCIDENT_SCHEMA);
  migrate();
  initialized = true;
  persistNow();
}

export { execute, persistNow };
export { run, query, get, getLastInsertId, transaction, closeDatabase, openDatabase } from './engine.js';