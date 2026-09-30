/**
 * Pre-Configured Incident Simulation Scenarios
 * For interactive live demonstrations and evaluation testing.
 */

export const SIMULATION_SCENARIOS = [
  {
    id: 'SCENARIO_DB_COLLAPSE',
    title: 'Black Friday Database Connection Pool Starvation',
    severity: 'P1',
    service: 'database-postgres',
    financialImpactPerMin: 28000,
    currency: 'INR',
    slaWindowMinutes: 30,
    summary: 'Spike in 504 Gateway Timeouts across checkout services immediately following deployment of PR #814.',
    rawAlertCount: 482,
    correlatedSignals: 3,
    noiseReductionPct: 99.4,
    blastRadiusIndex: 88,
    telemetry: [
      { streamType: 'ALERT', source: 'Prometheus-APM', payload: 'Critical: HTTP 504 error rate exceeded 15% threshold on /api/v1/checkout', timestamp: '10:14:32' },
      { streamType: 'LOG', source: 'postgres-master-0', payload: 'FATAL: remaining connection slots are reserved for non-replication superuser connections (max_connections=100 reached)', timestamp: '10:14:35' },
      { streamType: 'GIT', source: 'GitHub / main', payload: 'Commit #814a2f by @dev_intern: "Add real-time filter on orders table for campaign tracking"', timestamp: '10:14:00' },
      { streamType: 'METRIC', source: 'Datadog Agent', payload: 'P99 DB latency spiked from 38ms to 4,820ms; active connections 100/100', timestamp: '10:14:40' }
    ]
  },
  {
    id: 'SCENARIO_AUTH_MEMORY_LEAK',
    title: 'Auth Microservice Memory Leak & CrashLoopBackOff',
    severity: 'P1',
    service: 'auth-service',
    financialImpactPerMin: 18500,
    currency: 'INR',
    slaWindowMinutes: 45,
    summary: 'Authentication workers are repeatedly terminated by Kubernetes OOMKilled cgroup monitor.',
    rawAlertCount: 318,
    correlatedSignals: 2,
    noiseReductionPct: 99.3,
    blastRadiusIndex: 74,
    telemetry: [
      { streamType: 'ALERT', source: 'K8s Cluster Alert', payload: 'Pod auth-service-7f98b-xc2 terminated with ExitCode 137 (OOMKilled)', timestamp: '11:02:15' },
      { streamType: 'LOG', source: 'auth-service-pod', payload: 'FATAL: JavaScript heap out of memory. Allocation failed - process running out of memory in TokenBlacklistMap', timestamp: '11:02:10' },
      { streamType: 'GIT', source: 'GitHub / main', payload: 'Release v2.4.1 tag deployed to staging and prod nodes', timestamp: '10:45:00' }
    ]
  },
  {
    id: 'SCENARIO_PAYMENT_GATEWAY_OUTAGE',
    title: 'Third-Party Payment Gateway Outage & Webhook Hang',
    severity: 'P2',
    service: 'payment-gateway',
    financialImpactPerMin: 32000,
    currency: 'INR',
    slaWindowMinutes: 20,
    summary: 'Upstream payment processor API unresponsive; customer transaction queue accumulating backlog.',
    rawAlertCount: 265,
    correlatedSignals: 2,
    noiseReductionPct: 99.2,
    blastRadiusIndex: 62,
    telemetry: [
      { streamType: 'ALERT', source: 'CloudWatch', payload: 'Webhook delivery failure rate > 92% for upstream payment provider', timestamp: '14:20:00' },
      { streamType: 'LOG', source: 'checkout-worker', payload: 'TimeoutException: Request to https://api.stripe-upstream.net timed out after 30000ms', timestamp: '14:20:05' }
    ]
  },
  {
    id: 'SCENARIO_CITY_POWER_CASCADE',
    title: 'City Smart Grid Substation Transformer Trip & Transit Gridlock',
    severity: 'P1',
    service: 'grid-substation-4',
    financialImpactPerMin: 45000,
    currency: 'INR',
    slaWindowMinutes: 15,
    summary: 'Substation #4 thermal overload caused cascading breaker trip, de-energizing 4 traffic corridors and halting metro signalling.',
    rawAlertCount: 620,
    correlatedSignals: 4,
    noiseReductionPct: 99.3,
    blastRadiusIndex: 94,
    telemetry: [
      { streamType: 'ALERT', source: 'SCADA Telemetry', payload: 'Transformer 4B Thermal Trip Alarm (98°C reached). Feeder 4-Alpha opened automatically.', timestamp: '16:05:10' },
      { streamType: 'LOG', source: 'traffic-control-hub', payload: 'Signals at Cyber Towers Junction, Hitec City, Madhapur reporting OFF-GRID battery failsafe mode', timestamp: '16:05:22' },
      { streamType: 'METRIC', source: 'Metro Rail Ops', payload: 'Signalling voltage dropped below 180V on Blue Line Corridor 3', timestamp: '16:05:40' }
    ]
  }
];
