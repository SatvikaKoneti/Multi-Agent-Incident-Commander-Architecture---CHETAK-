import { Router } from 'express';
import { asyncHandler, AppError, nowIso, jsonOrNull } from '../utils/index.js';
import { requireAuth, requireRole } from '../middleware/jwtAuthenticationMiddleware.js';
import { get, run, query } from '../db/index.js';
import { getAI } from '../di.js';
import { providerRegistry, providerStatus } from '../providers/index.js';
import { aggregateProblems, topProblemsAllLocalities, getCityWideIntelligence, acknowledgeProblemCluster, updateClusterStatus } from '../engine/RootCauseProblemDetector.js';
import { orchestrateAnalysis } from '../engine/MultiAgentWorkflowOrchestrator.js';
import { ingestAuthorityResponse } from '../agents/index.js';
import { refineAfterAuthorityResponse, getRecommendationOptions } from '../engine/RemediationRecommendationEngine.js';
import { classifyComplaint, saveClassification } from '../agents/IncidentComplaintClassifierAgent.js';
import { kpiCatalog, recordKpi, listKpisForRecommendation, writeKpisWithMemory } from '../engine/KpiMetricsCalculator.js';
import { audit } from '../services/incidentAuditLoggerService.js';
import { readJson } from '../providers/telemetryDataLoaderProvider.js';
import { sendAuthorityCommunication } from '../communications/index.js';
import { getStore } from '../rag/ragSemanticRetriever.js';

const router = Router();
router.use(requireAuth, requireRole('planner'));

// ---------- City-Wide Urban Problem Intelligence ----------
router.get(
  '/city-intelligence',
  asyncHandler(async (req, res) => {
    const { filterArea, filterCategory, filterPriority, filterStatus, search, assignedOnly } = req.query || {};
    const intel = getCityWideIntelligence({
      filterArea: filterArea || '',
      filterCategory: filterCategory || '',
      filterPriority: filterPriority || '',
      filterStatus: filterStatus || '',
      search: search || '',
      assignedPlannerId: assignedOnly === 'true' ? String(req.user.uid) : '',
    });
    res.json(intel);
  }),
);

router.post(
  '/clusters/:clusterId/acknowledge',
  asyncHandler(async (req, res) => {
    const { clusterId } = req.params;
    const cluster = acknowledgeProblemCluster(clusterId, req.user.uid);
    audit({
      userId: req.user.uid,
      role: req.user.role,
      action: 'cluster.acknowledge',
      entityType: 'problem_cluster',
      entityId: clusterId,
      ip: req.ip,
    });
    res.json({ cluster, status: 'acknowledged' });
  }),
);

router.patch(
  '/clusters/:clusterId/status',
  asyncHandler(async (req, res) => {
    const { clusterId } = req.params;
    const { status } = req.body || {};
    if (!status) throw new AppError(400, 'status is required.');
    const cluster = updateClusterStatus(clusterId, status, req.user.uid);
    audit({
      userId: req.user.uid,
      role: req.user.role,
      action: 'cluster.update_status',
      entityType: 'problem_cluster',
      entityId: clusterId,
      details: { status },
      ip: req.ip,
    });
    res.json({ cluster, status });
  }),
);

// ---------- Dashboard ----------
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const localities = query('SELECT * FROM localities ORDER BY name');
    const top3 = topProblemsAllLocalities({ limit: 3 });
    const activeProblems = query("SELECT COUNT(*) AS n FROM citizen_complaints WHERE status IN ('open','in_review')")[0].n;
    const highPriority = query("SELECT COUNT(*) AS n FROM citizen_complaints WHERE priority_score >= 65 AND status IN ('open','in_review')")[0].n;
    const pendingAuthority = query("SELECT COUNT(*) AS n FROM clarification_requests WHERE status IN ('draft','sent')")[0].n;
    const activeImplementation = query("SELECT COUNT(*) AS n FROM implementation_tracking WHERE status IN ('planned','in_progress')")[0].n;
    const recentComplaints = query("SELECT * FROM citizen_complaints ORDER BY created_at DESC LIMIT 8").map(complaintView);
    const agentRunCount = query('SELECT COUNT(*) AS n FROM agent_runs WHERE status = ?', ['complete'])[0].n;
    const analyses = query('SELECT * FROM analyses ORDER BY created_at DESC LIMIT 12').map(analysisView);

    const overviews = localities.slice(0, 8).map((l) => overviewFor(l));
    const overview = aggregateOverview(overviews);

    res.json({
      localities,
      top_problems: top3,
      stats: {
        active_problems: activeProblems,
        high_priority: highPriority,
        pending_authority_requests: pendingAuthority,
        active_implementations: activeImplementation,
        ai_agent_runs_completed: agentRunCount,
      },
      overview,
      recent_complaints: recentComplaints,
      analyses,
      providers: providerStatus(),
      ai_configured: getAI().isConfigured,
      ai_model: getAI().model,
    });
  }),
);

