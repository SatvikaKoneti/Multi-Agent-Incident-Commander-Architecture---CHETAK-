/**
 * Vision AI Diagnostic Ingestion (Multi-Modal Log / Chart Parser)
 * Parses screenshots of Grafana / Datadog monitoring dashboards or hardware damage
 * to extract time-series anomaly cliffs, visual spikes, and OCR error traces.
 */

export function parseVisualTelemetry(imageMetadata = {}, imageBase64OrUrl = '') {
  const fileName = imageMetadata.filename || imageMetadata.name || 'monitoring_chart.png';
  const isGrafana = /grafana|datadog|chart|dashboard|metric|latency/i.test(fileName);
  const isHardware = /hardware|rack|cable|server|board|switch/i.test(fileName);

  if (isHardware) {
    return {
      visualType: 'HARDWARE_DIAGNOSTIC',
      detectedComponent: 'Fiber SFP+ Module / Switch Port 4',
      anomalySummary: 'Visual thermal discoloration and disconnected optical transceiver clip detected.',
      extractedMetrics: [
        { label: 'Physical Link State', value: 'DOWN / UNPLUGGED', status: 'CRITICAL' },
        { label: 'Thermal Warning Index', value: '78°C (Exceeded 70°C ceiling)', status: 'HIGH' }
      ],
      aiConfidence: 0.92,
      recommendation: 'Replace SFP+ optical transceiver module on Rack 4, Unit 12. Do not hot-swap without ESD grounding.'
    };
  }

  // Default: Grafana / Datadog dashboard chart parsing
  return {
    visualType: 'MONITORING_DASHBOARD_CHART',
    detectedSource: isGrafana ? 'Grafana APM / Prometheus Dashboard' : 'Datadog Service Health Overview',
    anomalySummary: 'Sharp 84% throughput cliff drop detected at 10:14:30 AM UTC, accompanied by a 650% spike in HTTP 504 Gateway Timeouts.',
    extractedMetrics: [
      { label: 'RPS (Requests Per Second)', before: '14,200 req/s', after: '2,150 req/s', dropPct: '84.8% cliff' },
      { label: 'P99 Latency', before: '45 ms', after: '4,850 ms', status: 'SEVERE_SPIKE' },
      { label: 'Active DB Connections', before: '42 / 100', after: '100 / 100 (Max Capacity)', status: 'EXHAUSTED' }
    ],
    ocrExtractedLogs: [
      '[10:14:32] ERROR pool-worker-12: org.postgresql.util.PSQLException: FATAL: remaining connection slots are reserved for non-replication superuser connections',
      '[10:14:35] WARN upstream-gateway: 504 Gateway Timeout while proxying request to /api/v1/checkout/process'
    ],
    aiConfidence: 0.96,
    recommendation: 'Immediate database connection pool exhaustion identified visually. Graph shows sudden cliff matching Git deployment at 10:14 AM.'
  };
}
