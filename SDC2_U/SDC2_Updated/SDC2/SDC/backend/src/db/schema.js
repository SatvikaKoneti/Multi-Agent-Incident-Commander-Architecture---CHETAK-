export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('citizen','planner','authority')),
  authority_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS localities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  population INTEGER,
  area_sqkm REAL,
  is_demo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS citizen_complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_id TEXT NOT NULL UNIQUE,
  user_id INTEGER,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  locality_id TEXT,
  area TEXT,
  lat REAL,
  lng REAL,
  severity_input INTEGER,
  image_path TEXT,
  video_path TEXT,
  ai_classification TEXT,
  ai_classified_at TEXT,
  priority_score REAL,
  status TEXT NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  planner_id INTEGER,
  locality_id TEXT,
  problem_title TEXT,
  problem_description TEXT,
  category TEXT,
  source_complaint_ids TEXT,
  priority_score REAL,
  status TEXT NOT NULL DEFAULT 'created',
  coordinator_decision TEXT,
  specialist_failures TEXT,
  recommendation_failure TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_id INTEGER,
  agent_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  config TEXT,
  input_context TEXT,
  started_at TEXT,
  finished_at TEXT,
  error TEXT
);

CREATE TABLE IF NOT EXISTS agent_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER,
  agent_name TEXT NOT NULL,
  result TEXT NOT NULL,
  evidence TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fusion_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_id INTEGER UNIQUE,
  result TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_id INTEGER UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  final_option_id INTEGER,
  planner_notes TEXT,
  missing_information TEXT,
  assumptions TEXT,
  uncertainty TEXT,
  verification_needed TEXT,
  refinement_log TEXT,
  xai_explanation TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS recommendation_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recommendation_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  summary TEXT,
  components TEXT,
  est_cost_inr REAL,
  cost_breakup TEXT,
  impact_score REAL,
  feasibility_score REAL,
  timeline_months REAL,
  environmental_effect TEXT,
  energy_effect TEXT,
  population_benefit TEXT,
  risks TEXT,
  dependencies TEXT,
  evidence TEXT,
  why_generated TEXT,
  constraints_applied TEXT,
  target_authority TEXT,
  constraint_status TEXT,
  rank INTEGER,
  viability REAL,
  blocked INTEGER NOT NULL DEFAULT 0,
  block_reason TEXT,
  is_recommended INTEGER NOT NULL DEFAULT 0,
  revised_from_id INTEGER,
  xai_scores TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clarification_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_id INTEGER NOT NULL,
  authority_code TEXT NOT NULL,
  authority_name TEXT,
  authority_id TEXT,
  request_type TEXT NOT NULL DEFAULT 'CLARIFICATION_REQUEST',
  reason TEXT,
  message TEXT,
  context TEXT,
  contact_name TEXT,
  contact_role TEXT,
  channel TEXT,
  provider TEXT,
  delivery TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  planner_notes TEXT,
  sent_by INTEGER,
  sent_at TEXT,
  responded_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS authority_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  response TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  raw TEXT,
  ai_interpretation TEXT,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS implementation_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recommendation_id INTEGER NOT NULL,
  recommendation_option_id INTEGER,
  status TEXT NOT NULL DEFAULT 'planned',
  milestones TEXT,
  notes TEXT,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS kpis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recommendation_id INTEGER,
  recommendation_option_id INTEGER,
  metric_name TEXT NOT NULL,
  predicted TEXT,
  observed TEXT,
  delta REAL,
  baseline REAL,
  unit TEXT,
  measured_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memory_id TEXT UNIQUE,
  problem_key TEXT,
  problem_text TEXT,
  locality_id TEXT,
  category TEXT,
  summary TEXT,
  recommendation TEXT,
  planner_decision TEXT,
  authority_response TEXT,
  implementation_result TEXT,
  kpi_summary TEXT,
  feedback TEXT,
  tags TEXT,
  embedding TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_id INTEGER,
  recommendation_id INTEGER,
  user_id INTEGER,
  role TEXT,
  rating INTEGER,
  comments TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS problem_clusters (
  cluster_id TEXT PRIMARY KEY,
  locality_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_planner_id TEXT,
  assigned_planner_name TEXT,
  authority_code TEXT,
  authority_name TEXT,
  sla_hours INTEGER DEFAULT 48,
  acknowledged_at TEXT,
  acknowledged_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS authorities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT,
  domain TEXT NOT NULL,
  description TEXT,
  assigned_categories TEXT,
  sla_hours INTEGER DEFAULT 48,
  contact_email TEXT,
  phone TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_complaints_locality ON citizen_complaints(locality_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON citizen_complaints(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_analysis ON agent_runs(analysis_id);
CREATE INDEX IF NOT EXISTS idx_memory_locality ON agent_memory(locality_id);
CREATE INDEX IF NOT EXISTS idx_clusters_locality ON problem_clusters(locality_id);
CREATE INDEX IF NOT EXISTS idx_authorities_code ON authorities(code);
`;

export function applySchema() {}