function overviewFor(locality) {
  const osm = providerRegistry.osm.getNetworkSummary(locality.name) || {};
  const obs = providerRegistry.urbanObservatory.getLocalityInfo(locality.name) || {};
  const air = providerRegistry.airQuality.getReading(locality.name);
  const feeders = providerRegistry.energy.getData(locality.name) || [];
  const complaints = query("SELECT COUNT(*) AS n FROM citizen_complaints WHERE locality_id = ? AND status IN ('open','in_review')", [locality.id])[0].n;
  let energy = null;
  if (feeders.length) {
    const worst = feeders.reduce((a, b) => (a.utilization_pct >= b.utilization_pct ? a : b));
    energy = {
      peak_demand_mw: worst.peak_demand_mw,
      installed_capacity_mw: worst.installed_capacity_mw,
      utilization_pct: worst.utilization_pct,
      interruption_hours_30d: worst.interruption_hours_30d,
      feeder_name: worst.feeder_name,
      is_demo: worst.isDemo,
    };
  }
  return {
    locality_id: locality.id,
    locality_name: locality.name,
    population: obs.population || null,
    traffic: osm.congestion_level ? {
      congestion_level: osm.congestion_level,
      avg_speed_kmh: osm.avg_speed_kmh,
      peak_volume_vph: osm.peak_volume_vph,
      bottleneck_intersections: osm.bottleneck_intersections?.length || 0,
      is_demo: true,
    } : null,
    air: air ? { aqi: air.aqi, category: air.category, pm25: air.pm25, is_demo: air.isDemo } : null,
    energy,
    complaints,
  };
}

function aggregateOverview(overviews) {
  const nonEmpty = overviews.filter((o) => o);
  const avg = (k) => {
    const vals = nonEmpty.map((o) => o[k]).filter((v) => typeof v === 'number');
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };
  return {
    localities: nonEmpty.length,
    avg_speed_kmh: avg('avg_speed_kmh'),
    avg_aqi: avg('aqi'),
    avg_feeder_utilization: avg('utilization_pct'),
  };
}

// ---------- Localities ----------
router.get(
  '/localities',
  asyncHandler(async (req, res) => {
    const localities = query('SELECT * FROM localities ORDER BY name');
    res.json({ localities });
  }),
);

router.get(
  '/localities/:localityId/dashboard',
  asyncHandler(async (req, res) => {
    const locality = get('SELECT * FROM localities WHERE id = $id OR name = $id', { $id: req.params.localityId });
    if (!locality) throw new AppError(404, 'Locality not found.');
    const problems = aggregateProblems({ localityId: locality.id, limit: 3 });
    const complaints = query('SELECT * FROM citizen_complaints WHERE locality_id = ? ORDER BY created_at DESC', [locality.id]).map(complaintView);
    const ofv = overviewFor(locality);
    const unclassified = query('SELECT COUNT(*) AS n FROM citizen_complaints WHERE locality_id = ? AND ai_classification IS NULL', [locality.id])[0].n;
    res.json({
      locality,
      top_problems: problems,
      complaints,
      domain: {
        traffic: ofv.traffic,
        air: ofv.air,
        energy: ofv.energy,
      },
      unclassified_count: unclassified,
      infrastructure: providerRegistry.urbanObservatory.getInfrastructure(locality.name),
      amenities: providerRegistry.urbanObservatory.getAmenities(locality.name),
      ai_configured: getAI().isConfigured,
    });
  }),
);

router.get(
  '/localities/:localityId/problems',
  asyncHandler(async (req, res) => {
    const locality = get('SELECT * FROM localities WHERE id = $id OR name = $id', { $id: req.params.localityId });
    if (!locality) throw new AppError(404, 'Locality not found.');
    const problems = aggregateProblems({ localityId: locality.id, limit: 10 });
    res.json({ problems });
  }),
);

router.get(
  '/localities/:localityId/complaints',
  asyncHandler(async (req, res) => {
    const locality = get('SELECT * FROM localities WHERE id = $id OR name = $id', { $id: req.params.localityId });
    if (!locality) throw new AppError(404, 'Locality not found.');
    const complaints = query('SELECT * FROM citizen_complaints WHERE locality_id = ? ORDER BY created_at DESC', [locality.id]).map(complaintView);
    res.json({ complaints });
  }),
);

router.post(
  '/localities/:localityId/classify',
  asyncHandler(async (req, res) => {
    const ai = getAI();
    if (!ai.isConfigured) throw new AppError(503, 'AI service is not configured. Set GROK_API_KEY (or OPENROUTER_API_KEY) to enable classification.');
    const locality = get('SELECT * FROM localities WHERE id = $id OR name = $id', { $id: req.params.localityId });
    if (!locality) throw new AppError(404, 'Locality not found.');
    const pending = query('SELECT * FROM citizen_complaints WHERE locality_id = ? AND ai_classification IS NULL', [locality.id]);
    const localities = query('SELECT id, name FROM localities');
    const done = [];
    const failed = [];
    for (const complaint of pending) {
      try {
        const classification = await classifyComplaint({ ai, complaint, localities });
        const updated = await saveClassification({ complaintId: complaint.id, classification });
        done.push(complaintView(updated));
      } catch (err) {
        failed.push({ id: complaint.id, error: err.message || String(err) });
      }
    }
    audit({ userId: req.user.uid, role: req.user.role, action: 'classify.bulk', entityType: 'locality', entityId: locality.id, details: { done: done.length, failed: failed.length }, ip: req.ip });
    res.json({ classified: done.length, failed: failed.length, complaints: done, errors: failed });
  }),
);

// ---------- AI Analysis ----------
router.post(
  '/analyses',
  asyncHandler(async (req, res) => {
    const ai = getAI();
    if (!ai.isConfigured) throw new AppError(503, 'AI service is not configured. Set GROK_API_KEY (or OPENROUTER_API_KEY) to run the AI analysis pipeline.');
    const { localityId, title, description, category, sourceComplaintIds } = req.body || {};
    if (!localityId || !title) throw new AppError(400, 'localityId and title are required.');
    const result = await orchestrateAnalysis({
      ai,
      plannerId: req.user.uid,
      localityId,
      problemTitle: title,
      problemDescription: description,
      category,
      sourceComplaintIds,
    });
    audit({ userId: req.user.uid, role: req.user.role, action: 'analysis.run', entityType: 'analysis', entityId: result.analysis_id, details: { status: result.status }, ip: req.ip });
    res.status(201).json(result);
  }),
);

