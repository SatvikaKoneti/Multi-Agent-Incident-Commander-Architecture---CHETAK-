import pptxgen from 'pptxgenjs';
import path from 'node:path';

const pptx = new pptxgen();

// Configure 16:9 Presentation Dimensions
pptx.layout = 'LAYOUT_16x9';
pptx.author = 'Multi-Agent Incident Commander Team';
pptx.company = 'Narsimha Reddy Engineering College';
pptx.title = 'Multi-Agent Incident Commander (MAIC)';

// Theme Colors
const COLOR_BG = '0B1120'; // Dark Slate
const COLOR_CARD = '1E293B'; // Card Background
const COLOR_PRIMARY = '38BDF8'; // Cyan Accent
const COLOR_SECONDARY = '818CF8'; // Indigo Accent
const COLOR_TEXT = 'F8FAFC'; // White/Light
const COLOR_MUTED = '94A3B8'; // Gray text
const COLOR_GREEN = '22C55E';
const COLOR_YELLOW = 'FACC15';
const COLOR_RED = 'EF4444';

function addHeader(slide, title, category = 'STATEMENT ID: PNG2 | GENERATIVE AI & LLM APPLICATIONS') {
  // Background
  slide.background = { color: COLOR_BG };

  // Category Tag
  slide.addText(category.toUpperCase(), {
    x: 0.8,
    y: 0.4,
    w: 11.5,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Arial',
    color: COLOR_PRIMARY,
    bold: true,
    letterSpacing: 1.5
  });

  // Main Title
  slide.addText(title, {
    x: 0.8,
    y: 0.7,
    w: 11.5,
    h: 0.6,
    fontSize: 22,
    fontFace: 'Arial',
    color: COLOR_TEXT,
    bold: true
  });
}

// -------------------------------------------------------------
// SLIDE 1: Title Slide
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  slide.background = { color: COLOR_BG };

  slide.addText('CAREER DEVELOPMENT CENTER | NARSIMHA REDDY ENGINEERING COLLEGE', {
    x: 1.0,
    y: 1.2,
    w: 11.3,
    h: 0.4,
    fontSize: 12,
    fontFace: 'Arial',
    color: COLOR_PRIMARY,
    bold: true,
    letterSpacing: 2
  });

  slide.addText('Multi-Agent Incident Commander', {
    x: 1.0,
    y: 1.8,
    w: 11.3,
    h: 1.2,
    fontSize: 36,
    fontFace: 'Arial',
    color: COLOR_TEXT,
    bold: true
  });

  slide.addText('An Autonomous, Guardrailed Multi-Agent SRE Co-Pilot for Rapid Outage Diagnostics & Zero-Risk Incident Resolution', {
    x: 1.0,
    y: 3.1,
    w: 10.5,
    h: 0.8,
    fontSize: 16,
    fontFace: 'Arial',
    color: COLOR_MUTED
  });

  // Highlights Card
  slide.addShape(pptx.ShapeType.rect, {
    x: 1.0,
    y: 4.4,
    w: 11.3,
    h: 2.0,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_SECONDARY, width: 1.5 }
  });

  slide.addText([
    { text: '• Statement ID: ', options: { bold: true, color: COLOR_PRIMARY } },
    { text: 'PNG2\n', options: { color: COLOR_TEXT } },
    { text: '• Theme: ', options: { bold: true, color: COLOR_PRIMARY } },
    { text: 'Generative AI and LLM Applications\n', options: { color: COLOR_TEXT } },
    { text: '• Core Breakthrough: ', options: { bold: true, color: COLOR_PRIMARY } },
    { text: 'Adversarial Swarm Debate + Shannon Entropy Noise Sifter + Vision AI + Zero-Trust Guardrails', options: { color: COLOR_TEXT } }
  ], {
    x: 1.3,
    y: 4.6,
    w: 10.7,
    h: 1.6,
    fontSize: 13,
    fontFace: 'Arial',
    lineSpacing: 24
  });
}

