import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_DB = path.join(ROOT, 'data', 'hyd_urban_ai.sqlite');
const DEFAULT_VECTOR = path.join(ROOT, 'data', 'vector_store.json');

function int(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 4000),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  db: {
    engine: process.env.DB_ENGINE || 'sqlite',
    path: process.env.DATABASE_PATH || DEFAULT_DB,
  },
  vectorStorePath: process.env.VECTOR_STORE_PATH || DEFAULT_VECTOR,
  ai: {
    get isGroq() {
      return Boolean(
        process.env.GROQ_API_KEY ||
        (process.env.AI_BASE_URL && process.env.AI_BASE_URL.includes('groq.com')) ||
        process.env.AI_PROVIDER === 'groq'
      );
    },
    get isGrok() {
      return Boolean(
        process.env.GROK_API_KEY ||
        process.env.XAI_API_KEY ||
        (process.env.AI_BASE_URL && process.env.AI_BASE_URL.includes('x.ai')) ||
        (process.env.AI_MODEL && process.env.AI_MODEL.toLowerCase().includes('grok'))
      );
    },
    get provider() {
      if (process.env.AI_PROVIDER) return process.env.AI_PROVIDER;
      if (this.isGroq) return 'groq';
      if (this.isGrok) return 'xai';
      return 'openrouter';
    },
    apiKey:
      process.env.GROQ_API_KEY ||
      process.env.GROK_API_KEY ||
      process.env.XAI_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.AI_API_KEY ||
      '',
    model:
      process.env.AI_MODEL ||
      (process.env.GROQ_API_KEY
        ? 'openai/gpt-oss-120b'
        : (process.env.GROK_API_KEY || process.env.XAI_API_KEY ? 'grok-2-vision-1212' : 'openrouter/free')),
    baseUrl:
      process.env.AI_BASE_URL ||
      (process.env.GROQ_API_KEY
        ? 'https://api.groq.com/openai/v1'
        : (process.env.GROK_API_KEY || process.env.XAI_API_KEY ? 'https://api.x.ai/v1' : 'https://openrouter.ai/api/v1')),
    temperature: int(process.env.AI_TEMPERATURE, 0.4),
    timeoutMs: int(process.env.AI_TIMEOUT_MS, 120000),
    maxTokens: int(process.env.AI_MAX_TOKENS, 3072),
  },
  auth: {
    secret: process.env.JWT_SECRET || 'dev-only-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  },
  uploads: {
    dir: process.env.UPLOAD_DIR || path.join(ROOT, 'uploads'),
    maxImageMb: int(process.env.UPLOAD_MAX_IMAGE_MB, 5),
    maxVideoMb: int(process.env.UPLOAD_MAX_VIDEO_MB, 50),
  },
  frontendDist: process.env.FRONTEND_DIST || path.join(ROOT, 'frontend', 'dist'),
  root: ROOT,
  isProduction: process.env.NODE_ENV === 'production',
};