router.get(
  '/analyses',
  asyncHandler(async (req, res) => {
    const rows = query('SELECT * FROM analyses ORDER BY created_at DESC LIMIT 50');
    res.json({ analyses: rows.map(analysisView) });
  }),
);

router.get(
  '/analyses/:id',
  asyncHandler(async (req, res) => {
    const analysisId = Number(req.params.id);
    const analysis = get('SELECT * FROM analyses WHERE id = ?', [analysisId]);
    if (!analysis) throw new AppError(404, 'Analysis not found.');

    const locality = get('SELECT * FROM localities WHERE id = ?', [analysis.locality_id]) || null;
    const runs = query('SELECT * FROM agent_runs WHERE analysis_id = ? ORDER BY id', [analysisId]);
    const resultsByRun = {};
    for (const r of runs) {
      const results = query('SELECT * FROM agent_results WHERE run_id = ?', [r.id]);
      resultsByRun[r.id] = results;
    }
    const fusion = get('SELECT * FROM fusion_results WHERE analysis_id = ?', [analysisId]);
    const recommendation = get('SELECT * FROM recommendations WHERE analysis_id = ?', [analysisId]);
    let options = [];
    let recommendationPack = null;
    if (recommendation) {
      options = query('SELECT * FROM recommendation_options WHERE recommendation_id = ? ORDER BY blocked, rank, id', [recommendation.id]);
      recommendationPack = {
        id: recommendation.id,
        status: recommendation.status,
        planner_notes: recommendation.planner_notes,
        final_option_id: recommendation.final_option_id,
        missing_information: jsonOrNull(recommendation.missing_information) || [],
        assumptions: jsonOrNull(recommendation.assumptions) || [],
        uncertainty: recommendation.uncertainty || '',
        verification_needed: jsonOrNull(recommendation.verification_needed) || [],
        refinement_log: jsonOrNull(recommendation.refinement_log) || [],
        xai_explanation: recommendation.xai_explanation || null,
        options: options.map(optionView),
      };
    }
    const clarifications = query('SELECT * FROM clarification_requests WHERE analysis_id = ? ORDER BY created_at DESC', [analysisId]).map((c) => {
      const responses = query('SELECT * FROM authority_responses WHERE request_id = ? ORDER BY received_at DESC', [c.id]);
      return { ...c, context: jsonOrNull(c.context), responses: responses.map((r) => ({ ...r, raw: jsonOrNull(r.raw), ai_interpretation: jsonOrNull(r.ai_interpretation) })) };
    });
    const evidence = [];
    const memories = query('SELECT * FROM agent_memory WHERE problem_key = ?', [`PRB-${analysisId}`]);

    res.json({
      analysis: analysisView(analysis),
      locality,
      runs: runs.map((r) => ({ ...r, results: resultsByRun[r.id] || [] })),
      fusion_result: fusion ? jsonOrNull(fusion.result) : null,
      recommendations: recommendationPack,
      clarifications,
      memories,
    });
  }),
);

// ---------- Authority clarification workflow ----------
router.post(
  '/clarifications/:requestId/approve-send',
  asyncHandler(async (req, res) => {
    const request = get('SELECT * FROM clarification_requests WHERE id = ?', [Number(req.params.requestId)]);
    if (!request) throw new AppError(404, 'Clarification request not found.');
    if (request.status === 'sent') {
      return res.json({ request: requestView(request), status: 'already_sent', message: 'This clarification was already sent.' });
    }
    if (request.status !== 'draft') throw new AppError(409, `Cannot approve a request in status "${request.status}".`);

    // Resolve the contact + channel from the authority contact dataset (never
    // hard-coded), then hand delivery to the configured communication provider.
    const contact = providerRegistry.authorityContact?.byAuthorityId(request.authority_id || request.authority_code) || null;
    const channel = request.channel || contact?.preferred_channel || 'email';
    const delivery = await sendAuthorityCommunication({ request, contact, channel });

    run(
      "UPDATE clarification_requests SET status='sent', sent_by=$user, sent_at=$at, channel=$channel, provider=$provider, delivery=$delivery, planner_notes=COALESCE($notes, planner_notes) WHERE id=$id",
      {
        $user: req.user.uid,
        $at: nowIso(),
        $channel: channel,
        $provider: delivery.provider || 'none',
        $delivery: JSON.stringify(delivery),
        $notes: req.body?.planner_notes || null,
        $id: request.id,
      },
    );
    run("UPDATE analyses SET status='awaiting_authority' WHERE id=$id", { $id: request.analysis_id });
    audit({
      userId: req.user.uid,
      role: req.user.role,
      action: 'clarification.approve_send',
      entityType: 'clarification_request',
      entityId: request.id,
      details: { authority: request.authority_code, analysis_id: request.analysis_id, provider: delivery.provider, demo: Boolean(delivery.demo) },
      ip: req.ip,
    });
    const updated = get('SELECT * FROM clarification_requests WHERE id = ?', [request.id]);
    res.json({ request: requestView(updated), status: 'sent', delivery });
  }),
);