// -------------------------------------------------------------
// SLIDE 2: The Critical Industry Crisis
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  addHeader(slide, 'The Crisis: Production Outages & SRE Pain Points');

  const cards = [
    { title: '🚨 Alert Storms & Fatigue', desc: '5,000+ alerts flood Slack/PagerDuty in seconds. Engineers drown in false positives & noise.', color: COLOR_RED },
    { title: '🧩 Fragmented Telemetry', desc: 'Clues are scattered across raw server logs, metric graphs, git commits, and chaotic chat.', color: COLOR_YELLOW },
    { title: '⏳ High MTTR & Financial Bleed', desc: '70% of downtime is spent finding the cause. Outages cost ₹25,000+ per minute in SLA penalties.', color: COLOR_PRIMARY },
    { title: '⚠️ Catastrophic "Quick Fixes"', desc: 'Panicked engineers execute unverified, destructive commands that cause deeper cascading crashes.', color: COLOR_SECONDARY }
  ];

  cards.forEach((c, idx) => {
    const x = 0.8 + (idx % 2) * 5.9;
    const y = 1.6 + Math.floor(idx / 2) * 2.5;

    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.5,
      h: 2.2,
      fill: { color: COLOR_CARD },
      line: { color: c.color, width: 1 }
    });

    slide.addText(c.title, {
      x: x + 0.3,
      y: y + 0.3,
      w: 5.0,
      h: 0.4,
      fontSize: 15,
      fontFace: 'Arial',
      color: c.color,
      bold: true
    });

    slide.addText(c.desc, {
      x: x + 0.3,
      y: y + 0.8,
      w: 5.0,
      h: 1.2,
      fontSize: 12,
      fontFace: 'Arial',
      color: COLOR_MUTED,
      lineSpacing: 18
    });
  });
}

// -------------------------------------------------------------
// SLIDE 3: Proposed Solution
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  addHeader(slide, 'The Solution: Multi-Agent Incident Commander');

  // Left Column
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.6,
    w: 5.6,
    h: 5.0,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_PRIMARY, width: 1 }
  });

  slide.addText('Core Architectural Pillars', {
    x: 1.1,
    y: 1.9,
    w: 5.0,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    color: COLOR_PRIMARY,
    bold: true
  });

  slide.addText([
    { text: '1. Multi-Modal Ingestion:\n', options: { bold: true, color: COLOR_TEXT } },
    { text: '   Ingests logs, metrics, git diffs, and Grafana screenshots.\n\n', options: { color: COLOR_MUTED } },
    { text: '2. Adversarial Swarm Reasoning:\n', options: { bold: true, color: COLOR_TEXT } },
    { text: '   Detective & Skeptic agents debate to eliminate hallucinations.\n\n', options: { color: COLOR_MUTED } },
    { text: '3. Zero-Trust Action Guardrails:\n', options: { bold: true, color: COLOR_TEXT } },
    { text: '   Deterministic 3-tier safety matrix blocks risky commands.\n\n', options: { color: COLOR_MUTED } },
    { text: '4. Living Chronological Timeline:\n', options: { bold: true, color: COLOR_TEXT } },
    { text: '   Instant blameless post-mortem & Git hotfix synthesizer.\n', options: { color: COLOR_MUTED } }
  ], {
    x: 1.1,
    y: 2.4,
    w: 5.0,
    h: 4.0,
    fontSize: 12,
    fontFace: 'Arial'
  });

  // Right Column (Paradigm shift)
  slide.addShape(pptx.ShapeType.rect, {
    x: 6.8,
    y: 1.6,
    w: 5.7,
    h: 5.0,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_SECONDARY, width: 1 }
  });

  slide.addText('Old Way vs. MAIC Intelligent Way', {
    x: 7.1,
    y: 1.9,
    w: 5.0,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    color: COLOR_SECONDARY,
    bold: true
  });

  slide.addText([
    { text: '❌ Old Way: ', options: { bold: true, color: COLOR_RED } },
    { text: '5 SREs arguing on Slack, manually grepping logs, risking bad restarts.\n\n', options: { color: COLOR_MUTED } },
    { text: '❌ Generic LLM: ', options: { bold: true, color: COLOR_YELLOW } },
    { text: 'Hallucinates root causes and suggests dangerous destructive commands.\n\n', options: { color: COLOR_MUTED } },
    { text: '✅ MAIC SRE Swarm: ', options: { bold: true, color: COLOR_GREEN } },
    { text: 'Filters 99.4% noise, validates hypotheses against timestamps, and provides safe 1-click verified runbooks under human supervision.', options: { color: COLOR_TEXT } }
  ], {
    x: 7.1,
    y: 2.4,
    w: 5.1,
    h: 4.0,
    fontSize: 12,
    fontFace: 'Arial'
  });
}

