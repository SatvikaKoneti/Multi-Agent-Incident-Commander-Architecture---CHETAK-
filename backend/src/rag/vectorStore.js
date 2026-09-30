import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { tokenize } from '../utils/index.js';

/**
 * Lightweight local sparse vector store using TF-IDF embeddings and cosine
 * similarity. Persists to a JSON file. This provides Retrieval-Augmented
 * Generation offline. A neural embedding model/API can be swapped in behind
 * the same add/search interface without changing callers.
 */
export class VectorStore {
  constructor({ file = config.vectorStorePath, model = 'tfidf-sparse-local' } = {}) {
    this.file = file;
    this.model = model;
    this.docs = [];
    this.idf = new Map();
    this._dirty = false;
    this._load();
  }

  _load() {
    if (this.file && fs.existsSync(this.file)) {
      try {
        const raw = JSON.parse(fs.readFileSync(this.file, 'utf8'));
        this.docs = (raw.docs || []).map((d) => ({ ...d, vector: new Map(d.vector || []) }));
        this.idf = new Map(raw.idf || []);
        this.model = raw.model || this.model;
      } catch {
        this.docs = [];
        this.idf = new Map();
      }
    }
  }

  persist() {
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const payload = JSON.stringify({
      model: this.model,
      docs: this.docs.map((d) => ({ ...d, vector: [...(d.vector || []).entries()] })),
      idf: [...this.idf.entries()],
    });
    fs.writeFileSync(this.file, payload);
    this._dirty = false;
  }

  /**
   * Add a document. `fields` is an object whose string values are indexed.
   */
  add({ id, fields = {}, metadata = {}, embedding }) {
    const text = Object.values(fields)
      .filter((v) => typeof v === 'string')
      .join('\n');
    const tokens = embedding && embedding.vector ? embedding.vector : tokenize(text);
    const vec = embedding && embedding.vector ? embedding.vectorToMap ? embedding.vectorToMap() : normTokens(tokens) : normTokens(tokens);
    this.docs.push({ id, fields, metadata, vector: vec, tf: this._termFreq(tokens) });
    for (const t of new Set(tokens)) {
      this.idf.set(t, (this.idf.get(t) || 0) + 1);
    }
    this._dirty = true;
    return id;
  }

  _termFreq(tokens) {
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    const out = new Map();
    for (const [t, c] of tf) {
      out.set(t, 1 + Math.log(c));
    }
    return out;
  }

  /**
   * Search by query text. Returns docs ranked by cosine similarity.
   */
  search(query, k = 5) {
    const tokens = tokenize(query);
    const q = this._termFreq(tokens);
    const n = this.docs.length || 1;
    const qvec = new Map();
    for (const [t, tf] of q) {
      const df = this.idf.get(t) || 0;
      const idf = df > 0 ? Math.log(n / df) + 1 : 0;
      if (idf > 0) qvec.set(t, tf * idf);
    }
    const scored = this.docs
      .map((doc, i) => ({ doc, i, score: this._cosine(qvec, doc.vector) }))
      .filter((x) => x.score > 0.0001);
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map(({ doc, score }) => ({ id: doc.id, fields: doc.fields, metadata: doc.metadata, score }));
  }

  _cosine(a, b) {
    if (a.size === 0 || b.size === 0) return 0;
    let dot = 0;
    const [small, large] = a.size < b.size ? [a, b] : [b, a];
    for (const [k, v] of small) {
      const w = large.get(k);
      if (w !== undefined) dot += v * w;
    }
    const na = Math.sqrt([...a.values()].reduce((s, v) => s + v * v, 0));
    const nb = Math.sqrt([...b.values()].reduce((s, v) => s + v * v, 0));
    return na === 0 || nb === 0 ? 0 : dot / (na * nb);
  }

  size() {
    return this.docs.length;
  }
}

function normTokens(tokens) {
  const m = new Map();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return m;
}