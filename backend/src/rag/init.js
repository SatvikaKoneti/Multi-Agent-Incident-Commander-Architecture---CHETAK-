import { indexKnowledge } from './retriever.js';

export async function initRagIfNeeded() {
  indexKnowledge();
  return true;
}