router.post(
  '/clarifications/:requestId/edit',
  asyncHandler(async (req, res) => {
    const request = get('SELECT * FROM clarification_requests WHERE id = ?', [Number(req.params.requestId)]);
    if (!request) throw new AppError(404, 'Clarification request not found.');
    if (request.status !== 'draft') throw new AppError(409, 'Only draft messages can be edited.');
    const message = req.body?.message;
    if (!message || !message.trim()) throw new AppError(400, 'message is required.');
    run('UPDATE clarification_requests SET message=$message WHERE id=$id', { $message: message.trim(), $id: request.id });
    res.json({ request: requestView(get('SELECT * FROM clarification_requests WHERE id = ?', [request.id])) });
  }),
);

router.post(
  '/clarifications/:requestId/reject',
  asyncHandler(async (req, res) => {
    const request = get('SELECT * FROM clarification_requests WHERE id = ?', [Number(req.params.requestId)]);
    if (!request) throw new AppError(404, 'Clarification request not found.');
    run("UPDATE clarification_requests SET status='rejected', planner_notes=COALESCE($notes, planner_notes) WHERE id=$id", {
      $notes: req.body?.planner_notes || 'Rejected by planner.',
      $id: request.id,
    });
    run("UPDATE analyses SET status='recommended', coordinator_decision=COALESCE(coordinator_decision, '{}') WHERE id=$id", { $id: request.analysis_id });
    res.json({ request: requestView(get('SELECT * FROM clarification_requests WHERE id = ?', [request.id])) });
  }),
);

router.get(
  '/authority-requests',
  asyncHandler(async (req, res) => {
    const rows = query('SELECT * FROM clarification_requests ORDER BY created_at DESC LIMIT 50');
    res.json({ requests: rows.map(requestView) });
  }),
);

// Outbound authority communications tracker (planner's view of every message
// drafted or sent to an external authority).
router.get(
  '/communications',
  asyncHandler(async (req, res) => {
    const rows = query('SELECT * FROM clarification_requests ORDER BY created_at DESC LIMIT 100').map((r) => ({
      ...r,
      responses_count: query('SELECT COUNT(*) AS n FROM authority_responses WHERE request_id = ?', [r.id])[0].n,
    }));
    res.json({
      communications: rows.map(requestView),
      contact_provider: { name: 'demo', note: 'Demo Contact - Project Demonstration Only' },
    });
  }),
);

// DEMO response-ingestion endpoint. Authorities are external stakeholders: a
// response arrives through the configured communication provider, not through
// a product login. In local development no real provider is available, so this
// endpoint simulates an incoming response from the labelled demo contact. It is
// the documented mechanism for response ingestion in Demo Mode. The AI reads
// the response and the recommendation is refined, exactly as it would be for a
// real response.
router.post(
  '/communications/:requestId/demo-respond',
  asyncHandler(async (req, res) => {
    const request = get('SELECT * FROM clarification_requests WHERE id = ?', [Number(req.params.requestId)]);
    if (!request) throw new AppError(404, 'Communication not found.');
    const responseText = String(req.body?.response || '').trim();
    if (!responseText) throw new AppError(400, 'response text is required.');
    if (request.status === 'responded') throw new AppError(409, 'This request already has a response.');
    if (request.status !== 'sent') throw new AppError(409, `Only sent requests can receive a response (current status: "${request.status}").`);

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
    run("UPDATE clarification_requests SET status='responded', responded_at=$at WHERE id=$id", { $at: nowIso(), $id: request.id });

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
      action: 'communication.demo_respond',
      entityType: 'clarification_request',
      entityId: request.id,
      details: { analysis: request.analysis_id, demo: true, refined: Boolean(revised) },
      ip: req.ip,
    });

    res.json({
      request: requestView(get('SELECT * FROM clarification_requests WHERE id = ?', [request.id])),
      demo: true,
      demo_note: 'Response ingested from the DEMO contact. No real external response occurred.',
      interpretation,
      refined_options: revised,
    });
  }),
);

router.get(
  '/authority-requests/:id',
  asyncHandler(async (req, res) => {
    const request = get('SELECT * FROM clarification_requests WHERE id = ?', [Number(req.params.id)]);
    if (!request) throw new AppError(404, 'request not found');
    const responses = query('SELECT * FROM authority_responses WHERE request_id = ? ORDER BY received_at DESC', [request.id]);
    res.json({ request: requestView(request), context: jsonOrNull(request.context), responses });
  }),
);

// ---------- Recommendations ----------
router.post(
  '/recommendations/:optionId/approve',
  asyncHandler(async (req, res) => {
    const option = get('SELECT * FROM recommendation_options WHERE id = ?', [Number(req.params.optionId)]);
    if (!option) throw new AppError(404, 'Recommendation option not found.');
    const rec = get('SELECT * FROM recommendations WHERE id = ?', [option.recommendation_id]);
    if (!rec) throw new AppError(404, 'Recommendation not found.');
    const notes = req.body?.planner_notes || rec.planner_notes || '';
    run(
      "UPDATE recommendations SET status='approved', final_option_id=$optionId, planner_notes=$notes, updated_at=$at WHERE id=$recId",
      { $optionId: option.id, $notes: notes, $at: nowIso(), $recId: rec.id },
    );
    run("UPDATE recommendation_options SET is_recommended = CASE WHEN id=$optionId THEN 1 ELSE 0 END WHERE recommendation_id=$recId", {
      $optionId: option.id,
      $recId: rec.id,
    });
    run("UPDATE analyses SET status='approved', updated_at=$at WHERE id=$id", { $at: nowIso(), $id: rec.analysis_id });
    audit({ userId: req.user.uid, role: req.user.role, action: 'recommendation.approve', entityType: 'recommendation_option', entityId: option.id, details: { analysis: rec.analysis_id }, ip: req.ip });
    res.json({ recommendation: recView(get('SELECT * FROM recommendations WHERE id = ?', [rec.id])), approved_option_id: option.id });
  }),
);

