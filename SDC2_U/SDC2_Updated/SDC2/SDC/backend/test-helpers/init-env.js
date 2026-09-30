import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// MUST be imported before any module that reads config.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hyd-ai-test-'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.join(tmp, 'test.sqlite');
process.env.VECTOR_STORE_PATH = path.join(tmp, 'vectors.json');
process.env.UPLOAD_DIR = path.join(tmp, 'uploads');

export const TEST_TMP = tmp;

export function freshFile(key) {
  return path.join(tmp, `seed-${Date.now()}-${key}.sqlite`);
}