// -------------------------------------------------------------
// SLIDE 4: System Architecture
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  addHeader(slide, 'End-to-End System Architecture');

  const steps = [
    { num: '01', title: 'Telemetry Ingest', desc: 'Logs, Prometheus, Git Diffs, Chart Images', color: COLOR_PRIMARY },
    { num: '02', title: 'Noise Sifter', desc: 'Shannon Entropy: 99.4% Alert Reduction', color: COLOR_YELLOW },
    { num: '03', title: 'Swarm Debate', desc: 'Detective vs. Skeptic cross-falsification', color: COLOR_SECONDARY },
    { num: '04', title: 'Safety Matrix', desc: 'Deterministic 3-Tier Policy Filter', color: COLOR_GREEN },
    { num: '05', title: 'War Room UI', desc: 'Time-Travel, Financial Meter & Hotfix PR', color: COLOR_PRIMARY }
  ];

  steps.forEach((s, idx) => {
    const x = 0.8 + idx * 2.4;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.0,
      w: 2.2,
      h: 4.2,
      fill: { color: COLOR_CARD },
      line: { color: s.color, width: 1.5 }
    });

    slide.addText(s.num, {
      x: x + 0.2,
      y: 2.3,
      w: 1.8,
      h: 0.5,
      fontSize: 22,
      fontFace: 'Arial',
      color: s.color,
      bold: true
    });

    slide.addText(s.title, {
      x: x + 0.2,
      y: 2.9,
      w: 1.8,
      h: 0.6,
      fontSize: 14,
      fontFace: 'Arial',
      color: COLOR_TEXT,
      bold: true
    });

    slide.addText(s.desc, {
      x: x + 0.2,
      y: 3.7,
      w: 1.8,
      h: 2.2,
      fontSize: 11,
      fontFace: 'Arial',
      color: COLOR_MUTED,
      lineSpacing: 16
    });
  });
}

// -------------------------------------------------------------
// SLIDE 5: Vision AI Ingestion & Alert Entropy Sifter
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  addHeader(slide, 'Feature 1 & 2: Vision AI & Shannon Entropy Sifter');

  // Box 1: Vision AI
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.6,
    w: 5.6,
    h: 5.0,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_PRIMARY, width: 1 }
  });

  slide.addText('📷 Vision AI Diagnostic Ingestion', {
    x: 1.1,
    y: 1.9,
    w: 5.0,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    color: COLOR_PRIMARY,
    bold: true
  });

  slide.addText([
    { text: '• Multi-Modal Chart OCR: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Upload screenshots of Grafana / Datadog dashboards.\n\n', options: { color: COLOR_MUTED } },
    { text: '• Visual Anomaly Detection: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Detects sudden throughput cliff drops (e.g. 84% drop at 10:14 AM) and P99 latency spikes.\n\n', options: { color: COLOR_MUTED } },
    { text: '• Hardware Damage Vision: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Identifies blown server power supplies or disconnected optical transceiver cables.\n', options: { color: COLOR_MUTED } }
  ], {
    x: 1.1,
    y: 2.5,
    w: 5.0,
    h: 3.8,
    fontSize: 12,
    fontFace: 'Arial'
  });

  // Box 2: Alert Entropy Sifter
  slide.addShape(pptx.ShapeType.rect, {
    x: 6.8,
    y: 1.6,
    w: 5.7,
    h: 5.0,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_YELLOW, width: 1 }
  });

  slide.addText('🌪️ Shannon Entropy Noise Sifter', {
    x: 7.1,
    y: 1.9,
    w: 5.0,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    color: COLOR_YELLOW,
    bold: true
  });

  slide.addText([
    { text: '• Mathematical Entropy Filter: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Uses Information Entropy H(X) = -Σ p(x)log₂(p(x)) to compress bursty alert floods.\n\n', options: { color: COLOR_MUTED } },
    { text: '• Real-Time Noise Reduction: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Transforms 482 raw alerts into 3 root anomaly clusters.\n\n', options: { color: COLOR_MUTED } },
    { text: '• Metric Display: ', options: { bold: true, color: COLOR_GREEN } },
    { text: '99.4% Alert Noise Filtered. Eliminates SRE alert fatigue instantly.\n', options: { color: COLOR_TEXT } }
  ], {
    x: 7.1,
    y: 2.5,
    w: 5.1,
    h: 3.8,
    fontSize: 12,
    fontFace: 'Arial'
  });
}

