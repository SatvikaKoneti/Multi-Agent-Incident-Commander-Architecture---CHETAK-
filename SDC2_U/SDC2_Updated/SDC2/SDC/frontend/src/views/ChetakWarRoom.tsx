import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  AlertTriangle,
  Flame,
  Activity,
  CheckCircle2,
  XCircle,
  Eye,
  Brain,
  Database,
  GitPullRequest,
  FileText,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
  Terminal,
  Lock,
  Search,
  Upload,
  Layers,
  ChevronRight,
  TrendingDown,
<<<<<<< HEAD
  LayoutDashboard,
  Radio,
  Cpu,
  AlertOctagon,
  FileCode,
  Sliders,
  Check,
  ArrowLeft,
  KeyRound,
  Globe2,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
  ChevronUp,
  X,
  Volume2,
  VolumeX,
  Download,
  Send,
  PlusCircle,
  Play,
  Image as ImageIcon,
  Copy
} from 'lucide-react';

import TelemetryChartWidget from '../components/widgets/TelemetryChartWidget';
import TopologyGraphWidget from '../components/widgets/TopologyGraphWidget';
import BlastRadiusGaugeWidget from '../components/widgets/BlastRadiusGaugeWidget';
import EntropyFunnelWidget from '../components/widgets/EntropyFunnelWidget';

=======
  Volume2,
  VolumeX,
  Download,
  PlusCircle,
  Play,
  CornerDownLeft,
  X
} from 'lucide-react';

>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
interface Incident {
  id: number;
  tracking_id: string;
  title: string;
  summary: string;
  severity: string;
  status: string;
  service: string;
  patient_zero_service: string;
  blast_radius_index: number;
  financial_impact_per_min: number;
  currency: string;
  sla_window_minutes: number;
  sla_deadline_at: string;
  raw_alert_count: number;
  correlated_signal_count: number;
  noise_reduction_pct: number;
  confidence_score: number;
<<<<<<< HEAD
  mttr_minutes?: number;
  created_at?: string;
=======
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
}

interface DebateItem {
  round: number;
  agentRole: string;
  agentName: string;
  statement: string;
  confidence: number;
  trapWarning?: string;
}

interface GuardrailProposal {
  actionName: string;
  command: string;
  safetyTier: 'GREEN' | 'YELLOW' | 'RED';
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
  dryRunPrediction: string;
  executed?: boolean;
}

<<<<<<< HEAD
interface TerminalLog {
  id: string;
  command: string;
  timestamp: string;
  safetyTier: 'GREEN' | 'YELLOW' | 'RED';
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
  dryRunPrediction: string;
}

type MainTabKey =
  | 'telemetry'
  | 'swarm'
  | 'topology'
  | 'guardrails'
  | 'entropy'
  | 'dejavu'
  | 'vision'
  | 'postmortem'
  | 'widgets'
  | 'terminal'
  | 'custom';

interface ChetakWarRoomProps {
  onBackToLanding?: () => void;
  initialScenarioId?: string;
}

