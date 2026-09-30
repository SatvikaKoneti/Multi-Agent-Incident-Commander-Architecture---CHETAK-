import { Router } from 'express';
import { asyncHandler, AppError, generateTrackingId, nowIso } from '../utils/index.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { run, get, query } from '../db/index.js';
import { uploadImage, uploadVideo, toPublicPath } from '../services/upload.js';
import { getAI } from '../di.js';
import { classifyComplaint, saveClassification } from '../agents/index.js';
import { findLocality } from '../agents/helper.js';
import { audit } from '../services/audit.js';

const router = Router();

function complaintPublicView(c) {
  return {
    id: c.id,
    tracking_id: c.tracking_id,
    title: c.title,
    description: c.description,
    category: c.category,
    locality: c.locality_id,
    area: c.area,
    lat: c.lat,
    lng: c.lng,
    severity_input: c.severity_input,
    status: c.status,
    resolution_notes: c.resolution_notes,
    image_path: c.image_path,
    video_path: c.video_path,
    priority_score: c.priority_score,
    ai_classified: Boolean(c.ai_classification),
    created_at: c.created_at,
  };
}

function enforceCitizenRoleIfAuthed(req, res, next) {
  if (req.user && req.user.role !== 'citizen') {
    return next(new AppError(403, 'This action is restricted to citizen accounts.'));
  }
  return next();
}

/**
 * Submit a citizen complaint. Multipart form:
 *   title, description, category?, locality?, area?, lat?, lng?, severity_input?
 *   image?(file), video?(file)
 */
router.post(
  '/',
  optionalAuth,
  enforceCitizenRoleIfAuthed,
  uploadImage.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]),
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (!body.title || !body.description) throw new AppError(400, 'title and description are required.');

    const locality = findLocality(null, body.locality || body.area || '');
    const trackingId = body.tracking_id || generateTrackingId();
    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    run(
      `INSERT INTO citizen_complaints
       (tracking_id, user_id, title, description, category, locality_id, area, lat, lng, severity_input, image_path, video_path, status)
       VALUES ($tracking, $user, $title, $description, $category, $locality, $area, $lat, $lng, $severity, $image, $video, 'open')`,
      {
        $tracking: trackingId,
        $user: req.user ? req.user.uid : null,
        $title: String(body.title).slice(0, 200),
        $description: String(body.description).slice(0, 5000),
        $category: body.category || null,
        $locality: locality ? locality.id : null,
        $area: body.area || body.locality || locality?.name || null,
        $lat: body.lat !== undefined ? Number(body.lat) : null,
        $lng: body.lng !== undefined ? Number(body.lng) : null,
        $severity: body.severity_input !== undefined ? Math.min(10, Math.max(1, Number(body.severity_input))) : null,
        $image: imageFile ? toPublicPath(imageFile).replace('/uploads/', 'uploads/') : null,
        $video: videoFile ? toPublicPath(videoFile).replace('/uploads/', 'uploads/') : null,
      },
    );
    const id = get('SELECT last_insert_rowid() AS id').id;
    const complaint = get('SELECT * FROM citizen_complaints WHERE id = ?', [id]);

    audit({
      userId: req.user?.uid,
      role: req.user?.role || 'citizen',
      action: 'complaint.submit',
      entityType: 'citizen_complaint',
      entityId: id,
      details: { tracking_id: trackingId, image: Boolean(imageFile), video: Boolean(videoFile) },
      ip: req.ip,
    });

    const ai = getAI();
    let classification = null;
    if (ai && ai.isConfigured) {
      const localities = query('SELECT id, name FROM localities');
      try {
        classification = await classifyComplaint({ ai, complaint, localities });
        const updated = await saveClassification({ complaintId: id, classification });
        classification.complaint = complaintPublicView(updated);
      } catch (err) {
        classification = { ai_error: err.message };
      }
    }

    res.status(201).json({
      tracking_id: trackingId,
      complaint: complaintPublicView(complaint),
      status: 'submitted',
      classification,
    });
  }),
);

router.get(
  '/track/:trackingId',
  optionalAuth,
  enforceCitizenRoleIfAuthed,
  asyncHandler(async (req, res) => {
    const c = get('SELECT * FROM citizen_complaints WHERE tracking_id = ?', [req.params.trackingId]);
    if (!c) throw new AppError(404, 'No complaint found with this tracking ID.');
    if (c.user_id && req.user && c.user_id !== req.user.uid) {
      throw new AppError(403, 'Access denied. You can only track your own complaints.');
    }
    const timeline = buildTimeline(c);
    res.json({ complaint: complaintPublicView(c), timeline });
  }),
);

function buildTimeline(c) {
  const steps = [
    { step: 'Submitted', key: 'submitted', status: 'done', at: c.created_at },
    { step: 'AI classification', key: 'classified', status: c.ai_classified_at ? 'done' : 'pending', at: c.ai_classified_at },
    { step: 'Planner review', key: 'review', status: c.status === 'in_review' ? 'active' : 'pending' },
    { step: 'Authority action', key: 'authority', status: c.status === 'in_progress' ? 'active' : 'pending' },
    { step: 'Implementation', key: 'implementation', status: c.status === 'in_progress' ? 'active' : 'pending' },
    { step: 'Resolution', key: 'resolved', status: c.status === 'resolved' ? 'done' : 'pending', at: c.resolved_at },
  ];
  return steps;
}

router.get(
  '/',
  requireAuth,
  requireRole('citizen'),
  asyncHandler(async (req, res) => {
    const status = req.query.status || null;
    let rows = query('SELECT * FROM citizen_complaints WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC', [req.user.uid]);
    if (status) rows = rows.filter((r) => r.status === status);
    res.json({ complaints: rows.map(complaintPublicView) });
  }),
);

router.get(
  '/:id',
  requireAuth,
  requireRole('citizen'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const c = get('SELECT * FROM citizen_complaints WHERE id = ?', [id]);
    if (!c) throw new AppError(404, 'Complaint not found.');
    if (c.user_id && c.user_id !== req.user.uid) {
      throw new AppError(403, 'Access denied. You can only view your own complaints.');
    }
    res.json({ complaint: complaintPublicView(c), timeline: buildTimeline(c) });
  }),
);

export default router;