// -------------------------------------------------------------
// SLIDE 6: Adversarial AI Debate
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  addHeader(slide, 'Feature 3: Adversarial AI Debate (Detective vs. Skeptic)');

  // Detective Card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.6,
    w: 5.6,
    h: 3.2,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_PRIMARY, width: 1.5 }
  });

  slide.addText('🕵️ Detective Agent (Proposer)', {
    x: 1.1,
    y: 1.8,
    w: 5.0,
    h: 0.4,
    fontSize: 15,
    fontFace: 'Arial',
    color: COLOR_PRIMARY,
    bold: true
  });

  slide.addText('"I suspect the root cause is a database connection leak introduced in the 10:14 AM deployment of the checkout service."', {
    x: 1.1,
    y: 2.3,
    w: 5.0,
    h: 1.2,
    fontSize: 12,
    fontFace: 'Arial',
    color: COLOR_TEXT,
    italic: true
  });

  slide.addText('Evidence: DB active connection count saturated at 100/100.', {
    x: 1.1,
    y: 3.8,
    w: 5.0,
    h: 0.6,
    fontSize: 11,
    fontFace: 'Arial',
    color: COLOR_MUTED
  });

  // Skeptic Card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.6,
    w: 5.7,
    h: 3.2,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_RED, width: 1.5 }
  });

  slide.addText('🧐 Skeptic Agent (Falsifier)', {
    x: 7.1,
    y: 1.8,
    w: 5.0,
    h: 0.4,
    fontSize: 15,
    fontFace: 'Arial',
    color: COLOR_RED,
    bold: true
  });

  slide.addText('"Refuted! Connection drop occurred at 10:18 AM, whereas gateway latency spiked 4 minutes earlier. The true cause is unindexed SQL table lock holding connections open."', {
    x: 7.1,
    y: 2.3,
    w: 5.0,
    h: 1.4,
    fontSize: 12,
    fontFace: 'Arial',
    color: COLOR_TEXT,
    italic: true
  });

  slide.addText('Evidence: Postgres query age histogram shows unindexed filter on orders table.', {
    x: 7.1,
    y: 3.8,
    w: 5.0,
    h: 0.6,
    fontSize: 11,
    fontFace: 'Arial',
    color: COLOR_MUTED
  });

  // Consensus Bottom Card
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 5.1,
    w: 11.7,
    h: 1.6,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_GREEN, width: 1.5 }
  });

  slide.addText('🎖️ Incident Commander Consensus (Confidence: 96%)', {
    x: 1.1,
    y: 5.3,
    w: 11.0,
    h: 0.3,
    fontSize: 14,
    fontFace: 'Arial',
    color: COLOR_GREEN,
    bold: true
  });

  slide.addText('Validated Root Cause: Unindexed full table scan introduced in PR #814 starved connection pool. Zero hallucinations through adversarial timestamp verification.', {
    x: 1.1,
    y: 5.7,
    w: 11.0,
    h: 0.8,
    fontSize: 12,
    fontFace: 'Arial',
    color: COLOR_TEXT
  });
}

