import { test, before } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';

let run;

before(async () => {
  const db = await import('../src/db/index.js');
  await db.initDatabase();
  run = db.run;
});

const { getStore, resetStore, retrieve, indexMemory, retrieveMemory, asEvidence, formatContext, indexKnowledge } = await import('../src/rag/retriever.js');
const { buildKnowledgeChunks } = await import('../src/rag/knowledgeBase.js');

function addChunk({ id, topic, text, sourceLabel, isDemo }) {
  getStore().add({
    id,
    fields: { title: topic, body: text },
    metadata: { source: sourceLabel, source_label: sourceLabel, is_demo: isDemo },
  });
}

test('knowledge base contains indexed, labelled demo chunks', () => {
  const chunks = buildKnowledgeChunks();
  assert.ok(chunks.length >= 20);
  const energy = chunks.filter((c) => String(c.id).includes('energy'));
  assert.ok(energy.length > 0);
  assert.equal(energy[0].is_demo, true);
});

test('TF-IDF vector store retrieves the best-matching chunk for a query', () => {
  resetStore();
  addChunk({ id: 'chunk-energy-gachibowli', topic: 'energy', text: 'Gachibowli feeder GB-1101 peaks at 48.5 MW against 52 MW installed capacity.', sourceLabel: 'Energy Provider (demo)', isDemo: true });
  addChunk({ id: 'chunk-traffic-hitec', topic: 'traffic', text: 'HITEC City Main Road is a heavy congestion corridor with peak volume 3200 vph.', sourceLabel: 'OSM (demo)', isDemo: true });
  const hits = retrieve({ problem: 'Gachibowli feeder overload peak demand', locality: 'Gachibowli', category: 'Energy / Power Supply' });
  assert.ok(hits.length > 0);
  assert.ok(hits.some((h) => h.id === 'chunk-energy-gachibowli'), 'energy chunk should match an energy query');
});

test('retrieval is formatted as evidence with demo labels', () => {
  const hits = retrieve({ problem: 'traffic congestion signal', locality: 'HITEC City / Madhapur' });
  const asEv = asEvidence(hits);
  assert.ok(asEv.every((e) => e.source && e.is_demo === true));
  const ctx = formatContext(hits);
  assert.match(ctx, /DEMO/);
});

test('knowledge indexing populates the persisted store once', () => {
  resetStore();
  indexKnowledge();
  const s = getStore();
  assert.ok(s.size() > 0);
});

test('memory indexing enables similarity retrieval of past cases', () => {
  const memory = {
    memory_id: 'MEM-2026-TEST1',
    problem_key: 'PRB-TEST1',
    problem_text: 'Overloaded feeder in Gachibowli caused repeated interruptions.',
    locality_id: 'osm-gachibowli',
    category: 'Energy / Power Supply',
    summary: 'Capacity upgrade avoided repeat interruptions.',
    recommendation: 'Feeder load balancing',
    planner_decision: 'approved',
    implementation_result: 'completed',
    kpi_summary: 'outage hours fell',
    feedback: 'positive',
    tags: ['energy', 'feeder', 'gachibowli'],
  };
  run(
    `INSERT INTO agent_memory (memory_id, problem_key, problem_text, locality_id, category, summary, recommendation, planner_decision, authority_response, implementation_result, kpi_summary, feedback, tags)
     VALUES ($id, $pk, $pt, $lid, $cat, $sum, $rec, $dec, $ar, $impl, $kpi, $fb, $tags)`,
    {
      $id: memory.memory_id,
      $pk: memory.problem_key,
      $pt: memory.problem_text,
      $lid: memory.locality_id,
      $cat: memory.category,
      $sum: memory.summary,
      $rec: memory.recommendation,
      $dec: memory.planner_decision,
      $ar: 'none',
      $impl: memory.implementation_result,
      $kpi: memory.kpi_summary,
      $fb: memory.feedback,
      $tags: JSON.stringify(memory.tags),
    },
  );
  indexMemory(memory);
  const mem = retrieveMemory({ problem: 'Gachibowli feeder interruptions', locality: 'Gachibowli', category: 'Energy / Power Supply' });
  assert.ok(mem.some((m) => m.memory_id === 'MEM-2026-TEST1'), 'memory should be retrievable by similarity');
});