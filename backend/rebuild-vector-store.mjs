// Temporary script to force-rebuild the vector store with the expanded knowledge base.
// Run: node rebuild-vector-store.mjs
import { indexKnowledge, resetStore, getStore } from './src/rag/retriever.js';
resetStore();
indexKnowledge(true);
const s = getStore();
console.log('Vector store rebuilt. Document count:', s.size());
process.exit(0);