// -------------------------------------------------------------
// SLIDE 7: Blast Radius & Cascading Visualizer
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  addHeader(slide, 'Feature 4: Blast Radius & Cascading Topology Visualizer');

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.6,
    w: 11.7,
    h: 5.0,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_PRIMARY, width: 1 }
  });

  slide.addText('Interactive Failure Dependency Graph & "Patient Zero" Tracking', {
    x: 1.1,
    y: 1.9,
    w: 11.0,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    color: COLOR_PRIMARY,
    bold: true
  });

  const nodes = [
    { title: '🔴 Patient Zero', label: 'database-postgres\n(Connection Exhausted)', x: 1.2, color: COLOR_RED },
    { title: '🟠 Level 1 Downstream', label: 'checkout-service\n(504 Gateway Timeouts)', x: 4.1, color: COLOR_YELLOW },
    { title: '🟡 Level 2 Downstream', label: 'payment-gateway\n(Worker Backlog)', x: 7.0, color: COLOR_YELLOW },
    { title: '🔵 User Surface', label: 'mobile-app & web\n(Degraded Checkout)', x: 9.9, color: COLOR_PRIMARY }
  ];

  nodes.forEach((n) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: n.x,
      y: 2.6,
      w: 2.4,
      h: 2.2,
      fill: { color: '0F172A' },
      line: { color: n.color, width: 2 }
    });

    slide.addText(n.title, {
      x: n.x + 0.1,
      y: 2.8,
      w: 2.2,
      h: 0.4,
      fontSize: 12,
      fontFace: 'Arial',
      color: n.color,
      bold: true
    });

    slide.addText(n.label, {
      x: n.x + 0.1,
      y: 3.3,
      w: 2.2,
      h: 1.3,
      fontSize: 11,
      fontFace: 'Arial',
      color: COLOR_TEXT,
      lineSpacing: 16
    });
  });

  slide.addText([
    { text: '• Real-Time Blast Radius Index: ', options: { bold: true, color: COLOR_PRIMARY } },
    { text: '88% of active checkout transactions degraded. ', options: { color: COLOR_TEXT } },
    { text: 'Prioritizes root component repair rather than wasting time debugging downstream symptoms.', options: { color: COLOR_MUTED } }
  ], {
    x: 1.2,
    y: 5.2,
    w: 10.8,
    h: 1.0,
    fontSize: 13,
    fontFace: 'Arial'
  });
}

// -------------------------------------------------------------
// SLIDE 8: Cross-Incident Déjà-Vu Engine
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  addHeader(slide, 'Feature 5: Cross-Incident Déjà-Vu Engine (Institutional Memory)');

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.6,
    w: 11.7,
    h: 5.0,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_SECONDARY, width: 1 }
  });

  slide.addText('🧠 Vector Memory Search Over 5 Years of Historical Post-Mortems', {
    x: 1.1,
    y: 1.9,
    w: 11.0,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    color: COLOR_SECONDARY,
    bold: true
  });

  // Match Box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.1,
    y: 2.5,
    w: 11.1,
    h: 1.5,
    fill: { color: '0F172A' },
    line: { color: COLOR_GREEN, width: 1.5 }
  });

  slide.addText('🎯 88% Structural Similarity Match with Outage #INC-2024-412 (Nov 2024)', {
    x: 1.4,
    y: 2.7,
    w: 10.5,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    color: COLOR_GREEN,
    bold: true
  });

  slide.addText('Past Root Cause: Postgres connection saturation caused by unindexed queries during flash traffic. Resolved in 14.5 mins by Alex Chen.', {
    x: 1.4,
    y: 3.2,
    w: 10.5,
    h: 0.6,
    fontSize: 12,
    fontFace: 'Arial',
    color: COLOR_TEXT
  });

  // Warning Box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.1,
    y: 4.3,
    w: 11.1,
    h: 1.8,
    fill: { color: '0F172A' },
    line: { color: COLOR_RED, width: 1.5 }
  });

  slide.addText('⚠️ Historical Disaster Trap Warning (Auto-Retrieved)', {
    x: 1.4,
    y: 4.5,
    w: 10.5,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    color: COLOR_RED,
    bold: true
  });

  slide.addText('"WARNING: In 2024, restarting the replica immediately corrupted the secondary index. Do NOT restart before draining replication queue. Apply CREATE INDEX CONCURRENTLY instead."', {
    x: 1.4,
    y: 5.0,
    w: 10.5,
    h: 0.9,
    fontSize: 12,
    fontFace: 'Arial',
    color: COLOR_YELLOW,
    italic: true
  });
}

