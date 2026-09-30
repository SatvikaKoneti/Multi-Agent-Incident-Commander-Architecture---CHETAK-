import { Router } from 'express';
import { asyncHandler, AppError, jsonOrNull } from '../utils/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { get, run, query } from '../db/index.js';
import { getAI } from '../di.js';
import { providerRegistry } from '../providers/index.js';
import { ingestAuthorityResponse } from '../agents/index.js';
import { refineAfterAuthorityResponse } from '../engine/recommendation.js';
import { audit } from '../services/audit.js';

const router = Router();
router.use(requireAuth, requireRole('authority'));

function resolveAuthority(req) {
  const code = get('SELECT authority_code FROM users WHERE id = ?', [req.user.uid]);
  if (!code || !code.authority_code) return null;
  return providerRegistry.authority.byCode(code.authority_code);
}

function requestView(r) {
  return {
    id: r.id,
    analysis_id: r.analysis_id,
    authority_code: r.authority_code,
    authority_name: r.authority_name,
    reason: r.reason,
    message: r.message,
    status: r.status,
    sent_at: r.sent_at,
    created_at: r.created_at,
    context: jsonOrNull(r.context),
  };
}

router.get(
  '/list',
  asyncHandler(async (req, res) => {
    const authorities = providerRegistry.authority.all();
    res.json({ authorities });
  }),
);

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const authority = resolveAuthority(req);
    if (!authority) throw new AppError(404, 'User is not assigned to any authority.');
    res.json({ authority });
  }),
);

router.get(
  '/inbox',
  asyncHandler(async (req, res) => {
    const authority = resolveAuthority(req);
    const code = authority ? authority.code : '__none__';
    const rows = query(
      "SELECT * FROM clarification_requests WHERE (authority_code = $code OR authority_id = $code) AND status IN ('sent','responded','acknowledged') ORDER BY created_at DESC",
      { $code: code },
    );
    const allAuthorities = providerRegistry.authority.all();
    res.json({
      authority,
      inbox: rows.map(requestView),
      availableAuthorities: allAuthorities,
    });
  }),
);

router.get(
  '/clusters',
  asyncHandler(async (req, res) => {
    const authority = resolveAuthority(req);
    if (!authority) throw new AppError(403, 'User is not assigned to any authority.');
    const code = authority.code;
    const { getCityWideIntelligence } = await import('../engine/problems.js');
    const intel = getCityWideIntelligence();
    const assignedClusters = intel.clusters.filter(
      (c) => c.authority_code === code || (authority.assigned_categories && authority.assigned_categories.includes(c.category)),
    );
    res.json({
      authority,
      clusters: assignedClusters,
      totalCount: assignedClusters.length,
    });
  }),
);

router.get(
  '/requests/:id',
  asyncHandler(async (req, res) => {
    const authority = resolveAuthority(req);
    if (!authority) throw new AppError(403, 'User is not assigned to any authority.');
    const request = get('SELECT * FROM clarification_requests WHERE id = ?', [Number(req.params.id)]);
    if (!request) throw new AppError(404, 'Request not found.');
    if (request.authority_code !== authority.code) {
      throw new AppError(403, 'Access denied. Request belongs to another authority.');
    }
    const analysis = get('SELECT * FROM analyses WHERE id = ?', [request.analysis_id]);
    const locality = get('SELECT * FROM localities WHERE id = ?', [req.user ? (analysis?.locality_id) : null]);
    const responses = query('SELECT * FROM authority_responses WHERE request_id = ? ORDER BY received_at DESC', [request.id]);
    res.json({
      request: requestView(request),
      analysis: analysis,
      locality,
      responses: responses.map((r) => ({ ...r, ai_interpretation: jsonOrNull(r.ai_interpretation) })),
    });
  }),
);

router.post(
  '/requests/:id/acknowledge',
  asyncHandler(async (req, res) => {
    const authority = resolveAuthority(req);
    if (!authority) throw new AppError(403, 'User is not assigned to any authority.');
    const request = get('SELECT * FROM clarification_requests WHERE id = ?', [Number(req.params.id)]);
    if (!request) throw new AppError(404, 'Request not found.');
    if (request.authority_code !== authority.code) {
      throw new AppError(403, 'Access denied. Request belongs to another authority.');
    }
    if (request.status !== 'sent') throw new AppError(409, 'Only outgoing requests can be acknowledged.');
    run("UPDATE clarification_requests SET status='acknowledged' WHERE id=$id", { $id: request.id });
    audit({ userId: req.user.uid, role: req.user.role, action: 'authority.acknowledge', entityType: 'clarification_request', entityId: request.id, ip: req.ip });
    res.json({ request: requestView(get('SELECT * FROM clarification_requests WHERE id = ?', [request.id])) });
  }),
);

/**
 * Authority responds. The AI reads the response, the recommendation is
 * reconsidered/refined, and the analysis advances - planner retains final say.
 */
router.post(
  '/requests/:id/respond',
  asyncHandler(async (req, res) => {
    const authority = resolveAuthority(req);
    if (!authority) throw new AppError(403, 'User is not assigned to any authority.');
    const request = get('SELECT * FROM clarification_requests WHERE id = ?', [Number(req.params.id)]);
    if (!request) throw new AppError(404, 'Request not found.');
    if (request.authority_code !== authority.code) {
      throw new AppError(403, 'Access denied. Request belongs to another authority.');
    }
    const responseText = String(req.body?.response || '').trim();
    if (!responseText) throw new AppError(400, 'response text is required.');
    if (request.status === 'responded') throw new AppError(409, 'This request already has a response.');

    const ai = getAI();
    if (!ai.isConfigured) throw new AppError(503, 'AI service is not configured; response cannot be interpreted.');

    const analysis = get('SELECT * FROM analyses WHERE id = ?', [request.analysis_id]);
    if (!analysis) throw new AppError(404, 'Associated analysis not found.');
    const locality = get('SELECT * FROM localities WHERE id = ?', [analysis.locality_id]);

    const interpretation = await ingestAuthorityResponse({
      ai,
      analysisId: request.analysis_id,
      request,
      responseText,
      context: jsonOrNull(request.context) || {},
    });
    run("UPDATE clarification_requests SET status='responded' WHERE id=$id", { $id: request.id });

    const recommendation = get('SELECT * FROM recommendations WHERE analysis_id = ?', [request.analysis_id]);
    let revised = null;
    if (recommendation) {
      const fusion = get('SELECT * FROM fusion_results WHERE analysis_id = ?', [request.analysis_id]);
      revised = await refineAfterAuthorityResponse({
        ai,
        analysisId: recommendation.analysis_id,
        recommendationId: recommendation.id,
        authorityResponse: responseText,
        authorityInterpretation: interpretation,
        fusionResult: fusion ? jsonOrNull(fusion.result) : { summary: '' },
        locality,
        problem: { title: analysis.problem_title, description: analysis.problem_description },
      });
    }
    run("UPDATE analyses SET status='refined', updated_at=datetime('now') WHERE id=$id", { $id: request.analysis_id });

    audit({
      userId: req.user.uid,
      role: req.user.role,
      action: 'authority.respond',
      entityType: 'clarification_request',
      entityId: request.id,
      details: { analysis: request.analysis_id, refined: Boolean(revised) },
      ip: req.ip,
    });

    res.json({
      request: requestView(get('SELECT * FROM clarification_requests WHERE id = ?', [request.id])),
      interpretation,
      refined_options: revised,
    });
  }),
);

export default router;