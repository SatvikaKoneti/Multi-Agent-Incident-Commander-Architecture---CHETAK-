export function asInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function round(n, digits = 1) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function generateId(prefix) {
  const now = new Date();
  return `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateTrackingId(year) {
  const y = year || new Date().getFullYear();
  const seq = 100000 + Math.floor(Math.random() * 899999);
  return `HYD-${y}-${seq}`;
}

export function nowIso() {
  // SQLite-friendly timestamp (matches datetime('now') format) so DESC sorting is consistent.
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

export function ucfirst(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

export function safeParseFile(v) {
  if (v === undefined || v === null || v === 'null') return null;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

export function jsonOrNull(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}