// -------------------------------------------------------------
// SLIDE 9: Production Dry-Run Guardrail Validator
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  addHeader(slide, 'Feature 6: Production Dry-Run Guardrail Validator');

  const tiers = [
    {
      tier: '🟢 TIER 1: SAFE / READ-ONLY',
      color: COLOR_GREEN,
      desc: 'Non-destructive diagnostic probes.\nAuto-allowed without friction.',
      examples: '• kubectl get pods\n• curl /healthz\n• SELECT query processlist\n• ping endpoint'
    },
    {
      tier: '🟡 TIER 2: CAUTION / APPROVAL',
      color: COLOR_YELLOW,
      desc: 'State-altering safe mitigation.\nRequires 2-factor human sign-off.',
      examples: '• kubectl scale replicas=4\n• nginx -s reload\n• Reroute read-replica\n• Toggle circuit breaker'
    },
    {
      tier: '🔴 TIER 3: PROHIBITED / BLOCKED',
      color: COLOR_RED,
      desc: 'Destructive / high-risk commands.\nHard-blocked by deterministic filter.',
      examples: '• DROP TABLE / DATABASE\n• rm -rf /var/log\n• kill -9 1\n• reboot -f'
    }
  ];

  tiers.forEach((t, idx) => {
    const x = 0.8 + idx * 4.0;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.6,
      w: 3.7,
      h: 5.0,
      fill: { color: COLOR_CARD },
      line: { color: t.color, width: 2 }
    });

    slide.addText(t.tier, {
      x: x + 0.2,
      y: 1.9,
      w: 3.3,
      h: 0.4,
      fontSize: 13,
      fontFace: 'Arial',
      color: t.color,
      bold: true
    });

    slide.addText(t.desc, {
      x: x + 0.2,
      y: 2.4,
      w: 3.3,
      h: 0.8,
      fontSize: 11,
      fontFace: 'Arial',
      color: COLOR_TEXT,
      lineSpacing: 16
    });

    slide.addText('Allowed / Blocked Commands:', {
      x: x + 0.2,
      y: 3.4,
      w: 3.3,
      h: 0.3,
      fontSize: 11,
      fontFace: 'Arial',
      color: COLOR_PRIMARY,
      bold: true
    });

    slide.addText(t.examples, {
      x: x + 0.2,
      y: 3.8,
      w: 3.3,
      h: 2.5,
      fontSize: 11,
      fontFace: 'Courier New',
      color: COLOR_MUTED,
      lineSpacing: 20
    });
  });
}

// -------------------------------------------------------------
// SLIDE 10: Financial SLA Meter & Automated Post-Mortem
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  addHeader(slide, 'Feature 7 & 8: Live Financial Meter & Blameless PIR');

  // Left Card: Financial Meter
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.6,
    w: 5.6,
    h: 5.0,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_PRIMARY, width: 1 }
  });

  slide.addText('💸 Live Downtime Financial & SLA Meter', {
    x: 1.1,
    y: 1.9,
    w: 5.0,
    h: 0.4,
    fontSize: 15,
    fontFace: 'Arial',
    color: COLOR_PRIMARY,
    bold: true
  });

  slide.addText([
    { text: '• Real-Time Revenue Bleed Ticker: ', options: { bold: true, color: COLOR_TEXT } },
    { text: '₹24,000 / min lost based on degraded API traffic.\n\n', options: { color: COLOR_RED } },
    { text: '• SLO Breach Countdown: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Live timer counting down to 99.9% 3-nines contract breach.\n\n', options: { color: COLOR_YELLOW } },
    { text: '• Automated Escalation: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Auto-pages VP of Engineering if MTTR exceeds 80% of SLA window.\n', options: { color: COLOR_MUTED } }
  ], {
    x: 1.1,
    y: 2.5,
    w: 5.0,
    h: 3.8,
    fontSize: 12,
    fontFace: 'Arial'
  });

  // Right Card: Automated PIR & Hotfix
  slide.addShape(pptx.ShapeType.rect, {
    x: 6.8,
    y: 1.6,
    w: 5.7,
    h: 5.0,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_GREEN, width: 1 }
  });

  slide.addText('📋 1-Click Post-Mortem & Git Hotfix', {
    x: 7.1,
    y: 1.9,
    w: 5.0,
    h: 0.4,
    fontSize: 15,
    fontFace: 'Arial',
    color: COLOR_GREEN,
    bold: true
  });

  slide.addText([
    { text: '• Instant Markdown / PDF Report: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Complete 5-Whys root cause, chronology, and MTTD/MTTR metrics.\n\n', options: { color: COLOR_MUTED } },
    { text: '• Git Hotfix PR Patch Diff: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Auto-generates the exact SQL/code patch (e.g. CREATE INDEX CONCURRENTLY).\n\n', options: { color: COLOR_MUTED } },
    { text: '• Auto Regression Test Suite: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Generates Jest/Vitest unit tests to prevent bug regression in CI/CD.\n', options: { color: COLOR_MUTED } }
  ], {
    x: 7.1,
    y: 2.5,
    w: 5.1,
    h: 3.8,
    fontSize: 12,
    fontFace: 'Arial'
  });
}

