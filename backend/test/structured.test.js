import { test } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';

const { extractJSON, validateAgainstSchema, clampConfidence } = await import('../src/ai/structured.js');

test('extractJSON handles fenced markdown blocks', () => {
  const out = extractJSON('Here you go:\n```json\n{"category":"Road Traffic","severity":7}\n```\nDone.');
  assert.equal(out.category, 'Road Traffic');
});

test('extractJSON returns null for truncated (unrecoverable) JSON', () => {
  const out = extractJSON('{"category":"Energy / Power Supply","severity":8,"priority_dimensions":{"severity":80,');
  assert.equal(out, null);
});

test('extractJSON strips leading prose', () => {
  const out = extractJSON('I analyzed the image. Result: {"summary":"congested","confidence":0.9}');
  assert.equal(out.summary, 'congested');
});

test('validateAgainstSchema rejects objects missing required fields', () => {
  const schema = { type: 'object', required: ['category', 'severity'], properties: { category: { type: 'string' }, severity: { type: 'number' } } };
  const ok = validateAgainstSchema({ category: 'Road Traffic', severity: 8 }, schema);
  assert.equal(ok.valid, true);
  const bad = validateAgainstSchema({ category: 'Road Traffic' }, schema);
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.length >= 1);
});

test('clampConfidence keeps confidence in the 0..1 range', () => {
  assert.equal(clampConfidence(1.4), 1);
  assert.equal(clampConfidence(-0.2), 0);
  assert.equal(clampConfidence(0.64), 0.64);
});