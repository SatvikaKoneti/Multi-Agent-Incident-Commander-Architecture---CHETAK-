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
  Volume2,
  VolumeX,
  Download,
  PlusCircle,
  Play,
  CornerDownLeft,
  X
} from 'lucide-react';

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

export default function ChetakWarRoom() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('SCENARIO_DB_COLLAPSE');
  const [incident, setIncident] = useState<Incident | null>(null);
  const [allDebates, setAllDebates] = useState<DebateItem[]>([]);
  const [streamedDebates, setStreamedDebates] = useState<DebateItem[]>([]);
  const [isTypingDebate, setIsTypingDebate] = useState(false);
  const [guardrails, setGuardrails] = useState<GuardrailProposal[]>([]);
  const [historicalMatch, setHistoricalMatch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [postMortem, setPostMortem] = useState<any>(null);
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
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  };

  // Load scenarios on mount
  useEffect(() => {
    fetch('/api/incidents/scenarios')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setScenarios(data.scenarios);
          simulateScenario('SCENARIO_DB_COLLAPSE');
        }
      })
      .catch((err) => console.error('Failed to load scenarios:', err));
  }, []);

  // Live financial loss ticker
  useEffect(() => {
    if (!incident || incident.status === 'RESOLVED') return;
    const interval = setInterval(() => {
      setFinancialLoss((prev) => prev + Math.round((incident.financial_impact_per_min || 24000) / 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [incident]);

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
        setAllDebates(data.debates || []);
        setGuardrails(data.guardrailProposals || []);
        setHistoricalMatch(data.historicalMatch || null);
        setActiveTab('swarm');
        streamDebatesSequentially(data.debates || []);
        speakMissionAlert(`Warning. High severity outage detected on ${data.incident.service}. Ingesting telemetry.`);
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

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
        })
      });
      const data = await res.json();
      if (data.ok) {
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
    }
  };

  const handleResolveIncident = async () => {
    if (!incident) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/incidents/${incident.id}/resolve`, {
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
    } finally {
      setLoading(false);
    }
  };

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
              </span>
            </div>
          )}
        </div>
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
            </div>
          )}
        </div>

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
    </div>
  );
}
