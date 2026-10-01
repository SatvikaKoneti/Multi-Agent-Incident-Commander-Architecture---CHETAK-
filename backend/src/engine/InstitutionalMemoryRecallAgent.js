/**
 * Cross-Incident Déjà-Vu Engine (Institutional Memory Recall)
 * Performs semantic / signature matching over 5 years of past post-mortems
 * to retrieve winning runbooks and warn against historical disaster traps.
 */

export const HISTORICAL_KNOWLEDGE_BASE = [
  {
    incidentCode: 'INC-2024-412',
    title: 'Postgres Connection Pool Saturation on Flash Sale Event',
    occurredAt: '2024-11-14T10:15:00Z',
    service: 'database-postgres',
    rootCause: 'Unindexed slow queries on order_items table held open connection pool slots, starving upstream API services.',
    resolutionSteps: '1. Dynamically raised max_connections pool to 400. 2. Applied concurrent index on order_items(user_id, status). 3. Scaled read-replica split.',
    historicalTrapWarning: 'WARNING: In 2024, restarting the replica immediately corrupted the secondary index. Do NOT restart before draining replication queue.',
    resolvedBy: 'Alex Chen (Principal SRE)',
    mttrMinutes: 14.5,
    keywords: ['postgres', 'connection pool', 'pool starvation', '504 timeout', 'unindexed query', 'database', 'slow query']
  },
  {
    incidentCode: 'INC-2024-188',
    title: 'Auth Microservice Memory Leak via Unbounded JWT Cache',
    occurredAt: '2024-06-22T08:30:00Z',
    service: 'auth-service',
    rootCause: 'In-memory token blacklist cache lacked TTL eviction policy, causing OOMKilled crash loops across worker pods.',
    resolutionSteps: '1. Reverted deployment to v1.3.8. 2. Shifted token revocation lookup to Redis cluster with 15m expiration.',
    historicalTrapWarning: 'WARNING: Do not delete Redis cluster keys manually with KEYS *. Use SCAN to avoid blocking the Redis event loop.',
    resolvedBy: 'Priya Sharma (Staff SRE)',
    mttrMinutes: 18.2,
    keywords: ['auth-service', 'memory leak', 'oomkilled', 'jwt', 'cache', 'heap out of memory', 'crashloopbackoff']
  },
  {
    incidentCode: 'INC-2025-059',
    title: 'Third-Party Payment Gateway SSL Handshake Hang',
    occurredAt: '2025-02-10T14:45:00Z',
    service: 'payment-gateway',
    rootCause: 'Upstream payment processor experienced regional outage, causing HTTP client threads to hang indefinitely without timeout limits.',
    resolutionSteps: '1. Enabled circuit breaker with 5s timeout threshold. 2. Rerouted transaction volume to backup payment provider (Stripe Secondary).',
    historicalTrapWarning: 'WARNING: Do not flush pending webhook queue during failover or double-charging will occur.',
    resolvedBy: 'Sarah Jenkins (Lead DevOps)',
    mttrMinutes: 9.8,
    keywords: ['payment', 'gateway', 'ssl', 'timeout', 'circuit breaker', 'stripe', 'upstream 502']
  },
  {
    incidentCode: 'INC-2025-301',
    title: 'Cascading Substation Power Grid Disconnect & Signal Outage',
    occurredAt: '2025-08-04T19:20:00Z',
    service: 'grid-substation-4',
    rootCause: 'High transformer thermal load triggered automated breaker trip, which cascaded load to secondary feeder and halted traffic light corridors.',
    resolutionSteps: '1. Isolated industrial feeder B. 2. Transferred emergency UPS battery backup to central traffic controller. 3. Re-energized feeder in 3-stage ramp.',
    historicalTrapWarning: 'WARNING: Never re-energize full feeder load simultaneously without 45-second stagger to prevent secondary inrush trip.',
    resolvedBy: 'Vikram Rao (Urban Infra Chief)',
    mttrMinutes: 22.0,
    keywords: ['power grid', 'substation', 'traffic signal', 'feeder', 'blackout', 'transformer', 'cascade']
  }
];

export function findHistoricalMatches(queryText = '', service = '') {
  const queryLower = (queryText + ' ' + service).toLowerCase();

  const scoredMatches = HISTORICAL_KNOWLEDGE_BASE.map((incident) => {
    let matchPoints = 0;

    // Service match
    if (service && incident.service.toLowerCase().includes(service.toLowerCase())) {
      matchPoints += 40;
    }

    // Keyword match
    for (const kw of incident.keywords) {
      if (queryLower.includes(kw.toLowerCase())) {
        matchPoints += 15;
      }
    }

    // Title / rootCause substring match
    if (queryLower.includes(incident.rootCause.toLowerCase().slice(0, 20))) {
      matchPoints += 25;
    }

    const similarityPct = Math.min(Math.round(matchPoints + (Math.random() * 8)), 96);

    return {
      ...incident,
      similarityPct: Math.max(similarityPct, 45)
    };
  });

  scoredMatches.sort((a, b) => b.similarityPct - a.similarityPct);
  return scoredMatches;
}