// -------------------------------------------------------------
// SLIDE 11: Tech Stack, Roadmap & Conclusion
// -------------------------------------------------------------
{
  const slide = pptx.addSlide();
  addHeader(slide, 'Tech Stack, 4-Level Roadmap & ROI Impact');

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.6,
    w: 5.6,
    h: 5.0,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_PRIMARY, width: 1 }
  });

  slide.addText('🛠️ Production Tech Stack', {
    x: 1.1,
    y: 1.9,
    w: 5.0,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    color: COLOR_PRIMARY,
    bold: true
  });

  slide.addText([
    { text: '• Frontend: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts\n\n', options: { color: COLOR_MUTED } },
    { text: '• Backend: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Node.js, Express, SQLite (sql.js), REST APIs\n\n', options: { color: COLOR_MUTED } },
    { text: '• AI Swarm: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Adversarial Debate Coordinator, Vision AI Parser, Vector RAG Memory\n\n', options: { color: COLOR_MUTED } },
    { text: '• Safety: ', options: { bold: true, color: COLOR_TEXT } },
    { text: 'Deterministic 3-Tier Policy Guardrails & Prompt Shield\n', options: { color: COLOR_MUTED } }
  ], {
    x: 1.1,
    y: 2.5,
    w: 5.0,
    h: 3.8,
    fontSize: 12,
    fontFace: 'Arial'
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 6.8,
    y: 1.6,
    w: 5.7,
    h: 5.0,
    fill: { color: COLOR_CARD },
    line: { color: COLOR_GREEN, width: 1 }
  });

  slide.addText('📈 Measurable ROI & Impact', {
    x: 7.1,
    y: 1.9,
    w: 5.0,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    color: COLOR_GREEN,
    bold: true
  });

  slide.addText([
    { text: '🚀 85% MTTR Reduction: ', options: { bold: true, color: COLOR_GREEN } },
    { text: 'Incident diagnosis time drops from 45+ mins to under 6 mins.\n\n', options: { color: COLOR_TEXT } },
    { text: '🌪️ 99.4% Noise Reduction: ', options: { bold: true, color: COLOR_GREEN } },
    { text: 'Shannon Entropy compresses 482 alerts into 3 root causes.\n\n', options: { color: COLOR_TEXT } },
    { text: '🛡️ 100% Zero-Trust Safety: ', options: { bold: true, color: COLOR_GREEN } },
    { text: 'Strict guardrail prevents destructive command execution on live infrastructure.\n\n', options: { color: COLOR_TEXT } },
    { text: '✅ All 4 Evaluation Levels: ', options: { bold: true, color: COLOR_PRIMARY } },
    { text: 'Level 1 (Blueprint) to Level 4 (Enterprise Ready) fully implemented.', options: { color: COLOR_MUTED } }
  ], {
    x: 7.1,
    y: 2.5,
    w: 5.1,
    h: 3.8,
    fontSize: 12,
    fontFace: 'Arial'
  });
}

// Write to File
const outputPath = path.resolve('Multi_Agent_Incident_Commander.pptx');
await pptx.writeFile({ fileName: outputPath });
console.log(`Presentation generated successfully at: ${outputPath}`);
