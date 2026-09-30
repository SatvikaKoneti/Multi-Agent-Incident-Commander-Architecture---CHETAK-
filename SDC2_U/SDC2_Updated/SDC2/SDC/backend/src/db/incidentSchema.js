export const INCIDENT_SCHEMA = `
CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  severity TEXT NOT NULL DEFAULT 'P1',
  status TEXT NOT NULL DEFAULT 'INVESTIGATING',
  service TEXT NOT NULL,
  patient_zero_service TEXT,
  blast_radius_index INTEGER DEFAULT 45,
  financial_impact_per_min REAL DEFAULT 24000,
  currency TEXT DEFAULT 'INR',
  sla_window_minutes INTEGER DEFAULT 30,
  sla_deadline_at TEXT,
  mttr_minutes REAL DEFAULT 0,
  noise_reduction_pct REAL DEFAULT 99.4,
  raw_alert_count INTEGER DEFAULT 482,
  correlated_signal_count INTEGER DEFAULT 3,
  confidence_score REAL DEFAULT 0.94,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS incident_telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  stream_type TEXT NOT NULL, -- 'LOG', 'METRIC', 'GIT', 'ALERT', 'VISION', 'CHAT'
  source TEXT NOT NULL,
  payload TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  severity TEXT DEFAULT 'INFO',
  is_anomaly INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incident_debates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  round_number INTEGER NOT NULL DEFAULT 1,
  agent_role TEXT NOT NULL, -- 'DETECTIVE', 'SKEPTIC', 'MEMORY', 'SIMULATOR', 'COMMANDER'
  agent_name TEXT NOT NULL,
  statement TEXT NOT NULL,
  evidence TEXT,
  falsification_points TEXT,
  confidence REAL DEFAULT 0.9,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incident_hypotheses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  hypothesis_title TEXT NOT NULL,
  description TEXT,
  probability REAL NOT NULL,
  falsification_status TEXT DEFAULT 'TESTING', -- 'VALIDATED', 'REFUTED', 'TESTING'
  refutation_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incident_guardrail_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  command TEXT NOT NULL,
  action_name TEXT NOT NULL,
  safety_tier TEXT NOT NULL, -- 'GREEN', 'YELLOW', 'RED'
  dry_run_prediction TEXT,
  risk_assessment TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'BLOCKED', 'EXECUTED'
  executed_by TEXT,
  executed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS historical_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  service TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  resolution_steps TEXT NOT NULL,
  historical_trap_warning TEXT,
  similarity_vector TEXT,
  resolved_by TEXT,
  mttr_minutes REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incident_post_mortems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL UNIQUE,
  executive_summary TEXT NOT NULL,
  five_whys TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  recovery_timeline TEXT NOT NULL,
  financial_loss_total REAL,
  git_hotfix_diff TEXT,
  regression_test_code TEXT,
  prevention_runbook TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_incidents_tracking ON incidents(tracking_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_telemetry_incident ON incident_telemetry(incident_id);
CREATE INDEX IF NOT EXISTS idx_debates_incident ON incident_debates(incident_id);
CREATE INDEX IF NOT EXISTS idx_guardrails_incident ON incident_guardrail_actions(incident_id);
`;
