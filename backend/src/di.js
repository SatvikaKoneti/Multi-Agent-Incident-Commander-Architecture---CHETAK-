import { getAIProvider } from './ai/provider.js';
import { providerRegistry } from './providers/index.js';

/**
 * Dependency-injection container. Tests swap `di.ai` for a deterministic
 * test double; the running app always uses the configured live provider.
 */
export const di = {
  ai: getAIProvider(),
  providers: providerRegistry,
};

export function setAI(provider) {
  di.ai = provider;
}

export function getAI() {
  return di.ai;
}