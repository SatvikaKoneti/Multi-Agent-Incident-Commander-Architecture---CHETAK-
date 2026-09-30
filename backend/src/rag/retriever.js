import { VectorStore } from './vectorStore.js';
import { buildKnowledgeChunks } from './knowledgeBase.js';
import { get } from '../db/index.js';

let store = null;

export function getStore() {
  if (!store) {
    store = new VectorStore({});
    indexKnowledge();
  }
  return store;
}

export function indexKnowledge(force = false) {
  const s = getStore();
  if (!force && s.size() > 0) return;
  const chunks = buildKnowledgeChunks();
  for (const chunk of chunks) {
    s.add({
      id: chunk.id,
      fields: { title: chunk.title, body: chunk.body },
      metadata: {
        source: chunk.source,
        source_label: chunk.source_label,
        is_demo: chunk.is_demo,
      },
    });
  }
  s.persist();
}

export function formatContext(results) {
  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.fields.title}\n${r.fields.body}\nSOURCE: ${r.metadata.source} (${r.metadata.is_demo ? 'SYNTHETIC DEMO DATA' : 'reference KB'})`,
    )
    .join('\n\n');
}

export function buildRetrievalQuery({ problem, locality, category }) {
  return [problem, locality, category].filter(Boolean).join(' ');
}

export function retrieve({ problem, locality, category, k = 6 }) {
  const s = getStore();
  const query = buildRetrievalQuery({ problem, locality, category });
  return s.search(query, k);
}

export function asEvidence(results) {
  return results.map((r) => ({
    ref: r.id,
    source: r.metadata.source_label || r.metadata.source,
    source_label: r.metadata.source,
    is_demo: r.metadata.is_demo,
    detail: `${r.fields.title}. ${String(r.fields.body).slice(0, 320)}`,
    score: Math.round(r.score * 1000) / 1000,
  }));
}

export function resetStore() {
  store = null;
}

export function indexMemory(memory) {
  const s = getStore();
  s.add({
    id: memory.memory_id,
    fields: {
      title: memory.category || 'planned intervention',
      body: `${memory.problem_text || ''} ${memory.summary || ''} ${memory.recommendation || ''} ${memory.feedback || ''}`,
    },
    metadata: {
      type: 'memory',
      source: 'Agent Memory',
      source_label: 'Agent Memory',
      is_demo: false,
      locality: memory.locality_id,
      category: memory.category,
    },
  });
  s.persist();
}

export function retrieveMemory({ problem, locality, category, k = 3 }) {
  const s = getStore();
  const query = buildRetrievalQuery({ problem, locality, category });
  const results = s.search(query, 200);
  const memories = results.filter((r) => r.metadata.type === 'memory');
  const top = memories.slice(0, k);
  return top.map((r) => {
    const dbRow = get('SELECT * FROM agent_memory WHERE memory_id = ?', [r.id]);
    return dbRow || null;
  }).filter(Boolean);
}