router.post(
  '/recommendations/:id/revise',
  asyncHandler(async (req, res) => {
    const ai = getAI();
    if (!ai.isConfigured) throw new AppError(503, 'AI service is not configured.');
    const rec = get('SELECT * FROM recommendations WHERE id = ?', [Number(req.params.id)]);
    if (!rec) throw new AppError(404, 'Recommendation not found.');
    const analysis = get('SELECT * FROM analyses WHERE id = ?', [rec.analysis_id]);
    const locality = get('SELECT * FROM localities WHERE id = ?', [analysis.locality_id]);
    const fusion = get('SELECT * FROM fusion_results WHERE analysis_id = ?', [analysis.id]);
    const options = getRecommendationOptions(rec.id);
    const refined = await refineAfterAuthorityResponse({
      ai,
      analysisId: analysis.id,
      recommendationId: rec.id,
      authorityResponse: req.body?.notes || 'Planner requested a revision',
      authorityInterpretation: { interpretation_notes: req.body?.notes || 'Planner requested a revision', provides_clarification: false, new_information_summary: 'Planner revision note' },
      fusionResult: fusion ? jsonOrNull(fusion.result) : { summary: '' },
      locality,
      problem: { title: analysis.problem_title, description: analysis.problem_description },
    });
    run("UPDATE recommendations SET status='revised', planner_notes=COALESCE($notes, planner_notes), updated_at=$at WHERE id=$id", {
      $notes: req.body?.notes || null,
      $at: nowIso(),
      $id: rec.id,
    });
    audit({ userId: req.user.uid, role: req.user.role, action: 'recommendation.revise', entityType: 'recommendation', entityId: rec.id, details: { options: options.length }, ip: req.ip });
    res.json({ recommendation: recView(get('SELECT * FROM recommendations WHERE id = ?', [rec.id])), revised: refined.ranked.length });
  }),
);

// ---------- Implementation ----------
router.post(
  '/implementation',
  asyncHandler(async (req, res) => {
    const { recommendationId, recommendationOptionId, status, milestones, notes } = req.body || {};
    if (!recommendationId) throw new AppError(400, 'recommendationId required.');
    run(
      `INSERT INTO implementation_tracking (recommendation_id, recommendation_option_id, status, milestones, notes, started_at, updated_at)
       VALUES ($rec, $opt, $status, $milestones, $notes, $started, $now)`,
      {
        $rec: recommendationId,
        $opt: recommendationOptionId || null,
        $status: status || 'planned',
        $milestones: JSON.stringify(milestones || []),
        $notes: notes || '',
        $started: status === 'in_progress' ? nowIso() : null,
        $now: nowIso(),
      },
    );
    const id = get('SELECT last_insert_rowid() AS id').id;
    if (status === 'in_progress' || status === 'planned') {
      run("UPDATE analyses SET status='implementing' WHERE id=(SELECT analysis_id FROM recommendations WHERE id=$rec)", { $rec: recommendationId });
    }
    audit({ userId: req.user.uid, role: req.user.role, action: 'implementation.start', entityType: 'implementation_tracking', entityId: id, ip: req.ip });
    res.status(201).json({ implementation: get('SELECT * FROM implementation_tracking WHERE id = ?', [id]) });
  }),
);

router.patch(
  '/implementation/:id',
  asyncHandler(async (req, res) => {
    const item = get('SELECT * FROM implementation_tracking WHERE id = ?', [Number(req.params.id)]);
    if (!item) throw new AppError(404, 'Implementation record not found.');
    const { status, milestones, notes } = req.body || {};
    run(
      "UPDATE implementation_tracking SET status=$status, milestones=$milestones, notes=COALESCE($notes, notes), updated_at=$at, completed_at=CASE WHEN $status='completed' THEN $at WHEN $status<>'completed' THEN NULL ELSE completed_at END WHERE id=$id",
      {
        $status: status || item.status,
        $milestones: milestones ? JSON.stringify(milestones) : item.milestones,
        $notes: notes,
        $at: nowIso(),
        $id: item.id,
      },
    );
    if (status === 'completed') {
      run("UPDATE analyses SET status='implemented' WHERE id=(SELECT analysis_id FROM recommendations WHERE id=$rec)", { $rec: item.recommendation_id });
    }
    audit({ userId: req.user.uid, role: req.user.role, action: 'implementation.update', entityType: 'implementation_tracking', entityId: item.id, details: { status }, ip: req.ip });
    res.json({ implementation: get('SELECT * FROM implementation_tracking WHERE id = ?', [item.id]) });
  }),
);

router.get(
  '/implementation',
  asyncHandler(async (req, res) => {
    const rows = query('SELECT * FROM implementation_tracking ORDER BY updated_at DESC');
    res.json({
      implementations: rows.map((r) => ({ ...r, milestones: jsonOrNull(r.milestones) || [] })),
    });
  }),
);

// ---------- KPIs ----------
router.get(
  '/kpis/catalog',
  asyncHandler(async (req, res) => {
    res.json({ catalog: kpiCatalog() });
  }),
);