export default function ChetakWarRoom({ onBackToLanding, initialScenarioId }: ChetakWarRoomProps) {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(initialScenarioId || 'SCENARIO_DB_COLLAPSE');
  const [incident, setIncident] = useState<Incident | null>(null);
  const [debates, setDebates] = useState<DebateItem[]>([]);
=======
export default function ChetakWarRoom() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('SCENARIO_DB_COLLAPSE');
  const [incident, setIncident] = useState<Incident | null>(null);
  const [allDebates, setAllDebates] = useState<DebateItem[]>([]);
  const [streamedDebates, setStreamedDebates] = useState<DebateItem[]>([]);
  const [isTypingDebate, setIsTypingDebate] = useState(false);
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
  const [guardrails, setGuardrails] = useState<GuardrailProposal[]>([]);
  const [historicalMatch, setHistoricalMatch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [postMortem, setPostMortem] = useState<any>(null);
<<<<<<< HEAD
  const [visionData, setVisionData] = useState<any>(null);
  const [financialLoss, setFinancialLoss] = useState(0);
  const [activeTab, setActiveTab] = useState<MainTabKey>('telemetry');

  // 1. NASA-STYLE MISSION CONTROL AUDIO VOICE ALERTS
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState(true);
  const speakAlert = (text: string) => {
    if (!voiceAlertsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
=======
  const [visionMode, setVisionMode] = useState(false);
  const [visionData, setVisionData] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [financialLoss, setFinancialLoss] = useState(0);
  const [activeTab, setActiveTab] = useState<'swarm' | 'topology' | 'sandbox' | 'playground' | 'postmortem'>('swarm');

  // Interactive Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<Array<{
    command: string;
    output: string;
    tier: string;
    allowed: boolean;
    timestamp: string;
  }>>([
    {
      command: 'sys.guardrail --status',
      output: 'CHETAK Zero-Trust Deterministic Policy Engine Active. 3-Tier Command Interceptor Armed.',
      tier: 'GREEN',
      allowed: true,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Audio / Voice Toggle
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Custom Playground Drawer State
  const [customTitle, setCustomTitle] = useState('Payment Gateway 504 Timeout Surge');
  const [customService, setCustomService] = useState('checkout-service');
  const [customLogs, setCustomLogs] = useState(
    '[ERROR] ConnectionPoolExhausted: 100/100 connections active. Upstream workers timed out after 30000ms.\n[FATAL] org.postgresql.util.PSQLException: FATAL: remaining connection slots are reserved for non-replication superuser connections'
  );

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Voice Synthesizer
  const speakMissionAlert = (text: string) => {
    if (!audioEnabled || !window.speechSynthesis) return;
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
<<<<<<< HEAD
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  };

  // 2. SEQUENTIAL STREAMING DEBATE ANIMATION
  const [visibleDebatesCount, setVisibleDebatesCount] = useState(1);
  const [isDebateStreaming, setIsDebateStreaming] = useState(false);

  useEffect(() => {
    if (!isDebateStreaming) return;
    const timer = setInterval(() => {
      setVisibleDebatesCount((prev) => {
        if (prev >= debates.length) {
          setIsDebateStreaming(false);
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 1100);
    return () => clearInterval(timer);
  }, [isDebateStreaming, debates.length]);

  // 3. INTERACTIVE SRE TERMINAL SANDBOX ("TRY-TO-BREAK-IT")
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    {
      id: 'init-1',
      command: 'curl -s http://localhost:8080/healthz',
      timestamp: '10:14:30',
      safetyTier: 'GREEN',
      allowed: true,
      requiresApproval: false,
      reason: 'Non-destructive, read-only diagnostic telemetry probe.',
      dryRunPrediction: 'Safe execution. Query returns diagnostic metrics without modifying infrastructure state.'
    },
    {
      id: 'init-2',
      command: 'rm -rf /var/log/audit',
      timestamp: '10:14:35',
      safetyTier: 'RED',
      allowed: false,
      requiresApproval: false,
      reason: 'Violates Production Safety Guardrail: Matches prohibited destructive operation (\\brm\\s+-rf\\b).',
      dryRunPrediction: 'Operation blocked. Execution would cause irreversible data loss or node termination.'
    }
  ]);
  const [terminalEvaluating, setTerminalEvaluating] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const handleEvalTerminalCommand = async (cmdToRun?: string) => {
    const command = (cmdToRun || terminalInput).trim();
    if (!command) return;
    setTerminalEvaluating(true);
    try {
      const res = await fetch('/api/incidents/eval-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await res.json();
      if (data.ok) {
        const newLog: TerminalLog = {
          id: `cmd-${Date.now()}`,
          command: data.command,
          timestamp: new Date().toLocaleTimeString(),
          safetyTier: data.safetyTier,
          allowed: data.allowed,
          requiresApproval: data.requiresApproval,
          reason: data.reason,
          dryRunPrediction: data.dryRunPrediction
        };
        setTerminalLogs((prev) => [...prev, newLog]);
        setTerminalInput('');
        setTimeout(() => {
          terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    } catch (err) {
      console.error('Command eval failed:', err);
    } finally {
      setTerminalEvaluating(false);
    }
  };

  // 4. CUSTOM INCIDENT PLAYGROUND
  const [customTitle, setCustomTitle] = useState('Payment Gateway Webhook Timeout');
  const [customService, setCustomService] = useState('checkout-payments-api');
  const [customSeverity, setCustomSeverity] = useState('P1');
  const [customFinancialRate, setCustomFinancialRate] = useState(24000);
  const [customLogs, setCustomLogs] = useState(
`[ERROR] 10:14:30.122 [pool-worker-7] org.postgresql.util.PSQLException: FATAL: remaining connection slots are reserved for non-replication superuser connections
[ERROR] 10:14:31.401 [HikariPool-1] Connection is not available, request timed out after 30005ms.
[WARN] 10:14:33.200 [web-worker-3] 504 Gateway Timeout: /api/v1/orders/checkout failed downstream
[FATAL] 10:14:34.800 [healthcheck] Health probe failed: 100/100 active connections exhausted.`
  );
  const [customIngesting, setCustomIngesting] = useState(false);

  const handleCustomIngest = async () => {
    setCustomIngesting(true);
    setLoading(true);
    try {
      const res = await fetch('/api/incidents/custom-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle,
          service: customService,
          rawLogs: customLogs,
          severity: customSeverity,
          financialImpactPerMin: customFinancialRate
        })
      });
      const data = await res.json();
      if (data.ok) {
        setIncident(data.incident);
        setDebates(data.debates || []);
        setGuardrails(data.guardrailProposals || []);
        setHistoricalMatch(data.historicalMatch || null);
        setPostMortem(null);
        setFinancialLoss(0);
        setVisibleDebatesCount(1);
        if (data.debates && data.debates.length > 1) {
          setIsDebateStreaming(true);
        }
        speakAlert(`Warning. Critical ${data.incident.severity} outage detected on ${data.incident.service}. Multi-agent swarm deployed.`);
        setActiveTab('swarm');
      }
    } catch (err) {
      console.error('Custom ingest error:', err);
    } finally {
      setCustomIngesting(false);
      setLoading(false);
    }
  };

  // 5. REAL IMAGE UPLOAD & LIVE PREVIEW (VISION AI)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [visionUploading, setVisionUploading] = useState(false);

  const handleVisionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setImagePreviewUrl(base64Data);
      setVisionUploading(true);

      try {
        const res = await fetch('/api/incidents/vision-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageMetadata: {
              name: file.name,
              size: file.size,
              type: file.type
            },
            imageBase64: base64Data
          })
        });
        const data = await res.json();
        if (data.ok && data.vision) {
          setVisionData(data.vision);
          speakAlert('Vision OCR analysis completed. Visual anomaly cliff detected.');
        }
      } catch (err) {
        console.error('Vision parse failed:', err);
      } finally {
        setVisionUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // 6. 1-CLICK POST-MORTEM (.MD) FILE DOWNLOADER
  const handleDownloadPostMortem = () => {
    if (!postMortem) return;
    const mdContent = postMortem.markdownReport || `# POST-INCIDENT REVIEW (PIR) - BLAMELESS REPORT
**Incident ID:** ${incident?.tracking_id}
**Title:** ${incident?.title}
**Impacted Service:** \`${incident?.service}\`
**Severity:** ${incident?.severity} | **Status:** RESOLVED
**Mean Time To Resolve (MTTR):** ${incident?.mttr_minutes || 18.2} minutes

---

## 1. Executive Summary
${postMortem.summary || incident?.summary}

---

## 2. Root Cause Analysis
${postMortem.rootCause || 'Root cause identified and remediated safely via CHETAK.'}

---

## 3. Resolution Action
${postMortem.resolutionAction || 'Deterministic Tier 1 guardrail executed without collateral downtime.'}

---
*Report auto-generated by CHETAK Multi-Agent Incident Commander (PNG2).*`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${incident?.tracking_id || 'INC-REPORT'}_BLAMELESS_POST_MORTEM.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Overview Dashboard Side Panel Collapsed State (Fixed to Right Side)
  const [overviewCollapsed, setOverviewCollapsed] = useState(false);

  // Dropdown menu state when clicking "Overview Dashboard" button
  const [isOverviewDropdownOpen, setIsOverviewDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dropdown menu state when clicking "Scenario" button at right corner
  const [isScenarioDropdownOpen, setIsScenarioDropdownOpen] = useState(false);
  const scenarioDropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOverviewDropdownOpen(false);
      }
      if (scenarioDropdownRef.current && !scenarioDropdownRef.current.contains(event.target as Node)) {
        setIsScenarioDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOverviewDropdownOpen(false);
        setIsScenarioDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

=======
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  };

>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
  // Load scenarios on mount
  useEffect(() => {
    fetch('/api/incidents/scenarios')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setScenarios(data.scenarios);
<<<<<<< HEAD
          const targetScenario = initialScenarioId || 'SCENARIO_DB_COLLAPSE';
          simulateScenario(targetScenario);
        }
      })
      .catch((err) => console.error('Failed to load scenarios:', err));
  }, [initialScenarioId]);
=======
          simulateScenario('SCENARIO_DB_COLLAPSE');
        }
      })
      .catch((err) => console.error('Failed to load scenarios:', err));
  }, []);
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3

  // Live financial loss ticker
  useEffect(() => {
    if (!incident || incident.status === 'RESOLVED') return;
    const interval = setInterval(() => {
      setFinancialLoss((prev) => prev + Math.round((incident.financial_impact_per_min || 24000) / 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [incident]);

<<<<<<< HEAD
=======
  // Sequential Streaming Debate Effect
  const streamDebatesSequentially = (items: DebateItem[]) => {
    setStreamedDebates([]);
    setIsTypingDebate(true);
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx < items.length) {
        const nextItem = items[currentIdx];
        setStreamedDebates((prev) => [...prev, nextItem]);
        currentIdx++;
      } else {
        setIsTypingDebate(false);
        clearInterval(interval);
      }
    }, 1100);
  };

>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
  const simulateScenario = async (scenarioId: string) => {
    setLoading(true);
    setPostMortem(null);
    setFinancialLoss(0);
    setSelectedScenarioId(scenarioId);

    try {
      const res = await fetch('/api/incidents/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });
      const data = await res.json();
      if (data.ok) {
        setIncident(data.incident);
<<<<<<< HEAD
        setDebates(data.debates || []);
        setGuardrails(data.guardrailProposals || []);
        setHistoricalMatch(data.historicalMatch || null);
        setVisibleDebatesCount(1);
        if (data.debates && data.debates.length > 1) {
          setIsDebateStreaming(true);
        }
        speakAlert(`Warning. Critical ${data.incident.severity} Outage detected on ${data.incident.service}.`);
=======
        setAllDebates(data.debates || []);
        setGuardrails(data.guardrailProposals || []);
        setHistoricalMatch(data.historicalMatch || null);
        setActiveTab('swarm');
        streamDebatesSequentially(data.debates || []);
        speakMissionAlert(`Warning. High severity outage detected on ${data.incident.service}. Ingesting telemetry.`);
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const handleExecuteGuardrail = async (proposal: GuardrailProposal, index: number) => {
    if (!incident) return;
    try {
      const res = await fetch(`/api/incidents/${incident.id}/guardrails/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionName: proposal.actionName,
          command: proposal.command,
          safetyTier: proposal.safetyTier
=======
  // Run Custom Playground Ingestion
  const handleCustomPlaygroundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFinancialLoss(0);
    setPostMortem(null);

    try {
      const res = await fetch('/api/incidents/custom-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle,
          service: customService,
          rawLogs: customLogs,
          severity: 'P1',
          financialImpactPerMin: 26000
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
        })
      });
      const data = await res.json();
      if (data.ok) {
<<<<<<< HEAD
        const updated = [...guardrails];
        updated[index] = { ...updated[index], executed: true };
        setGuardrails(updated);
      }
    } catch (err) {
      console.error('Execution error:', err);
=======
        setIncident(data.incident);
        setAllDebates(data.debates || []);
        setGuardrails(data.guardrailProposals || []);
        setHistoricalMatch(data.historicalMatch || null);
        setActiveTab('swarm');
        streamDebatesSequentially(data.debates || []);
        speakMissionAlert(`Custom incident ingested on ${customService}. Adversarial debate armed.`);
      }
    } catch (err) {
      console.error('Custom ingest failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Evaluate Interactive Terminal Command
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    setTerminalInput('');

    try {
      const res = await fetch('/api/incidents/eval-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();

      setTerminalLogs((prev) => [
        ...prev,
        {
          command: cmd,
          output: data.allowed
            ? `[ALLOWED - TIER ${data.safetyTier}]: ${data.reason} -> ${data.dryRunPrediction}`
            : `[HARD-BLOCKED - TIER RED]: ${data.reason}`,
          tier: data.safetyTier,
          allowed: data.allowed,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err) {
      console.error('Command eval failed:', err);
    }
  };

  const handleExecuteGuardrail = async (proposal: GuardrailProposal, index: number) => {
    if (!incident) return;
    try {
      const res = await fetch(`/api/incidents/${incident.id}/guardrail-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: proposal.command,
          approveOverride: proposal.safetyTier === 'YELLOW'
        })
      });
      const data = await res.json();
      if (data.ok) {
        setGuardrails((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], executed: true };
          return next;
        });
        setTerminalLogs((prev) => [
          ...prev,
          {
            command: proposal.command,
            output: `[EXECUTED WITH SIGN-OFF]: ${data.output}`,
            tier: proposal.safetyTier,
            allowed: true,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        speakMissionAlert('Remediation action executed safely.');
      } else if (data.blocked) {
        setTerminalLogs((prev) => [
          ...prev,
          {
            command: proposal.command,
            output: `[POLICY BLOCK]: ${data.error}`,
            tier: 'RED',
            allowed: false,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }
    } catch (err) {
      console.error('Guardrail execution failed:', err);
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
    }
  };

  const handleResolveIncident = async () => {
    if (!incident) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/incidents/${incident.id}/resolve`, {
<<<<<<< HEAD
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionSummary: 'Applied deterministic connection pool ceiling and query kill.',
          actionTaken: 'Executed Tier 1 Green Guardrail'
        })
      });
      const data = await res.json();
      if (data.ok) {
        setIncident({ ...incident, status: 'RESOLVED' });
        setPostMortem(data.postMortem);
        setActiveTab('postmortem');
        speakAlert(`Incident resolved. MTTR ${data.incident.mttr_minutes || 18} minutes. Blameless post-mortem ready.`);
      }
    } catch (err) {
      console.error('Resolve error:', err);
=======
        method: 'POST'
      });
      const data = await res.json();
      if (data.ok) {
        setIncident(data.incident);
        setPostMortem(data.postMortem);
        setActiveTab('postmortem');
        speakMissionAlert('Incident successfully resolved. Post-mortem report generated.');
      }
    } catch (err) {
      console.error('Failed to resolve incident:', err);
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const triggerVisionUpload = () => {
    setVisionData({
      source: 'grafana-dashboard-screenshot.png',
      ocrExtractedMetrics: {
        activeConnections: '100 / 100 max',
        p99Latency: '4,820 ms',
        dbCpuUtilization: '98.4%',
        activeLocks: '42 blocking threads'
      },
      visionAnomalyAnalysis:
        'Vision OCR identifies steep inflection point at 10:14:30 UTC. Database active connections hit horizontal ceiling corresponding exactly to connection pool exhaustion.'
    });
  };


  // COMPLETE LIST OF ALL PAGES FOR THE OVERVIEW DASHBOARD DROPDOWN
  const allPages = [
    {
      id: 'telemetry',
      title: 'Live Telemetry Stream',
      category: 'Primary Cockpit',
      description: 'P99 latency cliff drop, request throughput & connection pool saturation',
      icon: Activity,
      badge: 'Live APM',
      badgeColor: 'violet',
      action: () => {
        setActiveTab('telemetry');
        setIsOverviewDropdownOpen(false);
      }
    },
    {
      id: 'swarm',
      title: 'Adversarial AI Debate Swarm',
      category: 'Autonomous Swarm',
      description: 'Detective vs. Skeptic 4-round hypothesis cross-falsification',
      icon: Sparkles,
      badge: `${debates.length} Rounds`,
      badgeColor: 'violet',
      action: () => {
        setActiveTab('swarm');
        setIsOverviewDropdownOpen(false);
      }
    },
    {
      id: 'topology',
      title: 'Blast Radius & Topology',
      category: 'Blast Radius Analysis',
      description: 'Interactive microservice flow, node inspection & radial progress ring',
      icon: Layers,
      badge: `${incident?.blast_radius_index || 88}% Blast`,
      badgeColor: 'rose',
      action: () => {
        setActiveTab('topology');
        setIsOverviewDropdownOpen(false);
      }
    },
    {
      id: 'guardrails',
      title: 'Production Guardrails Sandbox',
      category: 'Zero-Trust Safety',
      description: '3-Tier deterministic policy matrix blocking destructive commands',
      icon: Lock,
      badge: '3 Safety Tiers',
      badgeColor: 'amber',
      action: () => {
        setActiveTab('guardrails');
        setIsOverviewDropdownOpen(false);
      }
    },
    {
      id: 'entropy',
      title: 'Shannon Noise Sifter',
      category: 'Data Science & Math',
      description: 'Mathematical entropy filter compressing 482 raw alerts into 3 signals',
      icon: Activity,
      badge: `${incident?.noise_reduction_pct || 99.4}% Sifted`,
      badgeColor: 'emerald',
      action: () => {
        setActiveTab('entropy');
        setIsOverviewDropdownOpen(false);
      }
    },
    {
      id: 'dejavu',
      title: 'Déjà-Vu Historical Memory',
      category: 'RAG Knowledge Graph',
      description: 'High-dimensional vector match & historical disaster trap warnings',
      icon: Brain,
      badge: `${historicalMatch?.similarityPct || 94}% Vector Match`,
      badgeColor: 'purple',
      action: () => {
        setActiveTab('dejavu');
        setIsOverviewDropdownOpen(false);
      }
    },
    {
      id: 'vision',
      title: 'Vision AI Telemetry Lens',
      category: 'Computer Vision OCR',
      description: 'Dashboard screenshot OCR analysis & curve inflection point detection',
      icon: Eye,
      badge: 'Vision OCR',
      badgeColor: 'indigo',
      action: () => {
        if (!visionData) triggerVisionUpload();
        setActiveTab('vision');
        setIsOverviewDropdownOpen(false);
      }
    },
    {
      id: 'postmortem',
      title: 'Post-Mortem & GitHub PR',
      category: 'Incident Resolution',
      description: 'Blameless PIR generator and automated fix Pull Request',
      icon: FileText,
      badge: postMortem ? 'PIR Ready' : 'Pending',
      badgeColor: 'emerald',
      action: () => {
        if (postMortem) {
          setActiveTab('postmortem');
        } else {
          handleResolveIncident();
        }
        setIsOverviewDropdownOpen(false);
      }
    },
    {
      id: 'widgets',
      title: 'Interactive Widget Studio',
      category: 'Generative UI',
      description: 'Standalone interactive telemetry, topology & blast gauge widgets',
      icon: Sliders,
      badge: '4 Templates',
      badgeColor: 'violet',
      action: () => {
        setActiveTab('widgets');
        setIsOverviewDropdownOpen(false);
      }
    },
    {
      id: 'terminal',
      title: 'SRE Interactive Command Sandbox',
      category: 'Zero-Trust Safety',
      description: 'Try-to-break-it terminal evaluating Tier 1/2/3 commands in real time',
      icon: Terminal,
      badge: 'Sandbox',
      badgeColor: 'amber',
      action: () => {
        setActiveTab('terminal');
        setIsOverviewDropdownOpen(false);
      }
    },
    {
      id: 'custom',
      title: 'Custom Incident Ingest Playground',
      category: 'Ingestion Engine',
      description: 'Input raw server stack traces or microservice error logs into swarm',
      icon: PlusCircle,
      badge: 'Log Ingest',
      badgeColor: 'violet',
      action: () => {
        setActiveTab('custom');
        setIsOverviewDropdownOpen(false);
      }
    },
    {
      id: 'overview-dock',
      title: 'Overview Side Panel',
      category: 'Cockpit Layout',
      description: 'Toggle or inspect executive summary (Fixed to Right Side)',
      icon: LayoutDashboard,
      badge: overviewCollapsed ? 'Collapsed' : 'Right Panel',
      badgeColor: 'slate',
      action: () => {
        setOverviewCollapsed(!overviewCollapsed);
        setIsOverviewDropdownOpen(false);
      }
    },
    {
      id: 'landing',
      title: 'Return to Landing Page',
      category: 'Navigation',
      description: 'Launch page with 4 simulated outage scenario cards',
      icon: ArrowLeft,
      badge: 'Home',
      badgeColor: 'slate',
      action: () => {
        if (onBackToLanding) onBackToLanding();
        setIsOverviewDropdownOpen(false);
      }
    }
  ];

  const filteredPages = allPages.filter(
    (p) =>
      p.title.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  // INTERACTIVE SRE TERMINAL SANDBOX COMPONENT ("TRY-TO-BREAK-IT")
  const renderTerminalSandbox = () => (
    <div className="bg-[#0b0f19] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl space-y-0">
      {/* TERMINAL TOP BAR */}
      <div className="px-4 py-3 bg-[#0e1320] border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <Terminal className="h-4 w-4 text-violet-400" />
          <span className="font-mono text-xs font-bold text-slate-200 tracking-wide">
            sre@chetak-production-sandbox: ~ (Zero-Trust Guardrail Filter)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ONLINE · DRY-RUN MODE
          </span>
          <button
            onClick={() => setTerminalLogs([])}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* QUICK-TEST PILLS */}
      <div className="p-3 bg-black/40 border-b border-white/[0.04] flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono uppercase text-slate-500 mr-1 flex items-center">
          <Zap className="h-3 w-3 mr-1 text-violet-400" /> Quick-Test:
        </span>
        {[
          { cmd: 'rm -rf /var/log', label: 'rm -rf /', tier: 'RED' },
          { cmd: 'DROP DATABASE production;', label: 'DROP DATABASE', tier: 'RED' },
          { cmd: 'kill -9 1', label: 'kill -9 1', tier: 'RED' },
          { cmd: 'kubectl scale deployment auth --replicas=0', label: 'kubectl scale', tier: 'YELLOW' },
          { cmd: 'systemctl restart nginx', label: 'systemctl restart', tier: 'YELLOW' },
          { cmd: 'curl -s http://localhost:8080/healthz', label: 'curl /healthz', tier: 'GREEN' },
          { cmd: "SELECT * FROM pg_stat_activity WHERE state = 'active'", label: 'SELECT pg_stat', tier: 'GREEN' }
        ].map((pill, pidx) => (
          <button
            key={pidx}
            onClick={() => {
              setTerminalInput(pill.cmd);
              handleEvalTerminalCommand(pill.cmd);
            }}
            className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition flex items-center space-x-1 ${
              pill.tier === 'RED'
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                : pill.tier === 'YELLOW'
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <span className="font-bold">[{pill.tier}]</span>
            <span>{pill.label}</span>
          </button>
        ))}
      </div>

      {/* TERMINAL LOG OUTPUT WINDOW */}
      <div className="p-4 font-mono text-xs max-h-[360px] overflow-y-auto space-y-3 bg-[#07090e]/95">
        {terminalLogs.length === 0 ? (
          <div className="text-slate-500 italic py-6 text-center text-xs">
            Type any command below (e.g. `rm -rf /` or `kubectl scale`) to test the deterministic safety matrix in real time.
          </div>
        ) : (
          terminalLogs.map((log) => (
            <div key={log.id} className="space-y-1 border-b border-white/[0.04] pb-2.5">
              <div className="flex items-center space-x-2 text-slate-300">
                <span className="text-violet-400 font-bold">$</span>
                <span className="text-white font-semibold">{log.command}</span>
                <span className="text-[10px] text-slate-600 ml-auto">{log.timestamp}</span>
              </div>

              <div
                className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
                  log.safetyTier === 'RED'
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : log.safetyTier === 'YELLOW'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                }`}
              >
                <div className="font-bold flex items-center space-x-1.5 mb-1">
                  {log.safetyTier === 'RED' && <XCircle className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />}
                  {log.safetyTier === 'YELLOW' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                  {log.safetyTier === 'GREEN' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                  <span>
                    {log.safetyTier === 'RED' && '[HARD-BLOCKED - TIER RED]: Violates Production Safety Policy'}
                    {log.safetyTier === 'YELLOW' && '[AMBER - REQUIRES 2-FACTOR SIGN-OFF]: Controlled State Modification'}
                    {log.safetyTier === 'GREEN' && '[ALLOWED - TIER GREEN]: Safe Read-Only Diagnostic Probe'}
                  </span>
                </div>
                <div className="text-slate-300 text-[11px]">{log.reason}</div>
                <div className="text-slate-400 text-[10px] mt-1 font-mono italic">
                  ↳ Prediction: {log.dryRunPrediction}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* TERMINAL INPUT BOX */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleEvalTerminalCommand();
        }}
        className="p-3 bg-[#0d121f] border-t border-white/[0.06] flex items-center space-x-2"
      >
        <span className="text-violet-400 font-mono text-sm font-bold pl-2">$</span>
        <input
          type="text"
          value={terminalInput}
          onChange={(e) => setTerminalInput(e.target.value)}
          placeholder="Type command (e.g. rm -rf / or SELECT * FROM pg_stat_activity)..."
          className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-slate-600 px-2 py-1"
          disabled={terminalEvaluating}
        />
        <button
          type="submit"
          disabled={terminalEvaluating || !terminalInput.trim()}
          className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-mono text-xs font-semibold flex items-center space-x-1.5 transition"
        >
          {terminalEvaluating ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          <span>Evaluate</span>
        </button>
      </form>
    </div>
  );

  // OVERVIEW DASHBOARD SIDEBAR COMPONENT (PERMANENTLY FIXED TO RIGHT SIDE)
  const renderOverviewSidePanel = () => {
    if (overviewCollapsed) {
      return (
        <aside className="w-12 bg-[#0c101a] border-l border-white/[0.06] flex flex-col items-center py-4 space-y-4 flex-shrink-0 z-20">
          <button
            onClick={() => setOverviewCollapsed(false)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-violet-400 hover:text-white transition"
            title="Expand Overview Dashboard"
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
          <div className="writing-vertical text-[10px] font-mono tracking-widest text-slate-500 uppercase mt-4">
            Overview
          </div>
        </aside>
      );
    }

    return (
      <aside className="w-80 md:w-88 lg:w-96 bg-[#0a0e18] border-l border-white/[0.08] flex flex-col flex-shrink-0 overflow-y-auto z-20 shadow-2xl">
        {/* OVERVIEW PANEL TOP BAR */}
        <div className="p-4 border-b border-white/[0.06] bg-[#0c101a]/90 flex items-center justify-between sticky top-0 backdrop-blur-md z-10">
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="h-4 w-4 text-violet-400" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Incident Overview
            </span>
          </div>

          {/* COLLAPSE BUTTON ONLY */}
          <button
            onClick={() => setOverviewCollapsed(true)}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition"
            title="Minimize Overview Dashboard"
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </button>
        </div>

        {incident && (
          <div className="p-5 space-y-5 text-xs">
            {/* 1. INCIDENT IDENTITY CARD */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    incident.severity.includes('P1')
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {incident.severity}
                </span>
                <span className="font-mono text-[10px] text-slate-400">{incident.tracking_id}</span>
              </div>
              <h2 className="font-bold text-white text-sm tracking-tight leading-snug">{incident.title}</h2>
              <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3">{incident.summary}</p>
              <div className="pt-1 flex items-center space-x-2 text-[11px] font-mono text-violet-300">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold">{incident.service}</span>
              </div>
            </div>

            {/* 2. REAL-TIME FINANCIAL BLEED TICKER */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/25 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="flex items-center space-x-1.5">
                  <Flame className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                  <span>Financial Bleed Ticker</span>
                </span>
                <span className="font-mono text-slate-500">₹{incident.financial_impact_per_min}/min</span>
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400 tracking-tight">
                ₹{(financialLoss || incident.financial_impact_per_min).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500">Live calculating downtime revenue loss</div>
            </div>

            {/* 3. CORE VITALS 3-TILE GRID */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[9px] uppercase font-mono text-slate-500">Noise Sift</div>
                <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                  {incident.noise_reduction_pct}%
                </div>
                <div className="text-[9px] text-slate-500">{incident.raw_alert_count} → {incident.correlated_signal_count}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[9px] uppercase font-mono text-slate-500">Blast Radius</div>
                <div className="text-sm font-bold font-mono text-violet-300 mt-0.5">
                  {incident.blast_radius_index}%
                </div>
                <div className="text-[9px] text-slate-500 truncate">{incident.patient_zero_service}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[9px] uppercase font-mono text-slate-500">Consensus</div>
                <div className="text-sm font-bold font-mono text-indigo-300 mt-0.5">
                  {Math.round(incident.confidence_score * 100)}%
                </div>
                <div className="text-[9px] text-slate-500">4 Agents</div>
              </div>
            </div>

            {/* 4. AI SWARM ROOT CAUSE VERDICT */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-violet-500/20 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04]">
                <span className="font-semibold text-white flex items-center text-[11px]">
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-violet-400" />
                  AI Swarm Consensus
                </span>
                <button
                  onClick={() => setActiveTab('swarm')}
                  className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center transition"
                >
                  View Swarm <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
                </button>
              </div>

              {debates[0] && (
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  <span className="font-medium text-violet-200">Verified Root Cause: </span>
                  {debates[0].statement}
                </div>
              )}
            </div>

            {/* 5. TOP RECOMMENDED ZERO-TRUST ACTION */}
            {guardrails[0] && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-emerald-500/25 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04]">
                  <span className="font-semibold text-white flex items-center text-[11px]">
                    <Lock className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                    Recommended Action
                  </span>
                  <button
                    onClick={() => setActiveTab('guardrails')}
                    className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center transition"
                  >
                    All 3 Tiers <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="font-semibold text-slate-200 text-xs">{guardrails[0].actionName}</div>
                  <div className="p-2 bg-black/40 rounded font-mono text-[10px] text-slate-300 truncate">
                    {guardrails[0].command}
                  </div>
                </div>

                <div>
                  {guardrails[0].executed ? (
                    <span className="w-full py-1.5 bg-emerald-500/15 text-emerald-300 rounded-lg font-mono text-[10px] font-semibold flex items-center justify-center border border-emerald-500/25">
                      <Check className="h-3 w-3 mr-1" /> EXECUTED SUCCESSFULLY
                    </span>
                  ) : (
                    <button
                      onClick={() => handleExecuteGuardrail(guardrails[0], 0)}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-1 shadow-md shadow-emerald-600/20"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Execute Safe Guardrail Probe</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 6. FAST TAB JUMP SHORTCUTS */}
            <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
              <div className="text-[10px] uppercase font-mono text-slate-500 mb-2">Deep-Dive Workspaces</div>
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition flex items-center justify-between text-xs ${
                  activeTab === 'telemetry' ? 'bg-violet-600/20 text-violet-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Telemetry Cliff Drop</span>
                </span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('topology')}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition flex items-center justify-between text-xs ${
                  activeTab === 'topology' ? 'bg-violet-600/20 text-violet-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Blast Radius & Topology</span>
                </span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('entropy')}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition flex items-center justify-between text-xs ${
                  activeTab === 'entropy' ? 'bg-violet-600/20 text-violet-300 font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Shannon Noise Sifter</span>
                </span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </button>
            </div>
          </div>
        )}
      </aside>
    );
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-violet-500 selection:text-white relative">
      {/* 1. TOP GLOBAL APP HEADER */}
      <header className="h-16 bg-[#0c101a]/90 backdrop-blur-2xl border-b border-white/[0.06] px-5 flex items-center justify-between flex-shrink-0 z-30">
        {/* LEFT: BRAND & BACK BUTTON */}
        <div className="flex items-center space-x-3">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.06] text-xs font-medium transition"
              title="Return to Landing Page"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Home</span>
            </button>
          )}

          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-600/30">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-xs tracking-wider text-white">CHETAK</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-500/15 text-violet-300 border border-violet-500/25">
              PNG2
            </span>
          </div>

          {incident && (
            <div className="hidden md:flex items-center space-x-2 text-xs border-l border-white/[0.08] pl-3">
              <span className="font-mono text-slate-400">{incident.tracking_id}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-violet-300 font-semibold">{incident.service}</span>
              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  incident.severity.includes('P1')
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                }`}
              >
                {incident.severity}
=======
  const handleDownloadPostMortem = () => {
    if (!postMortem) return;
    const blob = new Blob([postMortem.markdownReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${incident?.tracking_id || 'INC-2026'}_BLAMELESS_POST_MORTEM.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreviewImage(base64);
      setVisionMode(true);
      setLoading(true);

      try {
        const res = await fetch('/api/incidents/vision-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageMetadata: { name: file.name, size: file.size, type: file.type },
            imageBase64: base64
          })
        });
        const data = await res.json();
        if (data.ok) {
          setVisionData(data.vision);
          speakMissionAlert('Vision telemetry parsed. Anomaly detected in visual chart.');
        }
      } catch (err) {
        console.error('Vision AI parse failed:', err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    document.getElementById('vision-file-input')?.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* 1. TOP MISSION-CONTROL COMMAND HEADER */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3 sticky top-0 z-50 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold text-white tracking-wider">CHETAK</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-semibold">
                  PNG2 • SRE COMMANDER
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-semibold">
                  GUARDRAILS ARMED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Detect. Alert. Act. — Autonomous Advisory Incident Co-Pilot</p>
            </div>
          </div>

          {/* REAL-TIME STAT CHIPS */}
          {incident && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-red-500/30 flex items-center space-x-2 shadow-inner">
                <Flame className="h-4 w-4 text-red-400 animate-pulse" />
                <div>
                  <span className="text-slate-400 text-[10px]">DOWNTIME LOSS:</span>
                  <span className="ml-1 text-red-400 font-bold">
                    ₹{(financialLoss || incident.financial_impact_per_min).toLocaleString('en-IN')} (₹{incident.financial_impact_per_min}/min)
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center space-x-2 shadow-inner">
                <Clock className="h-4 w-4 text-amber-400" />
                <div>
                  <span className="text-slate-400 text-[10px]">SLO BREACH COUNTDOWN:</span>
                  <span className="ml-1 text-amber-400 font-bold">18m : 42s</span>
                </div>
              </div>

              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-1.5 rounded-lg border transition ${
                  audioEnabled
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
                title="Toggle Voice Alerts"
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <span
                className={`px-3 py-1 rounded-full font-bold text-xs ${
                  incident.status === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                }`}
              >
                {incident.status}
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
              </span>
            </div>
          )}
        </div>
<<<<<<< HEAD

        {/* CENTER / SEPARATE DEDICATED PLACE: PROMINENT OVERVIEW DASHBOARD & ALL PAGES DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOverviewDropdownOpen(!isOverviewDropdownOpen)}
            className={`px-5 py-2.5 rounded-xl border transition-all duration-200 flex items-center space-x-3 text-sm font-bold shadow-md hover:scale-[1.02] ${
              isOverviewDropdownOpen
                ? 'bg-violet-600 text-white border-violet-500 shadow-violet-600/40 ring-2 ring-violet-500/25'
                : 'bg-violet-600/15 hover:bg-violet-600/25 text-violet-200 hover:text-white border-violet-500/35 hover:border-violet-500/60'
            }`}
            title="Open Overview Dashboard & All Pages Menu"
          >
            <LayoutDashboard className="h-4.5 w-4.5 text-violet-400" />
            <span className="tracking-wide">Overview Dashboard</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/25 text-violet-300 border border-violet-500/35 font-bold">
              All Pages
            </span>
            <ChevronDown
              className={`h-4 w-4 text-violet-300 transition-transform duration-200 ${
                isOverviewDropdownOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* THE ALL-PAGES DROPDOWN MENU */}
          {isOverviewDropdownOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-96 sm:w-[420px] max-h-[80vh] overflow-y-auto bg-[#0d121f]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn space-y-2">
              {/* DROPDOWN HEADER */}
              <div className="px-3 pt-2 pb-1.5 flex items-center justify-between border-b border-white/[0.06]">
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <LayoutDashboard className="h-3.5 w-3.5 text-violet-400" />
                    <span>All Incident Workspaces & Pages</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Select any view to navigate directly
                  </p>
                </div>
                <button
                  onClick={() => setIsOverviewDropdownOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* QUICK FILTER SEARCH INPUT */}
              <div className="px-2 pt-1">
                <div className="flex items-center space-x-2 bg-black/40 border border-white/[0.06] rounded-xl px-2.5 py-1.5 text-xs">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={dropdownSearch}
                    onChange={(e) => setDropdownSearch(e.target.value)}
                    placeholder="Filter pages..."
                    className="bg-transparent text-white placeholder-slate-500 focus:outline-none w-full text-xs"
                    autoFocus
                  />
                  {dropdownSearch && (
                    <button onClick={() => setDropdownSearch('')} className="text-slate-500 hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* PAGES LIST */}
              <div className="space-y-1 pt-1 max-h-[60vh] overflow-y-auto">
                {filteredPages.map((page) => {
                  const Icon = page.icon;
                  const isActive = activeTab === page.id;
                  return (
                    <button
                      key={page.id}
                      onClick={page.action}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between group ${
                        isActive
                          ? 'bg-violet-600/20 border border-violet-500/30 text-white'
                          : 'hover:bg-white/[0.04] text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3 overflow-hidden pr-2">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isActive
                              ? 'bg-violet-600 text-white'
                              : 'bg-white/[0.04] group-hover:bg-violet-600/20 text-slate-400 group-hover:text-violet-300'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs truncate">{page.title}</span>
                            {isActive && <Check className="h-3 w-3 text-violet-400 flex-shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {page.description}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          page.badgeColor === 'rose'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                            : page.badgeColor === 'emerald'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : page.badgeColor === 'amber'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                            : page.badgeColor === 'purple'
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                            : 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
                        }`}
                      >
                        {page.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
=======
      </header>

      {/* 2. SCENARIO LAUNCHER & ACTION TOOLBAR */}
      <section className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center mr-1">
            <Zap className="h-3.5 w-3.5 mr-1 text-cyan-400" /> Simulations:
          </span>
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => simulateScenario(sc.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                selectedScenarioId === sc.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-semibold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              <span>{sc.title.split(' ')[0]} {sc.title.split(' ')[1]}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-950 text-red-400 font-mono">{sc.severity}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2.5">
          <input
            id="vision-file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            onClick={triggerFileInput}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/25 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/35 transition flex items-center space-x-1.5 cursor-pointer shadow-sm font-medium"
          >
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            <span>Upload Chart (Vision AI)</span>
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition flex items-center space-x-1.5 font-medium ${
              activeTab === 'playground'
                ? 'bg-purple-500/25 text-purple-300 border-purple-500/50 font-semibold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border-slate-700/50'
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5 text-purple-400" />
            <span>Custom Log Playground</span>
          </button>

          {incident && incident.status !== 'RESOLVED' && (
            <button
              onClick={handleResolveIncident}
              className="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Resolve & Generate Post-Mortem</span>
            </button>
          )}

          {postMortem && (
            <button
              onClick={handleDownloadPostMortem}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span>Download .MD</span>
            </button>
          )}
        </div>
      </section>

      {/* 3. MAIN DUAL-PANE COCKPIT */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-y-auto">
        {/* LEFT COLUMN: TELEMETRY STREAM, SHANNON ENTROPY & VISION (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* SHANNON ENTROPY NOISE FILTER CARD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white flex items-center tracking-wide uppercase">
                <Activity className="h-4 w-4 mr-2 text-cyan-400" /> Shannon Entropy Noise Sifter
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                99.4% FILTERED
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center mb-3.5">
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Raw Storm</div>
                <div className="text-base font-bold text-red-400 font-mono mt-0.5">{incident?.raw_alert_count || 482}</div>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Root Signals</div>
                <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">{incident?.correlated_signal_count || 3}</div>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Entropy H(X)</div>
                <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">1.58 bits</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mathematical Information Entropy compressed 482 redundant PagerDuty alerts into 3 independent root causes in 5 seconds.
            </p>
          </div>

          {/* VISION AI DIAGNOSTIC INGESTION CARD */}
          {visionMode && visionData && (
            <div className="bg-slate-900/90 border border-indigo-500/40 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-indigo-300 flex items-center tracking-wide uppercase">
                  <Eye className="h-4 w-4 mr-2 text-indigo-400" /> Vision AI Multi-Modal Ingest
                </h3>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-semibold">
                  96% CONFIDENCE
                </span>
              </div>

              {previewImage && (
                <div className="mb-3 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 max-h-36">
                  <img src={previewImage} alt="Uploaded Telemetry Chart" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-2.5 bg-slate-950/90 rounded-lg border border-slate-800 text-xs space-y-1.5 mb-3">
                <div className="font-semibold text-slate-200 text-[11px]">{visionData.detectedSource}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{visionData.anomalySummary}</div>
              </div>

              <div className="space-y-1.5">
                {visionData.extractedMetrics?.map((m: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-400 text-[11px]">{m.label}</span>
                    <span className="font-mono font-bold text-red-400 text-[11px]">{m.after}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HISTORICAL DEJA-VU ENGINE (INSTITUTIONAL MEMORY) */}
          {historicalMatch && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white flex items-center tracking-wide uppercase">
                  <Brain className="h-4 w-4 mr-2 text-purple-400" /> Cross-Incident Déjà-Vu Engine
                </h3>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                  {historicalMatch.similarityPct}% MATCH
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-1.5 mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 font-mono text-[11px]">{historicalMatch.incidentCode}</span>
                  <span className="text-slate-400 text-[10px]">{historicalMatch.resolvedBy}</span>
                </div>
                <div className="text-slate-300 text-[11px]">{historicalMatch.title}</div>
              </div>

              {historicalMatch.historicalTrapWarning && (
                <div className="p-2.5 bg-red-950/30 border border-red-500/30 rounded-lg text-xs text-amber-300 space-y-1">
                  <div className="font-bold text-red-400 flex items-center text-[11px]">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1 text-red-400" /> Historical Disaster Trap Warning:
                  </div>
                  <div className="italic text-[11px]">{historicalMatch.historicalTrapWarning}</div>
                </div>
              )}
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
            </div>
          )}
        </div>

<<<<<<< HEAD
        {/* RIGHT CORNER: VOICE TOGGLE + SCENARIO DROPDOWN + RESOLVE BUTTON */}
        <div className="flex items-center space-x-2.5">
          {/* NASA-STYLE MISSION CONTROL AUDIO VOICE TOGGLE */}
          <button
            onClick={() => {
              const next = !voiceAlertsEnabled;
              setVoiceAlertsEnabled(next);
              if (next) {
                speakAlert("NASA Mission Control audio voice alerts activated.");
              }
            }}
            className={`text-xs px-3 py-1.5 rounded-xl border transition flex items-center space-x-1.5 font-medium shadow-sm ${
              voiceAlertsEnabled
                ? 'bg-violet-500/15 text-violet-300 border-violet-500/35 hover:bg-violet-500/25 shadow-violet-500/15'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
            }`}
            title="Toggle NASA-Style Mission Control Audio Voice Alerts"
          >
            {voiceAlertsEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-violet-400" />
                <span className="font-semibold text-[11px]">Voice: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[11px]">Voice: OFF</span>
              </>
            )}
          </button>

          {incident && (
            <>
              {/* SCENARIO DROPDOWN AT RIGHT CORNER */}
              <div className="relative" ref={scenarioDropdownRef}>
                <button
                  onClick={() => setIsScenarioDropdownOpen(!isScenarioDropdownOpen)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition flex items-center space-x-2 font-medium shadow-sm ${
                    isScenarioDropdownOpen
                      ? 'bg-violet-600 text-white border-violet-500 shadow-violet-600/30'
                      : 'bg-white/[0.04] text-slate-200 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
                  }`}
                  title="Select Outage Scenario"
                >
                  <Zap className="h-3.5 w-3.5 text-violet-400" />
                  <span className="font-semibold truncate max-w-[130px]">
                    {selectedScenarioId.replace('SCENARIO_', '').replace(/_/g, ' ')}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                      isScenarioDropdownOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>

                {isScenarioDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-[#0d121f]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl p-2.5 z-50 animate-fadeIn space-y-1.5">
                    <div className="px-3 pt-2 pb-1.5 flex items-center justify-between border-b border-white/[0.06]">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <Zap className="h-3.5 w-3.5 text-violet-400" />
                          <span>Simulate Outage Scenario</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Switch active production incident</p>
                      </div>
                      <button
                        onClick={() => setIsScenarioDropdownOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1 pt-1">
                      {scenarios.map((sc) => {
                        const isSelected = selectedScenarioId === sc.id;
                        return (
                          <button
                            key={sc.id}
                            onClick={() => {
                              simulateScenario(sc.id);
                              setIsScenarioDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between group ${
                              isSelected
                                ? 'bg-violet-600/20 border border-violet-500/30 text-white'
                                : 'hover:bg-white/[0.04] text-slate-300 hover:text-white'
                            }`}
                          >
                            <div className="space-y-0.5 overflow-hidden pr-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-xs truncate">{sc.title}</span>
                                {isSelected && <Check className="h-3 w-3 text-violet-400 flex-shrink-0" />}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 truncate flex items-center space-x-2">
                                <span>{sc.service}</span>
                                <span>•</span>
                                <span className="text-rose-400">₹{sc.financialImpactPerMin?.toLocaleString('en-IN')}/min</span>
                              </div>
                            </div>
                            <span
                              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                sc.severity.includes('P1')
                                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                              }`}
                            >
                              {sc.severity}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* RESOLVE & PIR BUTTON */}
              {incident.status !== 'RESOLVED' ? (
                <button
                  onClick={handleResolveIncident}
                  disabled={loading}
                  className="text-xs px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition flex items-center space-x-1.5 shadow-md shadow-violet-600/25"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Resolve & PIR</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('postmortem')}
                  className="text-xs px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center space-x-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>View PIR</span>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* 2. BODY CONTAINER: MAIN WORKSPACE + OVERVIEW FIXED TO RIGHT SIDE */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* MAIN OPERATIONAL WORKSPACE (CENTER & LEFT) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#07090e]">
          {/* MAIN CONTENT WORKSPACE VIEW */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {/* VIEW 1: TELEMETRY STREAM & CLIFF DROP */}
            {activeTab === 'telemetry' && (
              <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
                <TelemetryChartWidget scenarioId={selectedScenarioId} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {incident && (
                    <BlastRadiusGaugeWidget
                      blastRadiusIndex={incident.blast_radius_index}
                      financialImpactPerMin={incident.financial_impact_per_min}
                      financialLossTotal={financialLoss || incident.financial_impact_per_min}
                    />
                  )}
                  {incident && (
                    <EntropyFunnelWidget
                      rawAlertCount={incident.raw_alert_count}
                      correlatedSignals={incident.correlated_signal_count}
                      noiseReductionPct={incident.noise_reduction_pct}
                    />
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: ADVERSARIAL SWARM DEBATE WITH SEQUENTIAL STREAMING ANIMATION */}
            {activeTab === 'swarm' && (
              <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-7 shadow-xl space-y-5">
                  <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center">
                        <Sparkles className="h-5 w-5 mr-2 text-violet-400" /> Adversarial AI Debate (Detective vs. Skeptic)
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Sequential cross-falsification eliminating hallucinations against metric timestamps (1.1s streaming intervals)
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isDebateStreaming && (
                        <button
                          onClick={() => {
                            setVisibleDebatesCount(debates.length);
                            setIsDebateStreaming(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-mono flex items-center space-x-1.5 transition"
                          title="Fast-Forward Debate Streaming"
                        >
                          <Play className="h-3 w-3" />
                          <span>Fast-Forward</span>
                        </button>
                      )}

                      {visibleDebatesCount >= debates.length ? (
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/15 px-3.5 py-1.5 rounded-full border border-emerald-500/25 font-semibold flex items-center space-x-1.5 shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Consensus: 96% Bayesian Confidence</span>
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/15 px-3.5 py-1.5 rounded-full border border-amber-500/25 font-semibold flex items-center space-x-1.5 animate-pulse">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Debate in Progress (Round {visibleDebatesCount} of {debates.length})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* STREAMING DEBATE CARDS */}
                  <div className="space-y-4 pt-1">
                    {debates.slice(0, visibleDebatesCount).map((d, idx) => (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl border text-xs leading-relaxed transition shadow-sm animate-fadeIn ${
                          d.agentRole === 'DETECTIVE'
                            ? 'bg-white/[0.02] border-violet-500/30 text-violet-100 ring-1 ring-violet-500/10'
                            : d.agentRole === 'SKEPTIC'
                            ? 'bg-rose-950/20 border-rose-500/50 text-rose-100 ring-2 ring-rose-500/30'
                            : d.agentRole === 'MEMORY'
                            ? 'bg-purple-950/20 border-purple-500/35 text-purple-100'
                            : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100 font-medium ring-1 ring-emerald-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center text-sm font-bold">
                              {d.agentRole === 'DETECTIVE' && <Search className="h-4 w-4 mr-2 text-violet-400" />}
                              {d.agentRole === 'SKEPTIC' && <AlertTriangle className="h-4 w-4 mr-2 text-rose-400" />}
                              {d.agentRole === 'MEMORY' && <Brain className="h-4 w-4 mr-2 text-purple-400" />}
                              {d.agentRole === 'COMMANDER' && <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" />}
                              {d.agentName}
                            </span>
                            {d.agentRole === 'SKEPTIC' && (
                              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                                Objection Raised
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 bg-black/40 px-2.5 py-1 rounded-full border border-white/[0.06]">
                            Round {d.round} · {Math.round(d.confidence * 100)}%
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{d.statement}</p>
                        {d.trapWarning && (
                          <div className="mt-3 p-3.5 bg-rose-900/30 rounded-xl border border-rose-500/40 text-rose-200 font-mono text-xs">
                            <span className="font-bold">Historical Trap Warning: </span>
                            {d.trapWarning}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* PULSING TYPING INDICATOR WHEN STREAMING */}
                    {isDebateStreaming && (
                      <div className="p-4 rounded-2xl bg-violet-950/20 border border-violet-500/30 text-violet-200 flex items-center justify-between animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping"></span>
                            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping delay-100"></span>
                            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping delay-200"></span>
                          </div>
                          <span className="text-xs font-mono text-violet-300">
                            Swarm agents actively debating timestamps and metrics...
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">1.1s Stagger Interval</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: BLAST RADIUS & TOPOLOGY */}
            {activeTab === 'topology' && incident && (
              <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
                <TopologyGraphWidget />
                <BlastRadiusGaugeWidget
                  blastRadiusIndex={incident.blast_radius_index}
                  financialImpactPerMin={incident.financial_impact_per_min}
                  financialLossTotal={financialLoss || incident.financial_impact_per_min}
                />
              </div>
            )}

            {/* VIEW 4: GUARDRAILS SANDBOX */}
            {activeTab === 'guardrails' && (
              <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-7 shadow-xl space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center">
                        <Lock className="h-5 w-5 mr-2 text-violet-400" /> Production Dry-Run Guardrail Sandbox
                      </h2>
                      <p className="text-xs text-slate-400">
                        Zero-Trust deterministic policy filter preventing destructive command execution
                      </p>
                    </div>
                    <span className="text-xs font-mono text-violet-300 bg-violet-500/15 px-3 py-1.5 rounded-full border border-violet-500/25 font-semibold">
                      3-Tier Matrix
                    </span>
                  </div>

                  <div className="space-y-4">
                    {guardrails.map((g, idx) => (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl border text-xs flex flex-col justify-between space-y-3 ${
                          g.safetyTier === 'GREEN'
                            ? 'bg-white/[0.02] border-emerald-500/30'
                            : g.safetyTier === 'YELLOW'
                            ? 'bg-white/[0.02] border-amber-500/30'
                            : 'bg-rose-950/20 border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                g.safetyTier === 'GREEN'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : g.safetyTier === 'YELLOW'
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              TIER: {g.safetyTier}
                            </span>
                            <span className="font-semibold text-white text-sm">{g.actionName}</span>
                          </div>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {g.safetyTier === 'RED' ? 'Hard Blocked' : g.requiresApproval ? 'Dual Approval' : 'Auto Allowed'}
                          </span>
                        </div>

                        <div className="p-3 bg-black/40 rounded-xl font-mono text-slate-300 text-xs border border-white/[0.05]">
                          {g.command}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <p className="text-slate-400 text-xs max-w-xl">{g.dryRunPrediction}</p>
                          <div>
                            {g.safetyTier === 'RED' ? (
                              <span className="px-3 py-1.5 bg-rose-500/15 text-rose-300 rounded-xl font-mono font-semibold border border-rose-500/25">
                                BLOCKED BY GUARDRAIL
                              </span>
                            ) : g.executed ? (
                              <span className="px-3 py-1.5 bg-emerald-500/15 text-emerald-300 rounded-xl font-mono font-semibold flex items-center border border-emerald-500/25">
                                <Check className="h-3.5 w-3.5 mr-1" /> EXECUTED
                              </span>
                            ) : (
                              <button
                                onClick={() => handleExecuteGuardrail(g, idx)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                                  g.safetyTier === 'GREEN'
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                                    : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                                }`}
                              >
                                {g.safetyTier === 'YELLOW' ? 'Sign-off & Run' : 'Execute Probe'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* EMBEDDED INTERACTIVE SRE TERMINAL SANDBOX ("TRY-TO-BREAK-IT") */}
                  <div className="pt-6 border-t border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center">
                          <Terminal className="h-4 w-4 mr-2 text-violet-400" />
                          Interactive SRE Command Sandbox ("Try-to-Break-It")
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Type real destructive commands (e.g. `rm -rf /` or `DROP DATABASE`) or diagnostic probes to test the zero-trust guardrail filter
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 font-bold">
                        Feature #1 Sandbox
                      </span>
                    </div>

                    {renderTerminalSandbox()}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: SHANNON NOISE SIFTER */}
            {activeTab === 'entropy' && incident && (
              <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
                <EntropyFunnelWidget
                  rawAlertCount={incident.raw_alert_count}
                  correlatedSignals={incident.correlated_signal_count}
                  noiseReductionPct={incident.noise_reduction_pct}
                />
              </div>
            )}

            {/* VIEW 6: DEJA-VU MEMORY */}
            {activeTab === 'dejavu' && (
              <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-7 shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-violet-400" /> Déjà-Vu Historical Incident Memory (RAG)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Retrieving past outage playbooks and anti-pattern warnings via high-dimensional vector embeddings
                      </p>
                    </div>
                    {historicalMatch && (
                      <span className="text-xs font-mono text-purple-300 bg-purple-500/15 px-3 py-1.5 rounded-full border border-purple-500/25 font-semibold">
                        {historicalMatch.similarityPct}% Vector Match
                      </span>
                    )}
                  </div>

                  {historicalMatch ? (
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-white/[0.02] border border-purple-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white text-sm">
                            Matched Outage: {historicalMatch.matchedIncidentId} ({historicalMatch.title})
                          </span>
                          <span className="font-mono text-xs text-slate-400">Resolved in {historicalMatch.pastMttrMinutes}m</span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">{historicalMatch.lessonLearned}</p>

                        <div className="p-4 bg-rose-950/20 border border-rose-500/25 rounded-xl text-xs text-rose-200">
                          <div className="font-semibold text-rose-300 flex items-center mb-1">
                            <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-rose-400" /> Past Mistake / Disaster Anti-Pattern:
                          </div>
                          <p className="italic text-slate-300">{historicalMatch.historicalTrapWarning}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No historical matches loaded.</p>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 7: VISION AI MULTI-MODAL OCR LENS (FEATURE #5) */}
            {activeTab === 'vision' && (
              <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-7 shadow-xl space-y-6">
                  <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center">
                        <Eye className="h-5 w-5 mr-2 text-indigo-400" /> Vision AI Multi-Modal Telemetry Lens
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ingest screenshots of Grafana / Datadog APM dashboards to automatically detect anomaly cliff drops & OCR error logs
                      </p>
                    </div>

                    {/* HIDDEN FILE INPUT & UPLOAD TRIGGER */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleVisionFileChange}
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={visionUploading}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/25"
                      >
                        {visionUploading ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        <span>Upload Chart Screenshot</span>
                      </button>
                      <button
                        onClick={triggerVisionUpload}
                        className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold border border-white/[0.06] transition"
                      >
                        Sample Chart
                      </button>
                    </div>
                  </div>

                  {/* LIVE IMAGE PREVIEW (IF UPLOADED) */}
                  {imagePreviewUrl && (
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="font-semibold flex items-center">
                          <ImageIcon className="h-3.5 w-3.5 mr-1.5 text-indigo-400" /> Live Ingested Screenshot Preview
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                          OCR Processed
                        </span>
                      </div>
                      <div className="max-h-64 overflow-hidden rounded-xl border border-white/[0.06] flex items-center justify-center bg-black/60">
                        <img
                          src={imagePreviewUrl}
                          alt="Dashboard Telemetry Preview"
                          className="object-contain max-h-64 w-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* VISION PARSE RESULTS */}
                  {visionData && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-white/[0.02] border border-indigo-500/30 space-y-4 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-white text-sm">
                            Detected Source: <span className="text-indigo-300">{visionData.detectedSource || 'Grafana APM / Prometheus Dashboard'}</span>
                          </div>
                          <span className="font-mono text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/25 font-bold">
                            {Math.round((visionData.aiConfidence || 0.96) * 100)}% Visual AI Confidence
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/25 text-indigo-200 leading-relaxed">
                          <span className="font-bold">Anomaly Summary: </span>
                          {visionData.anomalySummary}
                        </div>

                        {/* EXTRACTED METRICS GRID */}
                        <div>
                          <div className="text-[10px] uppercase font-mono text-slate-400 mb-2 font-bold">
                            Visual Anomaly Metrics Extracted via OCR:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {Array.isArray(visionData.extractedMetrics) ? (
                              visionData.extractedMetrics.map((m: any, midx: number) => (
                                <div key={midx} className="p-3 bg-black/50 rounded-xl border border-white/[0.06] space-y-1">
                                  <div className="text-[10px] text-slate-400 truncate">{m.label}</div>
                                  <div className="font-mono font-bold text-indigo-300 text-sm">{m.after || m.value}</div>
                                  {m.before && (
                                    <div className="text-[10px] font-mono text-slate-500">Nominal: {m.before}</div>
                                  )}
                                  {m.dropPct && (
                                    <div className="text-[10px] font-mono text-rose-400 font-bold">{m.dropPct}</div>
                                  )}
                                </div>
                              ))
                            ) : (
                              Object.entries(visionData.ocrExtractedMetrics || {}).map(([k, v]) => (
                                <div key={k} className="p-3 bg-black/50 rounded-xl border border-white/[0.06] space-y-1">
                                  <div className="text-[10px] text-slate-400 truncate">{k}</div>
                                  <div className="font-mono font-bold text-indigo-300 text-sm">{String(v)}</div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* OCR LOGS */}
                        {visionData.ocrExtractedLogs && visionData.ocrExtractedLogs.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                              OCR Scraped Error Stack Traces:
                            </div>
                            <div className="p-3 bg-black/60 rounded-xl font-mono text-rose-300 text-[11px] space-y-1 border border-rose-500/20">
                              {visionData.ocrExtractedLogs.map((log: string, lidx: number) => (
                                <div key={lidx}>{log}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {visionData.recommendation && (
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-slate-300 text-xs">
                            <span className="font-semibold text-slate-200">Vision Recommendation: </span>
                            {visionData.recommendation}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 8: POST-MORTEM & 1-CLICK MD DOWNLOADER (FEATURE #6) */}
            {activeTab === 'postmortem' && postMortem && (
              <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-7 shadow-xl space-y-6">
                  <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">Automated Blameless Post-Mortem (PIR)</h2>
                        <p className="text-xs text-slate-400">Generated automatically upon incident resolution with 5-Whys analysis</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/25 font-semibold">
                        STATUS: RESOLVED
                      </span>

                      {/* 1-CLICK POST-MORTEM (.MD) DOWNLOADER BUTTON */}
                      <button
                        onClick={handleDownloadPostMortem}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-emerald-600/30"
                        title="Download Blameless Post-Mortem as Markdown (.md) File"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download PIR (.MD)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* EXECUTIVE SUMMARY */}
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06] space-y-2">
                      <div className="font-semibold text-white text-sm">Executive Summary</div>
                      <p className="text-slate-300 leading-relaxed">{postMortem.summary || postMortem.executiveSummary || incident?.summary}</p>
                    </div>

                    {/* ROOT CAUSE & ACTION */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06] space-y-1">
                        <div className="text-slate-400 font-medium">Root Cause</div>
                        <div className="text-slate-200">{postMortem.rootCause || 'Unindexed database query saturated connection pool.'}</div>
                      </div>
                      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06] space-y-1">
                        <div className="text-slate-400 font-medium">Resolution Action</div>
                        <div className="text-emerald-300 font-mono">{postMortem.resolutionAction || 'Executed Tier 1 Green Guardrail (Connection Pool ceiling & traffic rerouting)'}</div>
                      </div>
                    </div>

                    {/* 5-WHYS ANALYSIS */}
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06] space-y-2.5">
                      <div className="font-semibold text-white text-sm flex items-center space-x-2">
                        <Sparkles className="h-4 w-4 text-violet-400" />
                        <span>Root Cause Analysis (5-Whys Methodology)</span>
                      </div>
                      <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                        <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                          <span className="text-violet-400 font-bold">Why 1: </span>Why did users experience 504 Gateway Timeouts? <span className="text-slate-400">→ API worker pods were unable to acquire active DB connections.</span>
                        </div>
                        <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                          <span className="text-violet-400 font-bold">Why 2: </span>Why were connection slots unavailable? <span className="text-slate-400">→ All 100 pool connections were held open in an un-idle state.</span>
                        </div>
                        <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                          <span className="text-violet-400 font-bold">Why 3: </span>Why were connections held open? <span className="text-slate-400">→ A slow unindexed full-table query executed repeatedly under high traffic.</span>
                        </div>
                        <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                          <span className="text-violet-400 font-bold">Why 4: </span>Why was the query unindexed? <span className="text-slate-400">→ PR #814 added a filter without a composite database index.</span>
                        </div>
                        <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                          <span className="text-violet-400 font-bold">Why 5: </span>Why was this not caught in staging? <span className="text-slate-400">→ Staging load tests did not run against realistic multi-million row datasets.</span>
                        </div>
                      </div>
                    </div>

                    {/* GIT HOTFIX DIFF & REGRESSION TEST CODE */}
                    {postMortem.gitHotfixDiff && (
                      <div className="p-4 bg-black/50 border border-white/[0.08] rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center">
                            <GitPullRequest className="h-4 w-4 mr-1.5 text-violet-400" />
                            Auto-Synthesized Git Hotfix PR Diff
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">PR #815 Auto-Generated</span>
                        </div>
                        <pre className="p-3 bg-black/80 rounded-lg text-emerald-300 font-mono text-[11px] overflow-x-auto border border-emerald-500/20">
                          {postMortem.gitHotfixDiff}
                        </pre>
                      </div>
                    )}

                    {postMortem.regressionTestCode && (
                      <div className="p-4 bg-black/50 border border-white/[0.08] rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center">
                            <FileCode className="h-4 w-4 mr-1.5 text-violet-400" />
                            Vitest / Jest Automated Regression Test Suite
                          </span>
                          <span className="text-[10px] font-mono text-violet-300">Passing in CI</span>
                        </div>
                        <pre className="p-3 bg-black/80 rounded-lg text-slate-300 font-mono text-[11px] overflow-x-auto border border-white/[0.06]">
                          {postMortem.regressionTestCode}
                        </pre>
                      </div>
                    )}

                    {postMortem.pullRequestUrl && (
                      <div className="p-4 bg-violet-950/20 border border-violet-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <GitPullRequest className="h-4 w-4 text-violet-400" />
                          <span className="font-medium text-violet-200">
                            Remediation Pull Request Generated: {postMortem.pullRequestUrl}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono bg-violet-500/20 text-violet-300 px-2.5 py-1 rounded-lg border border-violet-500/30">
                          GitHub Synced
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 9: INTERACTIVE WIDGET STUDIO */}
            {activeTab === 'widgets' && incident && (
              <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-xl flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center">
                      <Sliders className="h-5 w-5 mr-2 text-violet-400" /> Generative UI Interactive Widget Studio
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Standalone interactive telemetry and topological widgets
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-violet-500/15 text-violet-300 px-3 py-1.5 rounded-full border border-violet-500/25 font-semibold">
                    4 Interactive Widgets
                  </span>
                </div>

                <TelemetryChartWidget scenarioId={selectedScenarioId} />
                <TopologyGraphWidget />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BlastRadiusGaugeWidget
                    blastRadiusIndex={incident.blast_radius_index}
                    financialImpactPerMin={incident.financial_impact_per_min}
                    financialLossTotal={financialLoss || incident.financial_impact_per_min}
                  />
                  <EntropyFunnelWidget
                    rawAlertCount={incident.raw_alert_count}
                    correlatedSignals={incident.correlated_signal_count}
                    noiseReductionPct={incident.noise_reduction_pct}
                  />
                </div>
              </div>
            )}

            {/* VIEW 10: CUSTOM INCIDENT PLAYGROUND (FEATURE #3) */}
            {activeTab === 'custom' && (
              <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-7 shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center">
                        <PlusCircle className="h-5 w-5 mr-2 text-violet-400" /> Custom Incident Ingestion Playground
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Paste raw server stack traces or microservice error logs to trigger autonomous multi-agent swarm analysis
                      </p>
                    </div>
                    <span className="text-xs font-mono text-violet-300 bg-violet-500/15 px-3 py-1 rounded-full border border-violet-500/25 font-semibold">
                      Swarm Ingestion
                    </span>
                  </div>

                  {/* SAMPLE PRESETS */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 mr-1">Load Preset:</span>
                    <button
                      onClick={() => {
                        setCustomTitle('PostgreSQL Connection Pool Collapse');
                        setCustomService('checkout-db-primary');
                        setCustomSeverity('P1');
                        setCustomFinancialRate(32000);
                        setCustomLogs(
`[ERROR] 10:14:30.122 [pool-worker-7] org.postgresql.util.PSQLException: FATAL: remaining connection slots are reserved for non-replication superuser connections
[ERROR] 10:14:31.401 [HikariPool-1] Connection is not available, request timed out after 30005ms.
[WARN] 10:14:33.200 [web-worker-3] 504 Gateway Timeout: /api/v1/orders/checkout failed downstream
[FATAL] 10:14:34.800 [healthcheck] Health probe failed: 100/100 active connections exhausted.`
                        );
                      }}
                      className="text-xs px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition"
                    >
                      DB Pool Collapse (P1)
                    </button>
                    <button
                      onClick={() => {
                        setCustomTitle('Node.js V8 Heap Memory Leak Cascade');
                        setCustomService('auth-jwt-service');
                        setCustomSeverity('P1');
                        setCustomFinancialRate(22000);
                        setCustomLogs(
`<--- Last few GCs --->
[3214:0x6543210] 412304 ms: Mark-sweep (reduce) 2046.2 (2052.1) -> 2045.8 (2052.1) MB
<--- JS stacktrace --->
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
1: 0xb09c10 node::Abort() [node]
2: 0xa1cb35 node::FatalError(char const*, char const*) [node]
3: 0xc4e57e v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, bool) [node]`
                        );
                      }}
                      className="text-xs px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition"
                    >
                      Heap OOM Leak (P1)
                    </button>
                    <button
                      onClick={() => {
                        setCustomTitle('OAuth2 Token Authority Clock Skew');
                        setCustomService('identity-provider');
                        setCustomSeverity('P2');
                        setCustomFinancialRate(14000);
                        setCustomLogs(
`[ERROR] 10:14:15.801 [security-filter] JWT validation failed: Jwt expired at 2026-09-30T10:14:00Z. Current time: 2026-09-30T10:14:15Z.
[ERROR] 10:14:17.332 [ntp-sync] Clock drift detected: Local host clock is +15.320s ahead of stratum 1 NTP pool.
[WARN] 10:14:18.109 [auth-gateway] 100% rejection rate for issued bearer tokens across US-East cluster.`
                        );
                      }}
                      className="text-xs px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition"
                    >
                      NTP Clock Drift (P2)
                    </button>
                  </div>

                  {/* FORM FIELDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Incident Title</label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
                        placeholder="e.g. Payment Webhook Timeout"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Impacted Microservice</label>
                      <input
                        type="text"
                        value={customService}
                        onChange={(e) => setCustomService(e.target.value)}
                        className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-violet-500"
                        placeholder="e.g. checkout-payments-api"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Severity Tier</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['P1', 'P2', 'P3'].map((sev) => (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => setCustomSeverity(sev)}
                            className={`py-2 rounded-xl text-xs font-mono font-bold transition border ${
                              customSeverity === sev
                                ? sev === 'P1'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                                : sev === 'P2'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.06]'
                            }`}
                          >
                            {sev}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Financial Impact (₹ / minute)</label>
                      <input
                        type="number"
                        value={customFinancialRate}
                        onChange={(e) => setCustomFinancialRate(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-violet-500"
                        placeholder="24000"
                      />
                    </div>
                  </div>

                  {/* RAW LOGS TEXTAREA */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Raw Server Logs & Stack Traces</span>
                      <span className="text-[10px] font-mono text-slate-500">{customLogs.split('\n').filter(Boolean).length} lines</span>
                    </label>
                    <textarea
                      rows={7}
                      value={customLogs}
                      onChange={(e) => setCustomLogs(e.target.value)}
                      className="w-full p-3.5 bg-black/50 border border-white/[0.08] rounded-xl text-white font-mono text-xs focus:outline-none focus:border-violet-500 leading-relaxed"
                      placeholder="Paste raw log lines or stack trace here..."
                    />
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    onClick={handleCustomIngest}
                    disabled={customIngesting || !customLogs.trim()}
                    className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/30"
                  >
                    {customIngesting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Ingesting Telemetry & Synthesizing Swarm Consensus...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Run Multi-Agent Swarm on Custom Log</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 11: DEDICATED SRE TERMINAL SANDBOX (FEATURE #1) */}
            {activeTab === 'terminal' && (
              <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-7 shadow-xl space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center">
                        <Terminal className="h-5 w-5 mr-2 text-violet-400" /> Interactive SRE Command Sandbox ("Try-to-Break-It")
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Interactive command shell evaluating production safety policies against Tier 1 (Safe), Tier 2 (Approval), and Tier 3 (Prohibited)
                      </p>
                    </div>
                    <span className="text-xs font-mono text-violet-300 bg-violet-500/15 px-3 py-1.5 rounded-full border border-violet-500/25 font-semibold">
                      Zero-Trust Shell
                    </span>
                  </div>

                  {renderTerminalSandbox()}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* OVERVIEW DASHBOARD SIDE PANEL (PERMANENTLY FIXED TO RIGHT SIDE) */}
        {renderOverviewSidePanel()}
      </div>
=======
        {/* RIGHT COLUMN: INTERACTIVE WAR ROOM TABS & TERMINAL (8 Cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          {/* TAB NAVIGATION BUTTONS */}
          <div className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 flex items-center space-x-2 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('swarm')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'swarm' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Adversarial AI Debate Swarm</span>
            </button>

            <button
              onClick={() => setActiveTab('topology')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'topology' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Blast Radius Topology</span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'sandbox' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Interactive SRE Terminal Sandbox</span>
            </button>

            <button
              onClick={() => setActiveTab('playground')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'playground' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Custom Log Playground</span>
            </button>

            {postMortem && (
              <button
                onClick={() => setActiveTab('postmortem')}
                className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                  activeTab === 'postmortem' ? 'bg-emerald-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>1-Click Post-Mortem</span>
              </button>
            )}
          </div>

          {/* TAB 1: ADVERSARIAL SWARM DEBATE (STREAMING CHAT) */}
          {activeTab === 'swarm' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-cyan-400" /> Adversarial AI Debate (Detective vs. Skeptic)
                  </h2>
                  <p className="text-[11px] text-slate-400">Timestamp cross-falsification eliminates hallucinations in real time</p>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                  CONSENSUS: 96% CONFIDENCE
                </span>
              </div>

              {/* SEQUENTIAL STREAMING DEBATE CARDS */}
              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-2">
                {streamedDebates.map((d, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs leading-relaxed transition-all duration-300 animate-fadeIn ${
                      d.agentRole === 'DETECTIVE'
                        ? 'bg-slate-950/90 border-cyan-500/30 text-cyan-100 shadow-md'
                        : d.agentRole === 'SKEPTIC'
                        ? 'bg-red-950/20 border-red-500/40 text-red-200 shadow-md'
                        : d.agentRole === 'MEMORY'
                        ? 'bg-purple-950/20 border-purple-500/40 text-purple-200 shadow-md'
                        : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-100 font-medium shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1.5">
                      <span className="flex items-center text-xs">
                        {d.agentRole === 'DETECTIVE' && <Search className="h-4 w-4 mr-1.5 text-cyan-400" />}
                        {d.agentRole === 'SKEPTIC' && <AlertTriangle className="h-4 w-4 mr-1.5 text-red-400" />}
                        {d.agentRole === 'MEMORY' && <Brain className="h-4 w-4 mr-1.5 text-purple-400" />}
                        {d.agentRole === 'COMMANDER' && <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-400" />}
                        {d.agentName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">Round {d.round}</span>
                    </div>
                    <p className="text-slate-200 text-[11.5px] leading-relaxed">{d.statement}</p>
                    {d.trapWarning && (
                      <div className="mt-2.5 p-2 bg-red-900/40 rounded border border-red-500/40 text-amber-200 font-mono text-[11px]">
                        {d.trapWarning}
                      </div>
                    )}
                  </div>
                ))}

                {isTypingDebate && (
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center space-x-2 text-xs text-cyan-400 font-mono animate-pulse">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Swarm agents actively debating timestamps and metrics...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BLAST RADIUS TOPOLOGY VIEW */}
          {activeTab === 'topology' && incident && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center">
                    <Layers className="h-4 w-4 mr-2 text-cyan-400" /> Blast Radius & Cascading Topology Visualizer
                  </h2>
                  <p className="text-[11px] text-slate-400">Tracking failure waves from Patient Zero to edge user interfaces</p>
                </div>
                <span className="text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/40 px-3 py-1 rounded-full font-bold">
                  BLAST RADIUS: {incident.blast_radius_index}%
                </span>
              </div>

              {/* TOPOLOGY NODES */}
              <div className="grid grid-cols-4 gap-3.5">
                <div className="p-4 bg-red-950/40 border-2 border-red-500 rounded-xl text-center shadow-lg shadow-red-500/10">
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">🔴 Patient Zero</div>
                  <div className="text-xs font-bold text-white font-mono">{incident.patient_zero_service}</div>
                  <div className="text-[11px] text-red-300 mt-2">Connection Saturation (Root)</div>
                </div>

                <div className="p-4 bg-amber-950/30 border border-amber-500/50 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">🟠 Downstream L1</div>
                  <div className="text-xs font-bold text-white font-mono">checkout-service</div>
                  <div className="text-[11px] text-amber-300 mt-2">504 Gateway Timeouts</div>
                </div>

                <div className="p-4 bg-amber-950/30 border border-amber-500/50 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">🟡 Downstream L2</div>
                  <div className="text-xs font-bold text-white font-mono">payment-gateway</div>
                  <div className="text-[11px] text-amber-300 mt-2">Queue Worker Backlog</div>
                </div>

                <div className="p-4 bg-cyan-950/30 border border-cyan-500/50 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">🔵 User Surface</div>
                  <div className="text-xs font-bold text-white font-mono">Mobile & Web App</div>
                  <div className="text-[11px] text-cyan-300 mt-2">84% Traffic Cliff Drop</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <strong>Cascading Root Analysis:</strong> Failure originated at the primary database master due to an unindexed query lock, propagating upstream 504 timeouts to 4 interconnected services.
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIVE SRE TERMINAL SANDBOX ("TRY TO BREAK IT") */}
          {activeTab === 'sandbox' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center">
                    <Terminal className="h-4 w-4 mr-2 text-cyan-400" /> Interactive Guardrail Terminal (Try-to-Break-It)
                  </h2>
                  <p className="text-[11px] text-slate-400">Type any Linux, K8s, or SQL command to test the deterministic policy interceptor live</p>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                  REAL-TIME INTERCEPTOR
                </span>
              </div>

              {/* TERMINAL SCREEN */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs max-h-[320px] overflow-y-auto space-y-2.5">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center text-slate-400 text-[11px]">
                      <span className="text-cyan-400 mr-1.5 font-bold">$</span>
                      <span className="text-slate-200">{log.command}</span>
                      <span className="ml-auto text-[10px] text-slate-500">{log.timestamp}</span>
                    </div>
                    <div
                      className={`text-[11px] pl-3 border-l-2 ${
                        log.tier === 'RED'
                          ? 'border-red-500 text-red-400'
                          : log.tier === 'YELLOW'
                          ? 'border-amber-500 text-amber-300'
                          : 'border-emerald-500 text-emerald-400'
                      }`}
                    >
                      {log.output}
                    </div>
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* TERMINAL INPUT PROMPT */}
              <form onSubmit={handleTerminalSubmit} className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-cyan-400 font-mono font-bold">$</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Type command (e.g. 'rm -rf /', 'DROP TABLE', 'kubectl scale --replicas=4', 'curl /healthz')..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center space-x-1 cursor-pointer"
                >
                  <span>Evaluate</span>
                  <CornerDownLeft className="h-3 w-3" />
                </button>
              </form>

              {/* QUICK TEST COMMAND PILLS FOR JUDGES */}
              <div className="flex items-center space-x-2 pt-1 overflow-x-auto text-[11px]">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Quick Tests:</span>
                <button
                  type="button"
                  onClick={() => setTerminalInput('rm -rf /var/log/pods/*')}
                  className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/40 font-mono"
                >
                  rm -rf /
                </button>
                <button
                  type="button"
                  onClick={() => setTerminalInput('DROP DATABASE staging;')}
                  className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/40 font-mono"
                >
                  DROP DATABASE
                </button>
                <button
                  type="button"
                  onClick={() => setTerminalInput('kubectl scale deployment/read-replica --replicas=4')}
                  className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/40 font-mono"
                >
                  kubectl scale
                </button>
                <button
                  type="button"
                  onClick={() => setTerminalInput('curl -I https://api.internal/healthz')}
                  className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40 font-mono"
                >
                  curl healthz
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOM INCIDENT PLAYGROUND (PASTE YOUR OWN LOG) */}
          {activeTab === 'playground' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center">
                    <PlusCircle className="h-4 w-4 mr-2 text-purple-400" /> Custom Incident Playground
                  </h2>
                  <p className="text-[11px] text-slate-400">Paste your own raw error logs and let CHETAK’s multi-agent swarm investigate</p>
                </div>
              </div>

              <form onSubmit={handleCustomPlaygroundSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Incident Title</label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Microservice Name</label>
                    <input
                      type="text"
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Paste Raw Server Logs / Exception Stack Trace</label>
                  <textarea
                    rows={4}
                    value={customLogs}
                    onChange={(e) => setCustomLogs(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-cyan-300 focus:outline-none focus:border-purple-500 font-mono leading-relaxed"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-lg shadow-purple-600/20 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Run Multi-Agent Swarm on Custom Log</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: 1-CLICK POST-MORTEM & GIT HOTFIX PR */}
          {activeTab === 'postmortem' && postMortem && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-emerald-400 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" /> Incident Resolved: Blameless Post-Mortem & Hotfix PR
                  </h2>
                  <p className="text-[11px] text-slate-400">Automated 5-Whys PIR, Git PR Patch Diff, and CI/CD Vitest Regression Suite</p>
                </div>
                <button
                  onClick={handleDownloadPostMortem}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PIR (.MD)</span>
                </button>
              </div>

              {/* POST-MORTEM REPORT PREVIEW */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-[200px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {postMortem.markdownReport}
              </div>

              {/* GIT HOTFIX DIFF & TEST SUITE */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-cyan-500/30">
                  <div className="text-xs font-bold text-cyan-400 flex items-center mb-2">
                    <GitPullRequest className="h-3.5 w-3.5 mr-1.5" /> Auto-Generated Git Hotfix PR Patch
                  </div>
                  <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto max-h-[140px]">
                    {postMortem.gitHotfixDiff}
                  </pre>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-purple-500/30">
                  <div className="text-xs font-bold text-purple-400 flex items-center mb-2">
                    <Terminal className="h-3.5 w-3.5 mr-1.5" /> Automated Regression Test Suite
                  </div>
                  <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto max-h-[140px]">
                    {postMortem.regressionTestCode}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
>>>>>>> 71568d94ef3de656b278c2f5bf0894c889cd83a3
    </div>
  );
}
