import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { config } from '../config.js';

const require = createRequire(import.meta.url);

let SQL = null;
let db = null;
let dbFile = null;
let persistTimer = null;

function loadSql() {
  if (SQL) return SQL;
  // sql.js ships a wasm build that must be located next to the library.
  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
  const initSqlJs = require('sql.js');
  SQL = initSqlJs({ locateFile: () => wasmPath });
  return SQL;
}

export async function openDatabase() {
  if (db) return db;
  if (config.db.engine !== 'sqlite') {
    throw new Error(
      `DB_ENGINE=${config.db.engine} is not wired. See docs/ARCHITECTURE.md. Engine ships with 'sqlite' for local demo; PostgreSQL requires implementing the db/engine.js factory.`,
    );
  }

  const absPath = path.isAbsolute(config.db.path)
    ? config.db.path
    : path.resolve(config.root, config.db.path);
  dbFile = absPath;
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });

  const init = await loadSql();
  if (fs.existsSync(dbFile)) {
    const fileBuffer = fs.readFileSync(dbFile);
    db = new init.Database(fileBuffer);
  } else {
    db = new init.Database();
  }
  schedulePersist(50);
  return db;
}

function schedulePersist(delay = 300) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistNow();
  }, delay);
}

export function persistNow() {
  if (!db || !dbFile) return;
  try {
    const data = db.export();
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    fs.writeFileSync(dbFile, Buffer.from(data));
  } catch (err) {
    // Non-fatal for demo mode; log and continue.
    if (config.env !== 'test') {
      // eslint-disable-next-line no-console
      console.error('[db] persist error', err.message);
    }
  }
}

function escalate(statement, params = {}) {
  const stmt = statement;
  if (params && Object.keys(params).length) {
    stmt.bind(params);
  }
  return stmt;
}

export function run(sqlText, params = {}) {
  assertBindable(params);
  try {
    db.run(sqlText, params);
  } catch (err) {
    throw annotateError(err, sqlText, params);
  }
  schedulePersist();
}

export function query(sqlText, params = {}) {
  assertBindable(params);
  const statement = db.prepare(sqlText);
  if (params && Object.keys(params).length) {
    try {
      statement.bind(params);
    } catch (err) {
      statement.free();
      throw annotateError(err, sqlText, params);
    }
  }
  const rows = [];
  while (statement.step()) {
    rows.push(statement.getAsObject());
  }
  statement.free();
  return rows;
}

export function get(sqlText, params = {}) {
  return query(sqlText, params)[0] || null;
}

function annotateError(err, sqlText, params) {
  if (typeof err === 'string') {
    return new Error(withContextMessage(err, sqlText, params, ''));
  }
  return withContext(err, sqlText, params);
}

function withContextMessage(message, sqlText, params, suffix) {
  if (message.includes(' [sql: ')) return message + suffix;
  const summary = Object.entries(params || {})
    .map(([k, v]) => `${k}=${v === null ? 'null' : typeof v === 'object' ? `[${v.constructor?.name}]` : String(v).slice(0, 60)}`)
    .slice(0, 20)
    .join(', ');
  return `${message} [sql: ${String(sqlText).slice(0, 220)} | params: ${summary}]`;
}

function withContext(err, sqlText, params) {
  if (err && typeof err.message === 'string' && !err.message.includes(' [sql: ')) {
    err.message = withContextMessage(err.message, sqlText, params, err.stack ? ` | stack: ${err.stack}` : '');
  }
  return err;
}

function assertBindable(params) {
  if (!params) return;
  for (const [k, v] of Object.entries(params)) {
    if (v && typeof v === 'object' && typeof v.then === 'function' && !(v instanceof Date)) {
      throw new Error(`[bind-debug] Parameter ${k} is a Promise; likely a missing await in a caller.`);
    }
  }
}

export function getLastInsertId() {
  const row = get('SELECT last_insert_rowid() AS id');
  return row ? row.id : null;
}

export function execute(sqlText) {
  db.exec(sqlText);
  schedulePersist();
}

export function transaction(fn) {
  db.run('BEGIN');
  try {
    const result = fn();
    db.run('COMMIT');
    schedulePersist();
    return result;
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

export async function closeDatabase() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (db) {
    persistNow();
    db.close();
    db = null;
  }
}