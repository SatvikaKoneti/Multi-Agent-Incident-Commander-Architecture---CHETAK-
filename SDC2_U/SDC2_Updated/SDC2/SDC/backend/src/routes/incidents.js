import express from 'express';
import { calculateAlertEntropy } from '../engine/entropy.js';
import { runAdversarialSwarmDebate } from '../engine/swarm.js';
import { parseVisualTelemetry } from '../engine/vision.js';
import { validateCommandSafety, sanitizeAndInspectTelemetry } from '../engine/guardrails.js';
import { findHistoricalMatches } from '../engine/dejavu.js';
import { generatePostMortem } from '../engine/postmortem.js';
import { SIMULATION_SCENARIOS } from '../engine/scenarios.js';
import { query, run, get } from '../db/index.js';

const router = express.Router();

// 1. Get Simulation Scenarios
router.get('/scenarios', (req, res) => {
  res.json({ ok: true, scenarios: SIMULATION_SCENARIOS });
});

// 2. List All Incidents
router.get('/', (req, res) => {
  try {
    const incidents = query('SELECT * FROM incidents ORDER BY id DESC LIMIT 20');
    res.json({ ok: true, incidents });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

<<<<<<< HEAD
// Interactive SRE Command Sandbox
router.post('/eval-command', (req, res) => {
  try {
    const { command } = req.body;
    const safety = validateCommandSafety(command);
    res.json({
      ok: true,
      command: command || '',
      safetyTier: safety.safetyTier,
      allowed: safety.allowed,
      requiresApproval: !!safety.requiresHumanApproval,
      reason: safety.reason,
      dryRunPrediction: safety.dryRunPrediction
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Custom Log Ingestion Playground
router.post('/custom-ingest', async (req, res) => {
  try {
    const { title, service, rawLogs, severity = 'P1', financialImpactPerMin = 24000 } = req.body;
    const sanitizedTitle = title || 'Custom Log Outage Anomaly';
    const sanitizedService = service || 'custom-service';
    const trackingId = `INC-${Date.now().toString().slice(-6)}`;
    const slaDeadline = new Date(Date.now() + 30 * 60000).toISOString();

    const logLines = (rawLogs || '').split('\n').map(l => l.trim()).filter(Boolean);
    const alertCount = Math.max(logLines.length * 15, 150);

    const entropyResult = calculateAlertEntropy(
      Array.from({ length: alertCount }, (_, i) => ({
        service: sanitizedService,
        errorType: logLines[i % Math.max(logLines.length, 1)] || 'Exception in service thread pool',
        title: sanitizedTitle
      }))
    );

    const telemetryData = (logLines.length > 0 ? logLines.slice(0, 10) : ['[ERROR] Stack trace anomaly detected']).map((line, idx) => ({
      streamType: 'APPLICATION_LOGS',
      source: `${sanitizedService}-pod-${idx + 1}`,
      payload: line,
      timestamp: new Date(Date.now() - (10 - idx) * 15000).toISOString()
    }));

    const swarmResult = runAdversarialSwarmDebate({
      title: sanitizedTitle,
      service: sanitizedService,
      summary: `Custom log ingestion detected anomalous failure signals on ${sanitizedService}`,
      telemetry: telemetryData
    });

    run(
      `INSERT INTO incidents (
        tracking_id, title, summary, severity, status, service, patient_zero_service,
        blast_radius_index, financial_impact_per_min, currency, sla_window_minutes,
        sla_deadline_at, raw_alert_count, correlated_signal_count, noise_reduction_pct, confidence_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trackingId,
        sanitizedTitle,
        `Ingested custom stack trace on ${sanitizedService}. Root cause: ${swarmResult.patientZero}`,
        severity,
        'INVESTIGATING',
        sanitizedService,
        swarmResult.patientZero,
        swarmResult.blastRadiusIndex,
        Number(financialImpactPerMin) || 24000,
        'INR',
        30,
        slaDeadline,
        alertCount,
        Math.max(1, Math.round(alertCount * 0.01)),
        98.8,
        swarmResult.confidenceScore
      ]
    );

    const inserted = get('SELECT * FROM incidents WHERE tracking_id = ?', [trackingId]);

    for (const t of telemetryData) {
      run(
        'INSERT INTO incident_telemetry (incident_id, stream_type, source, payload, timestamp) VALUES (?, ?, ?, ?, ?)',
        [inserted.id, t.streamType, t.source, t.payload, t.timestamp]
      );
    }

    for (const d of swarmResult.debates) {
      run(
        'INSERT INTO incident_debates (incident_id, round_number, agent_role, agent_name, statement, confidence) VALUES (?, ?, ?, ?, ?, ?)',
        [inserted.id, d.round, d.agentRole, d.agentName, d.statement, d.confidence]
      );
    }

    for (const g of swarmResult.guardrailProposals) {
      run(
        'INSERT INTO incident_guardrail_actions (incident_id, command, action_name, safety_tier, dry_run_prediction, risk_assessment, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [inserted.id, g.command, g.actionName, g.safetyTier, g.dryRunPrediction, g.reason, 'PENDING']
      );
    }

    res.json({
      ok: true,
      incident: inserted,
      entropy: entropyResult,
      swarm: swarmResult,
      historicalMatch: swarmResult.historicalMatch,
      debates: swarmResult.debates,
      guardrailProposals: swarmResult.guardrailProposals
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


=======
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
// 3. Launch or Reset an Incident Simulation
router.post('/simulate', async (req, res) => {
  try {
    const { scenarioId } = req.body;
    const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId) || SIMULATION_SCENARIOS[0];

    const trackingId = `INC-${Date.now().toString().slice(-6)}`;
    const slaDeadline = new Date(Date.now() + (scenario.slaWindowMinutes || 30) * 60000).toISOString();

    // 1. Run Entropy & Swarm
    const entropyResult = calculateAlertEntropy(
      Array.from({ length: scenario.rawAlertCount || 482 }, (_, i) => ({
        service: scenario.service,
        errorType: i % 3 === 0 ? '504 Gateway Timeout' : i % 3 === 1 ? 'Connection Pool Exhausted' : 'Unindexed Query Lag',
        title: scenario.title
      }))
    );

    const swarmResult = runAdversarialSwarmDebate({
      title: scenario.title,
      service: scenario.service,
      summary: scenario.summary,
      telemetry: scenario.telemetry
    });

    // 2. Insert into DB
    run(
      `INSERT INTO incidents (
        tracking_id, title, summary, severity, status, service, patient_zero_service,
        blast_radius_index, financial_impact_per_min, currency, sla_window_minutes,
        sla_deadline_at, raw_alert_count, correlated_signal_count, noise_reduction_pct, confidence_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trackingId,
        scenario.title,
        scenario.summary,
        scenario.severity,
        'INVESTIGATING',
        scenario.service,
        swarmResult.patientZero,
        swarmResult.blastRadiusIndex,
        scenario.financialImpactPerMin,
        scenario.currency,
        scenario.slaWindowMinutes,
        slaDeadline,
        scenario.rawAlertCount,
        scenario.correlatedSignals,
        scenario.noiseReductionPct,
        swarmResult.confidenceScore
      ]
    );

    const inserted = get('SELECT * FROM incidents WHERE tracking_id = ?', [trackingId]);

    // Save telemetry lines
    for (const t of scenario.telemetry) {
      run(
        'INSERT INTO incident_telemetry (incident_id, stream_type, source, payload, timestamp) VALUES (?, ?, ?, ?, ?)',
        [inserted.id, t.streamType, t.source, t.payload, t.timestamp]
      );
    }

    // Save debates
    for (const d of swarmResult.debates) {
      run(
        'INSERT INTO incident_debates (incident_id, round_number, agent_role, agent_name, statement, confidence) VALUES (?, ?, ?, ?, ?, ?)',
        [inserted.id, d.round, d.agentRole, d.agentName, d.statement, d.confidence]
      );
    }

    // Save guardrail actions
    for (const g of swarmResult.guardrailProposals) {
      run(
        'INSERT INTO incident_guardrail_actions (incident_id, command, action_name, safety_tier, dry_run_prediction, risk_assessment, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [inserted.id, g.command, g.actionName, g.safetyTier, g.dryRunPrediction, g.reason, 'PENDING']
      );
    }

    res.json({
      ok: true,
      incident: inserted,
      entropy: entropyResult,
      swarm: swarmResult,
      historicalMatch: swarmResult.historicalMatch,
      debates: swarmResult.debates,
      guardrailProposals: swarmResult.guardrailProposals
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 4. Get Full Incident Details
router.get('/:id', (req, res) => {
  try {
    const incidentId = req.params.id;
    const incident = get('SELECT * FROM incidents WHERE id = ? OR tracking_id = ?', [incidentId, incidentId]);
    if (!incident) {
      return res.status(404).json({ ok: false, error: 'Incident not found' });
    }

    const telemetry = query('SELECT * FROM incident_telemetry WHERE incident_id = ? ORDER BY id ASC', [incident.id]);
    const debates = query('SELECT * FROM incident_debates WHERE incident_id = ? ORDER BY round_number ASC', [incident.id]);
    const guardrailActions = query('SELECT * FROM incident_guardrail_actions WHERE incident_id = ? ORDER BY id ASC', [incident.id]);
    const postMortem = get('SELECT * FROM incident_post_mortems WHERE incident_id = ?', [incident.id]);
    const historicalMatches = findHistoricalMatches(incident.title + ' ' + incident.summary, incident.service);

    res.json({
      ok: true,
      incident,
      telemetry,
      debates,
      guardrailActions,
      postMortem,
      historicalMatch: historicalMatches[0] || null
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 5. Vision AI Ingestion Endpoint
router.post('/vision-parse', (req, res) => {
  try {
    const { imageMetadata, imageBase64 } = req.body;
    const visionResult = parseVisualTelemetry(imageMetadata || {}, imageBase64);
    res.json({ ok: true, vision: visionResult });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 6. Execute / Approve Guardrail Proposal
<<<<<<< HEAD
router.post(['/:id/guardrail-action', '/:id/guardrails/execute'], (req, res) => {
=======
router.post('/:id/guardrail-action', (req, res) => {
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
  try {
    const incidentId = req.params.id;
    const { actionId, command, approveOverride } = req.body;

    const safety = validateCommandSafety(command);

    if (safety.safetyTier === 'RED' && !approveOverride) {
      return res.status(403).json({
        ok: false,
        blocked: true,
        safetyTier: 'RED',
        error: safety.reason,
        prediction: safety.dryRunPrediction
      });
    }

    if (actionId) {
      run(
        'UPDATE incident_guardrail_actions SET status = ?, executed_by = ?, executed_at = datetime(\'now\') WHERE id = ?',
        ['EXECUTED', 'Lead SRE (Signed-off)', actionId]
      );
    }

    res.json({
      ok: true,
      status: 'EXECUTED',
      safetyTier: safety.safetyTier,
      output: `[SIMULATED EXECUTION SUCCESS]: Command '${command}' dispatched safely with zero collateral damage.`
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 7. Resolve Incident & Auto-Generate Blameless Post-Mortem (PIR)
router.post('/:id/resolve', (req, res) => {
  try {
    const incidentId = req.params.id;
    const incident = get('SELECT * FROM incidents WHERE id = ? OR tracking_id = ?', [incidentId, incidentId]);
    if (!incident) {
      return res.status(404).json({ ok: false, error: 'Incident not found' });
    }

    const mttr = Math.round((Math.random() * 10 + 12) * 10) / 10;
    run(
      'UPDATE incidents SET status = ?, resolved_at = datetime(\'now\'), mttr_minutes = ? WHERE id = ?',
      ['RESOLVED', mttr, incident.id]
    );

    const updatedIncident = get('SELECT * FROM incidents WHERE id = ?', [incident.id]);
    const postMortemData = generatePostMortem(updatedIncident, {
      primaryRootCause: incident.summary || 'Unindexed SQL table scan starved connection pool.'
    });

    run(
      `INSERT OR REPLACE INTO incident_post_mortems (
        incident_id, executive_summary, five_whys, root_cause, recovery_timeline,
        financial_loss_total, git_hotfix_diff, regression_test_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        incident.id,
        postMortemData.markdownReport,
        '5-Whys detailed in full report.',
        incident.summary || 'Database connection pool starvation.',
        '10:14 Ingestion -> 10:15 Swarm Debate -> 10:16 Safe Rollback -> 10:18 Resolved',
        postMortemData.financialLossTotal,
        postMortemData.gitHotfixDiff,
        postMortemData.regressionTestCode
      ]
    );

    res.json({
      ok: true,
      incident: updatedIncident,
      postMortem: postMortemData
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

<<<<<<< HEAD
=======
// 8. Interactive Guardrail Command Sandbox Evaluator (Try-to-Break-It Sandbox)
router.post('/eval-command', (req, res) => {
  try {
    const { command } = req.body;
    const safety = validateCommandSafety(command || '');
    res.json({
      ok: true,
      command,
      safetyTier: safety.safetyTier,
      allowed: safety.allowed,
      requiresApproval: safety.requiresHumanApproval || false,
      reason: safety.reason,
      dryRunPrediction: safety.dryRunPrediction,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 9. Custom Incident Playground Ingestion
router.post('/custom-ingest', (req, res) => {
  try {
    const { title, service, rawLogs, severity, financialImpactPerMin } = req.body;
    const incidentTitle = title || 'Custom Incident Telemetry Stream';
    const incidentService = service || 'custom-microservice';
    const trackingId = `INC-${Date.now().toString().slice(-6)}`;

    const sanitized = sanitizeAndInspectTelemetry(rawLogs || '');

    const entropyResult = calculateAlertEntropy(
      Array.from({ length: 150 }, (_, i) => ({
        service: incidentService,
        errorType: i % 2 === 0 ? 'Custom Unhandled Exception' : 'Downstream Dependency Spike',
        title: incidentTitle
      }))
    );

    const swarmResult = runAdversarialSwarmDebate({
      title: incidentTitle,
      service: incidentService,
      summary: sanitized.sanitized.slice(0, 150) || 'Custom log stream anomaly detected',
      telemetry: [
        { streamType: 'LOG', source: 'custom-logger', payload: sanitized.sanitized.slice(0, 300), timestamp: new Date().toLocaleTimeString() }
      ]
    });

    res.json({
      ok: true,
      custom: true,
      incident: {
        id: Date.now(),
        tracking_id: trackingId,
        title: incidentTitle,
        service: incidentService,
        severity: severity || 'P1',
        status: 'INVESTIGATING',
        patient_zero_service: `${incidentService} (Detected Origin)`,
        blast_radius_index: 72,
        financial_impact_per_min: financialImpactPerMin || 24000,
        currency: 'INR',
        raw_alert_count: 150,
        correlated_signal_count: 2,
        noise_reduction_pct: 98.7,
        confidence_score: 0.95
      },
      entropy: entropyResult,
      swarm: swarmResult,
      debates: swarmResult.debates,
      guardrailProposals: swarmResult.guardrailProposals,
      historicalMatch: swarmResult.historicalMatch
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
export default router;