router.post(
  '/kpis',
  asyncHandler(async (req, res) => {
    const { recommendationId, kpis } = req.body || {};
    if (!recommendationId || !Array.isArray(kpis) || kpis.length === 0) {
      throw new AppError(400, 'recommendationId and a non-empty kpis array are required.');
    }
    const rec = get('SELECT * FROM recommendations WHERE id = ?', [recommendationId]);
    if (!rec) throw new AppError(404, 'Recommendation not found.');
    const ai = getAI();
    const analysis = get('SELECT * FROM analyses WHERE id = ?', [rec.analysis_id]);
    const result = await writeKpisWithMemory({
      recommendationId,
      kpis,
      ai,
      analysisId: rec.analysis_id,
      problem: { title: analysis?.problem_title, description: analysis?.problem_description, locality_id: analysis?.locality_id },
      recommendationName: get('SELECT name FROM recommendation_options WHERE id = ?', [rec.final_option_id])?.name || 'selected option',
      plannerDecision: 'approved',
    });
    audit({ userId: req.user.uid, role: req.user.role, action: 'kpi.record', entityType: 'recommendation', entityId: recommendationId, details: { count: kpis.length }, ip: req.ip });
    res.status(201).json({ kpis: result.kpis, memory: result.memory });
  }),
);

router.get(
  '/kpis/:recommendationId',
  asyncHandler(async (req, res) => {
    res.json({ kpis: listKpisForRecommendation(Number(req.params.recommendationId)) });
  }),
);

// ---------- Agent Memory ----------
router.get(
  '/memory',
  asyncHandler(async (req, res) => {
    const rows = query('SELECT * FROM agent_memory ORDER BY created_at DESC LIMIT 100');
    res.json({ memories: rows.map((r) => ({ ...r, tags: jsonOrNull(r.tags) || [] })) });
  }),
);

// ---------- Feedback ----------
router.post(
  '/feedback',
  asyncHandler(async (req, res) => {
    const { analysisId, recommendationId, rating, comments } = req.body || {};
    run(
      'INSERT INTO feedback (analysis_id, recommendation_id, user_id, role, rating, comments) VALUES ($a, $r, $u, $role, $rating, $comments)',
      {
        $a: analysisId || null,
        $r: recommendationId || null,
        $u: req.user.uid,
        $role: req.user.role,
        $rating: rating != null ? Math.min(5, Math.max(0, Number(rating))) : null,
        $comments: comments || '',
      },
    );
    res.status(201).json({ feedback: { id: get('SELECT last_insert_rowid() AS id').id } });
  }),
);

// ---------- Demo scenarios ----------
router.get(
  '/demo-scenarios',
  asyncHandler(async (req, res) => {
    res.json({ scenarios: readJson('scenarios.json') });
  }),
);

// ---------- AI activity ----------
router.get(
  '/runs/:analysisId',
  asyncHandler(async (req, res) => {
    const runs = query('SELECT * FROM agent_runs WHERE analysis_id = ? ORDER BY id', [Number(req.params.analysisId)]);
    res.json({ runs: runs.map((r) => ({ ...r, config: jsonOrNull(r.config), input_context: jsonOrNull(r.input_context) })) });
  }),
);

// ---------- Views ----------
function complaintView(c) {
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
    priority_score: c.priority_score,
    ai_classified: Boolean(c.ai_classification),
    image_path: c.image_path,
    video_path: c.video_path,
    created_at: c.created_at,
  };
}

function analysisView(a) {
  return {
    id: a.id,
    locality_id: a.locality_id,
    problem_title: a.problem_title,
    problem_description: a.problem_description,
    category: a.category,
    priority_score: a.priority_score,
    status: a.status,
    coordinator_decision: jsonOrNull(a.coordinator_decision),
    specialist_failures: jsonOrNull(a.specialist_failures) || [],
    recommendation_failure: a.recommendation_failure || null,
    created_at: a.created_at,
    updated_at: a.updated_at,
  };
}

function requestView(r) {
  return {
    id: r.id,
    analysis_id: r.analysis_id,
    authority_code: r.authority_code,
    authority_name: r.authority_name,
    authority_id: r.authority_id || null,
    request_type: r.request_type || 'CLARIFICATION_REQUEST',
    reason: r.reason,
    message: r.message,
    contact_name: r.contact_name || null,
    contact_role: r.contact_role || null,
    channel: r.channel || null,
    provider: r.provider || null,
    delivery: jsonOrNull(r.delivery),
    status: r.status,
    planner_notes: r.planner_notes,
    sent_at: r.sent_at,
    responded_at: r.responded_at || null,
    created_at: r.created_at,
    context: jsonOrNull(r.context),
    responses_count: r.responses_count != null ? r.responses_count : undefined,
  };
}

function optionView(o) {
  return {
    id: o.id,
    name: o.name,
    summary: o.summary,
    components: jsonOrNull(o.components) || [],
    est_cost_inr: o.est_cost_inr,
    cost_breakup: jsonOrNull(o.cost_breakup),
    impact_score: o.impact_score,
    feasibility_score: o.feasibility_score,
    timeline_months: o.timeline_months,
    environmental_effect: o.environmental_effect,
    energy_effect: o.energy_effect,
    population_benefit: o.population_benefit,
    risks: jsonOrNull(o.risks) || [],
    dependencies: jsonOrNull(o.dependencies) || [],
    why_generated: o.why_generated,
    constraints_applied: jsonOrNull(o.constraints_applied) || [],
    constraint_status: o.constraint_status || 'clear',
    evidence: jsonOrNull(o.evidence) || [],
    target_authority: o.target_authority,
    rank: o.rank,
    viability: o.viability,
    blocked: o.blocked,
    block_reason: o.block_reason,
    is_recommended: o.is_recommended,
    revised_from_id: o.revised_from_id,
    xai_scores: typeof o.xai_scores === 'string' ? jsonOrNull(o.xai_scores) : (o.xai_scores || null),
  };
}

