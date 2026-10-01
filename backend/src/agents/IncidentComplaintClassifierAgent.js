import fs from 'node:fs';
import path from 'node:path';
import { promptClassify } from '../ai/prompts.js';
import { classifyComplaintSchema } from '../ai/schemas.js';
import { run, get } from '../db/index.js';
import { nowIso, clamp } from '../utils/index.js';
import { computePriority } from '../engine/IncidentPriorityRanker.js';
import { config } from '../config.js';

const CATEGORIES = [
  'Road Traffic',
  'Air Pollution',
  'Energy / Power Supply',
  'Waste Management',
  'Water Supply',
  'Drainage',
  'Public Transport',
  'Street Lighting',
  'Infrastructure',
  'Other',
];

const freetextCategories = CATEGORIES.slice(0, 9);

function knownLocalities(localities) {
  return localities.map((l) => l.name);
}

function readUploadedImageAsDataUrl(complaint) {
  if (!complaint.image_path) return null;
  const abs = path.isAbsolute(complaint.image_path)
    ? complaint.image_path
    : path.resolve(config.root, complaint.image_path);
  if (!fs.existsSync(abs)) return null;
  const ext = path.extname(abs).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const b64 = fs.readFileSync(abs).toString('base64');
  return { dataUrl: `data:${mime};base64,${b64}`, mediaType: mime };
}

/**
 * AI classification (multimodal when an image is present). The image is passed
 * to the VLM so classification derives from text + image + context.
 */
export async function classifyComplaint({ ai, complaint, localities }) {
  if (!ai.isConfigured) {
    return {
      ai_error: 'AI service is not configured; classification will be completed when GROK_API_KEY (or OPENROUTER_API_KEY) is set.',
      category: complaint.category || null,
      locality: complaint.locality_id || null,
      priority_dimensions: null,
      score: null,
    };
  }

  const image = readUploadedImageAsDataUrl(complaint);
  const user = promptClassify({
    title: complaint.title,
    description: complaint.description,
    chosenLocality: complaint.locality_id || null,
    providedCategory: complaint.category || null,
    locations: knownLocalities(localities),
    categories: freetextCategories,
    imageNote: image
      ? `AN IMAGE IS ATTACHED TO THIS COMPLAINT (${image.mediaType}). Analyse the visible conditions (roads, congestion, infrastructure, waste, smoke, etc.) and combine them with the text and location.`
      : 'NO IMAGE IS ATTACHED. Classify using text and location only.',
  });

  const { data } = await ai.generateStructured({
    system: '',
    user,
    schema: classifyComplaintSchema,
    image,
    metadata: { agent: 'classify' },
  });

  const dimensions = data.priority_dimensions || {};
  const computed = computePriority({
    severity: clamp(dimensions.severity, 0, 100),
    population_impact: clamp(dimensions.population_impact, 0, 100),
    environmental_impact: clamp(dimensions.environmental_impact, 0, 100),
    urgency: clamp(dimensions.urgency, 0, 100),
    feasibility: clamp(dimensions.feasibility, 0, 100),
  });
  const score = computed.score;

  return {
    category: data.category,
    domain: data.domain,
    severity: data.severity,
    locality: data.locality,
    confidence: data.confidence,
    summary: data.summary,
    key_indicators: data.key_indicators || [],
    visible_conditions: data.visible_conditions || [],
    missing_information: data.missing_information || [],
    priority_dimensions: dimensions,
    score,
    ai_classified_at: nowIso(),
  };
}

export async function saveClassification({ complaintId, classification }) {
  run(
    `UPDATE citizen_complaints
     SET category = COALESCE($category, category),
         ai_classification = $ai,
         ai_classified_at = $when,
         priority_score = $score,
         status = CASE WHEN status='open' THEN 'in_review' ELSE status END,
         updated_at = $when
     WHERE id = $id`,
    {
      $id: complaintId,
      $category: classification.category || null,
      $ai: JSON.stringify(classification),
      $when: nowIso(),
      $score: classification.score,
    },
  );
  return get('SELECT * FROM citizen_complaints WHERE id = ?', [complaintId]);
}
