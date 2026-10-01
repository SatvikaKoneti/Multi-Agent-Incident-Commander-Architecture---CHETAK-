import { indexKnowledge } from './ragSemanticRetriever.js';

export async function initRagIfNeeded() {
  indexKnowledge();
  return true;
}