function recView(r) {
  return {
    id: r.id,
    analysis_id: r.analysis_id,
    status: r.status,
    final_option_id: r.final_option_id,
    planner_notes: r.planner_notes,
    missing_information: jsonOrNull(r.missing_information) || [],
    assumptions: jsonOrNull(r.assumptions) || [],
    uncertainty: r.uncertainty || '',
    verification_needed: jsonOrNull(r.verification_needed) || [],
    refinement_log: jsonOrNull(r.refinement_log) || [],
    xai_explanation: r.xai_explanation || null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// ---------- Grok City Planner Copilot ----------

const COPILOT_PRESETS = [
  {
    id: 'begumpet_waterlogging',
    title: 'Analyze Begumpet Waterlogging & Drainage',
    prompt: 'Analyze the chronic waterlogging crisis in Begumpet near the nala and airport corridor. What are the key bottlenecks between GHMC storm-water drainage and HMWSSB trunk lines, and what immediate vs medium-term mitigation options do you recommend?',
  },
  {
    id: 'cyber_towers_traffic',
    title: 'Decongest Cyber Towers / Madhapur Junction',
    prompt: 'Review the severe traffic bottlenecks around Cyber Towers and Mindspace in Madhapur during evening peak hours. Suggest a multi-stakeholder traffic management intervention involving GHMC, Traffic Police, and L&T Metro Rail.',
  },
  {
    id: 'kondapur_energy',
    title: 'Evaluate Substation Overload in Kondapur',
    prompt: 'Kondapur commercial feeders are operating above 95% peak utilization with TSSPDCL. Evaluate the technical viability, land requirements, and cost feasibility of deploying grid-scale battery storage vs feeder segregation.',
  },
  {
    id: 'ghmc_clarification_draft',
    title: 'Draft Official Inquiry to GHMC',
    prompt: 'Draft a formal inter-agency inquiry from the City Planning Directorate to the GHMC Commissioner requesting desiltation status and drain capacity expansion data for low-lying flood hotspots.',
  },
  {
    id: 'city_wide_summary',
    title: 'City-Wide Urban Pulse & Priorities',
    prompt: 'Provide a structured executive briefing on Hyderabad\'s top active problem clusters, citizen grievance hotspots, and the most urgent infrastructure decisions required this week.',
  },
];

router.get(
  '/copilot/presets',
  asyncHandler(async (req, res) => {
    res.json({ presets: COPILOT_PRESETS });
  }),
);

router.post(
  '/copilot',
  asyncHandler(async (req, res) => {
    const ai = getAI();
    const { message, history = [], clusterId, localityId, analysisId } = req.body || {};
    if (!message || typeof message !== 'string') {
      throw new AppError(400, 'message is required.');
    }

    // 1. Gather context
    const contextLines = [];

    // Context from cluster if provided
    if (clusterId) {
      try {
        const intel = getCityWideIntelligence({});
        const cluster = (intel?.clusters || []).find((c) => c.cluster_id === clusterId || c.id === clusterId);
        if (cluster) {
          contextLines.push(
            `FOCUSED PROBLEM CLUSTER:\n- Title: ${cluster.problem_title}\n- Locality: ${cluster.locality_name}\n- Category: ${cluster.category}\n- Priority Score: ${cluster.priority_score ?? 'N/A'} (Level: ${cluster.priority_level})\n- Severity: ${cluster.severity_avg}/100, Urgency: ${cluster.urgency_avg}/100, Population Impact: ${cluster.population_impact_avg}/100\n- Total Citizen Grievances: ${cluster.complaint_count}\n- Top Indicators: ${(cluster.top_indicators || []).join(', ') || 'N/A'}\n- Sample Citizen Reports: ${(cluster.sample_complaints || []).map((c) => `"${c.title}" (${c.area || cluster.locality_name})`).join('; ')}`
          );
        }
      } catch (err) {
        // non-blocking
      }
    }

    // Context from locality if provided
    if (localityId) {
      try {
        const loc = get('SELECT * FROM localities WHERE id = $id OR name = $id', { $id: localityId });
        if (loc) {
          contextLines.push(
            `FOCUSED LOCALITY:\n- Name: ${loc.name}\n- Population: ${loc.population?.toLocaleString('en-IN')}\n- Area: ${loc.area_sqkm} sq km\n- Coordinates: Lat ${loc.lat}, Lng ${loc.lng}`
          );
        }
      } catch (err) {
        // non-blocking
      }
    }

    // Context from analysis if provided
    if (analysisId) {
      try {
        const analysis = get('SELECT * FROM analyses WHERE id = $id', { $id: Number(analysisId) });
        if (analysis) {
          const rec = get('SELECT * FROM recommendations WHERE analysis_id = $id ORDER BY id DESC LIMIT 1', { $id: Number(analysisId) });
          contextLines.push(
            `FOCUSED ANALYSIS:\n- Title: ${analysis.problem_title}\n- Category: ${analysis.category}\n- Status: ${analysis.status}\n- Recommendation Status: ${rec?.status || 'none'}`
          );
        }
      } catch (err) {
        // non-blocking
      }
    }

    // 2. Vector Store RAG Context
    try {
      const store = getStore();
      const hits = store.search(message, 3);
      if (hits && hits.length > 0) {
        const ragContext = hits
          .map((h, i) => `[Evidence ${i + 1}: ${h.fields.title}]\n${h.fields.body}`)
          .join('\n\n');
        contextLines.push(`URBAN KNOWLEDGE BASE (HYDERABAD RELEVANT EVIDENCE):\n${ragContext}`);
      }
    } catch (err) {
      // non-blocking
    }

    // 3. Authorities Directory Context
    try {
      const authorities = providerRegistry.authority.all();
      const authList = authorities.map((a) => `${a.code} (${a.name}) - Domain: ${a.domain}`).join('; ');
      contextLines.push(`STAKEHOLDER AUTHORITIES: ${authList}`);
    } catch (err) {
      // non-blocking
    }

    const systemPrompt = `You are the Urban Planning Copilot, the specialized AI assistant for Hyderabad, India.
You collaborate directly with City Planners, Commissioners, and Municipal Engineers of the Hyderabad Urban Development Authority.
Your mission is to aid the city planner in diagnosing urban infrastructure bottlenecks, evaluating citizen complaints, recommending viable interventions, evaluating multi-objective trade-offs (cost, time, environmental impact, civic disruption), and drafting official communications to statutory authorities (GHMC, HMDA, TSSPDCL, HMWSSB, HYDRAA, TSPCB).

OPERATIONAL GUIDELINES:
1. SPECIFIC TO HYDERABAD: Reference actual geographical landmarks, corridors (e.g. Outer Ring Road, PVNR Expressway, Inner Ring Road, Gachibowli junction, Begumpet bottleneck, Cyber Towers, Secunderabad station underpass, Charminar heritage precinct, Cheruvus and Musi storm drainage basins).
2. CLEAR & STRUCTURED: Use Markdown with bold section headers, concise bullet points, and clean comparison tables where appropriate.
3. PRAGMATIC & ACTIONABLE: Differentiate between immediate tactical interventions (0-30 days), medium-term engineering solutions (1-6 months), and long-term capital projects.
4. OFFICIAL PROTOCOLS: When asked to draft notifications, memos, or inquiries to partner authorities, format them as formal, ready-to-dispatch official communiques.
5. OBJECTIVE RIGOR: Distinguish confirmed facts and data from engineering inferences or estimates. Highlight any missing data that requires on-ground verification.

${contextLines.length > 0 ? '\nCURRENT URBAN PLATFORM CONTEXT:\n' + contextLines.join('\n\n') : ''}`;

    // Format conversation history compactly so it never overflows Groq's 8k TPM limit
    const compactHistory = (history || [])
      .slice(-6)
      .map((h) => {
        if (h.role === 'user') {
          return `Planner: ${h.content.slice(0, 400)}`;
        }
        // Summarize assistant turn to essential points/first 350 chars
        const preview = (h.content || '').replace(/\s+/g, ' ').slice(0, 350);
        return `Copilot: ${preview}...`;
      })
      .join('\n\n');

    const conversationUser = compactHistory
      ? [
          'PRIOR CONVERSATION CONTEXT:\n' + compactHistory,
          `CURRENT PLANNER QUERY:\n${message}`,
        ].join('\n\n')
      : message;

    let reply = '';
    const usedModel = ai.model;
    const providerName = ai.provider || 'groq';

    if (ai.isConfigured) {
      try {
        const aiRes = await ai.generateText({
          system: systemPrompt,
          user: conversationUser,
          temperature: 0.4,
          maxTokens: 1536,
          metadata: { agent: 'planner_copilot', plannerId: req.user.uid },
        });
        reply = aiRes.text;
      } catch (err) {
        reply = `⚠️ **Copilot Notice:** AI provider error: ${err.message}.\n\nPlease check your API key in \`backend/.env\` and verify provider service status.`;
      }
    } else {
      reply = `### Urban Planner Copilot (Offline Mode)\n\n` +
        `Copilot is ready to assist! To enable live high-speed AI intelligence, add your \`GROQ_API_KEY\` in \`backend/.env\`.\n\n` +
        `**Available Live Context:** Ready to analyze all 12 Hyderabad urban zones.`;
    }

    // Extract suggested quick follow-up actions based on topic
    const suggestedActions = [];
    if (/water|drain|flood|rain|begumpet/i.test(message + reply)) {
      suggestedActions.push({ label: 'Draft GHMC & HMWSSB Drainage Notice', action: 'draft_memo', target: 'GHMC' });
      suggestedActions.push({ label: 'Check Begumpet Problem Clusters', action: 'view_cluster', locality: 'Begumpet' });
    }
    if (/traffic|jam|congestion|flyover|signal|metro|junction/i.test(message + reply)) {
      suggestedActions.push({ label: 'Coordinate with Hyderabad Traffic Police', action: 'draft_memo', target: 'TRAFFIC' });
      suggestedActions.push({ label: 'View Madhapur & Gachibowli Traffic Density', action: 'view_locality', locality: 'HITEC City / Madhapur' });
    }
    if (/power|electric|feeder|substation|tsspdcl|solar|battery/i.test(message + reply)) {
      suggestedActions.push({ label: 'Request TSSPDCL Feeder Upgrade', action: 'draft_memo', target: 'TSSPDCL' });
    }
    if (suggestedActions.length === 0) {
      suggestedActions.push({ label: 'View City-Wide Problem Clusters', action: 'view_dashboard' });
      suggestedActions.push({ label: 'Explore Locality Intelligence', action: 'view_localities' });
    }

    audit({
      userId: req.user.uid,
      role: req.user.role,
      action: 'copilot.chat',
      entityType: 'planner_assistant',
      entityId: clusterId || localityId || 'general',
      details: { query: message.slice(0, 80), model: usedModel },
      ip: req.ip,
    });

    res.json({
      ok: true,
      reply,
      suggestedActions,
      model: usedModel,
      provider: providerName,
      isGrok: Boolean(ai.isGrok || (usedModel && usedModel.includes('grok'))),
    });
  }),
);

export default router;