import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

export const DATA_DIR = path.join(config.root, 'data');

export function readJson(relative) {
  const full = path.join(DATA_DIR, relative);
  if (!fs.existsSync(full)) {
    throw new Error(`Demo data file missing: ${relative}`);
  }
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function readCsv(relative) {
  const full = path.join(DATA_DIR, relative);
  if (!fs.existsSync(full)) {
    throw new Error(`Demo data file missing: ${relative}`);
  }
  const text = fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = parseCsvLine(line);
    const row = {};
    header.forEach((h, i) => {
      const v = vals[i];
      row[h] = v === undefined ? '' : v.trim();
    });
    return row;
  });
}

export function fileExists(relative) {
  return fs.existsSync(path.join(DATA_DIR, relative));
}

export const DEMO_LABEL = 'SYNTHETIC DEMO DATA';

export function demoMeta(source, note) {
  return {
    source,
    sourceLabel: source,
    isDemo: true,
    demoLabel: DEMO_LABEL,
    note,
  };
}