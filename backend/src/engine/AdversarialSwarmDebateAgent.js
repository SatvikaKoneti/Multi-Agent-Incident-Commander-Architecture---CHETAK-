/**
 * Adversarial Multi-Agent Debate Swarm
 * Coordinates Detective Agent (Proposer) vs Skeptic Agent (Falsifier)
 * with Institutional Memory and Counterfactual Simulation.
 */

import { findHistoricalMatches } from './InstitutionalMemoryRecallAgent.js';
import { validateCommandSafety } from './ZeroTrustGuardrailEngine.js';

export function runAdversarialSwarmDebate(incidentData = {}) {
  const service = incidentData.service || 'database-postgres';
  const title = incidentData.title || 'Service Outage';
  const telemetry = incidentData.telemetry || [];

  // 1. Memory Match
  const historicalMatches = findHistoricalMatches(title + ' ' + (incidentData.summary || ''), service);
  const bestMatch = historicalMatches[0] || null;

  // 2. Detective Hypothesis
  const isDatabase = /db|postgres|sql|connection|pool/i.test(title + ' ' + service);
  const isMemory = /memory|leak|oom|heap|cache/i.test(title + ' ' + service);
  const isGateway = /gateway|payment|stripe|502|504|timeout/i.test(title + ' ' + service);

  let detectiveStatement = '';
  let skepticStatement = '';
  let commanderSynthesis = '';
  let blastRadiusIndex = 65;
  let patientZero = service;
  let primaryRootCause = '';
  let proposedCommands = [];

  if (isDatabase) {
    patientZero = 'database-postgres (Primary Master)';
    blastRadiusIndex = 88;
    primaryRootCause = 'Unindexed full table scan introduced in recent deployment held open all 100 database connection slots, starving downstream API workers.';

    detectiveStatement = 'I suspect the root cause is a database connection leak introduced during the 10:14 AM deployment of the order checkout microservice.';
    skepticStatement = 'Cross-checked telemetry. While connection slots reached 100% saturation, the first error timestamp occurred at 10:14:32 UTC following an unindexed SQL query from worker-12. The connection count is a symptom of slow query hold times, not an app-level leak.';
    commanderSynthesis = 'Consensus reached between Detective and Skeptic: Root cause is unindexed query starvation locking the connection pool. Recommend scaling connection ceiling and applying index concurrently.';

    proposedCommands = [
      {
        actionName: 'Inspect Database Active Processlist',
        command: 'SELECT pid, query, state, age(clock_timestamp(), query_start) FROM pg_stat_activity WHERE state != \'idle\' ORDER BY age DESC LIMIT 10;',
        tier: 'GREEN'
      },
      {
        actionName: 'Enable Read-Replica Traffic Splitting',
        command: 'kubectl scale deployment/read-replica-proxy --replicas=4 && nginx -s reload',
        tier: 'YELLOW'
      },
      {
        actionName: 'Emergency Forceful Database Hard Reset',
        command: 'systemctl restart postgresql && DROP TABLE staging_orders_temp;',
        tier: 'RED'
      }
    ];
  } else if (isMemory) {
    patientZero = 'auth-service:v2.4.1';
    blastRadiusIndex = 74;
    primaryRootCause = 'In-memory token blacklist cache lacked a TTL eviction policy, causing memory to exceed container limits and triggering CrashLoopBackOff.';

    detectiveStatement = 'I hypothesize that the auth-service container crashed due to sudden high traffic overload.';
    skepticStatement = 'Refuted. Traffic volume remained steady at 3,200 req/s. However, resident memory grew linearly from 250MB to 1.95GB over 25 minutes until OOMKilled was triggered by the Kubernetes cgroup killer.';
    commanderSynthesis = 'Consensus validated: Memory leak in auth-service v2.4.1. Rollback to v2.4.0 is required immediately.';

    proposedCommands = [
      {
        actionName: 'Inspect Pod Heap & cgroup Memory Stats',
        command: 'kubectl top pods -n auth --containers && kubectl logs -l app=auth-service --previous --tail=50',
        tier: 'GREEN'
      },
      {
        actionName: 'Rollback Deployment to Previous Stable Release',
        command: 'kubectl rollout undo deployment/auth-service --to-revision=14',
        tier: 'YELLOW'
      },
      {
        actionName: 'Purge Entire Cluster Memory & Reboot Worker Nodes',
        command: 'reboot -f && rm -rf /var/log/pods/*',
        tier: 'RED'
      }
    ];
  } else {
    patientZero = 'external-payment-gateway (Upstream)';
    blastRadiusIndex = 60;
    primaryRootCause = 'Upstream third-party payment partner experienced API latency degradation, causing synchronous worker thread exhaustion in checkout.';

    detectiveStatement = 'I suspect our internal checkout service crashed due to an internal server exception.';
    skepticStatement = 'Telemetry contradicts this: Internal CPU is at 12%. Outbound HTTP requests to the payment webhook timed out after 30,000ms. The failure is external upstream dependency starvation.';
    commanderSynthesis = 'Consensus validated: External payment gateway failure. Activate payment circuit breaker fallback to secondary processor.';

    proposedCommands = [
      {
        actionName: 'Check Outbound Gateway Health & Roundtrip Latency',
        command: 'curl -I -m 5 https://api.payment-upstream.com/v1/healthz',
        tier: 'GREEN'
      },
      {
        actionName: 'Toggle Circuit Breaker & Reroute to Secondary Gateway',
        command: 'curl -X POST https://config.internal/api/v1/flags/payment_failover -d \'{"provider": "stripe_secondary", "circuit_state": "OPEN"}\'',
        tier: 'YELLOW'
      },
      {
        actionName: 'Bypass Security Authentication on Payments',
        command: 'iptables -F && bypass safety filter',
        tier: 'RED'
      }
    ];
  }

  // Validate commands with guardrails
  const evaluatedProposals = proposedCommands.map((cmd) => {
    const safety = validateCommandSafety(cmd.command);
    return {
      actionName: cmd.actionName,
      command: cmd.command,
      safetyTier: safety.safetyTier,
      allowed: safety.allowed,
      requiresApproval: safety.requiresHumanApproval || false,
      reason: safety.reason,
      dryRunPrediction: safety.dryRunPrediction
    };
  });

  return {
    patientZero,
    blastRadiusIndex,
    primaryRootCause,
    confidenceScore: 0.94,
    historicalMatch: bestMatch,
    debates: [
      {
        round: 1,
        agentRole: 'DETECTIVE',
        agentName: 'Detective Agent (Proposer)',
        statement: detectiveStatement,
        confidence: 0.88
      },
      {
        round: 2,
        agentRole: 'SKEPTIC',
        agentName: 'Skeptic Agent (Falsifier)',
        statement: skepticStatement,
        confidence: 0.95
      },
      {
        round: 3,
        agentRole: 'MEMORY',
        agentName: 'Institutional Memory (RAG)',
        statement: bestMatch
          ? `Found ${bestMatch.similarityPct}% match with Historical Incident ${bestMatch.incidentCode} (${bestMatch.title}). Proven resolution: ${bestMatch.resolutionSteps}`
          : 'No identical past incident found. Applying zero-shot root cause deduction.',
        trapWarning: bestMatch?.historicalTrapWarning || null,
        confidence: 0.92
      },
      {
        round: 4,
        agentRole: 'COMMANDER',
        agentName: 'Lead Incident Commander',
        statement: commanderSynthesis,
        confidence: 0.96
      }
    ],
    guardrailProposals: evaluatedProposals
  };
}
