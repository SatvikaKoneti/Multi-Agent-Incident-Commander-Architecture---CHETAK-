import React, { useState, useEffect } from 'react';
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
  TrendingDown
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
  const [debates, setDebates] = useState<DebateItem[]>([]);
  const [guardrails, setGuardrails] = useState<GuardrailProposal[]>([]);
  const [historicalMatch, setHistoricalMatch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [postMortem, setPostMortem] = useState<any>(null);
  const [visionMode, setVisionMode] = useState(false);
  const [visionData, setVisionData] = useState<any>(null);
  const [financialLoss, setFinancialLoss] = useState(0);
  const [activeTab, setActiveTab] = useState<'swarm' | 'topology' | 'guardrails' | 'postmortem'>('swarm');

  // Load scenarios on mount
  useEffect(() => {
    fetch('/api/incidents/scenarios')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setScenarios(data.scenarios);
          // Auto-simulate the first scenario
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
        setDebates(data.debates || []);
        setGuardrails(data.guardrailProposals || []);
        setHistoricalMatch(data.historicalMatch || null);
        setActiveTab('swarm');
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
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
        alert(`Action executed: ${data.output}`);
      } else if (data.blocked) {
        alert(`GUARDAIL BLOCK: ${data.error}`);
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
      }
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    } finally {
      setLoading(false);
    }
  };

  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
            imageMetadata: {
              name: file.name,
              size: file.size,
              type: file.type
            },
            imageBase64: base64
          })
        });
        const data = await res.json();
        if (data.ok) {
          setVisionData(data.vision);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* TOP MISSION-CONTROL TICKER HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 sticky top-0 z-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white tracking-wide">CHETAK</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                  SRE INCIDENT COMMANDER
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  STATEMENT ID: PNG2
                </span>
              </div>
              <p className="text-xs text-slate-400">Detect. Alert. Act. — Autonomous Advisory Co-Pilot</p>
            </div>
          </div>

          {/* REAL-TIME STATUS BADGES & TICKERS */}
          {incident && (
            <div className="flex items-center space-x-6 text-xs font-mono">
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-red-500/30 flex items-center space-x-2">
                <Flame className="h-4 w-4 text-red-400 animate-pulse" />
                <div>
                  <span className="text-slate-400">DOWNTIME LOSS:</span>
                  <span className="ml-1 text-red-400 font-bold">
                    ₹{(financialLoss || incident.financial_impact_per_min).toLocaleString('en-IN')} (₹{incident.financial_impact_per_min}/min)
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <div>
                  <span className="text-slate-400">SLO BREACH COUNTDOWN:</span>
                  <span className="ml-1 text-amber-400 font-bold">18m : 42s (99.9% SLO)</span>
                </div>
              </div>

              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-cyan-500/30 flex items-center space-x-2">
                <Shield className="h-4 w-4 text-cyan-400" />
                <div>
                  <span className="text-slate-400">GUARDRAIL:</span>
                  <span className="ml-1 text-cyan-400 font-bold">ZERO-TRUST ACTIVE</span>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full font-bold ${
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

      {/* SCENARIO SELECTOR BAR */}
      <section className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2.5 flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
            <Zap className="h-3.5 w-3.5 mr-1 text-cyan-400" /> Scenarios:
          </span>
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => simulateScenario(sc.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                selectedScenarioId === sc.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{sc.title.split(' ')[0]} {sc.title.split(' ')[1]}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-900 text-red-400 font-mono">{sc.severity}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="vision-file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            onClick={triggerFileInput}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/40 transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            <span>Upload Grafana/Chart Screenshot</span>
          </button>

          {incident && incident.status !== 'RESOLVED' && (
            <button
              onClick={handleResolveIncident}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Resolve & Generate Post-Mortem</span>
            </button>
          )}
        </div>
      </section>

      {/* MAIN COCKPIT BODY */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-y-auto">
        {/* LEFT COLUMN: TELEMETRY, VISION AI & ENTROPY SIFTER (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* SHANNON ENTROPY NOISE GAUGE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center">
                <Activity className="h-4 w-4 mr-2 text-cyan-400" /> Shannon Entropy Noise Sifter
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                99.4% NOISE FILTERED
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">Raw Alerts</div>
                <div className="text-lg font-bold text-red-400 font-mono">{incident?.raw_alert_count || 482}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">Root Signals</div>
                <div className="text-lg font-bold text-cyan-400 font-mono">{incident?.correlated_signal_count || 3}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">Entropy H(X)</div>
                <div className="text-lg font-bold text-emerald-400 font-mono">1.58 bits</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Mathematical Information Entropy compressed 482 redundant PagerDuty alerts into 3 independent root causes in 5 seconds.
            </p>
          </div>

          {/* VISION AI INGESTION BOX */}
          {visionMode && visionData && (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-5 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-indigo-300 flex items-center">
                  <Eye className="h-4 w-4 mr-2 text-indigo-400" /> Vision AI Multi-Modal Telemetry
                </h3>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                  96% CONFIDENCE
                </span>
              </div>

              {previewImage && (
                <div className="mb-3 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                  <img src={previewImage} alt="Uploaded Telemetry Chart" className="w-full h-32 object-cover" />
                </div>
              )}

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2 mb-3">
                <div className="font-semibold text-slate-200">{visionData.detectedSource}</div>
                <div className="text-slate-400">{visionData.anomalySummary}</div>
              </div>

              <div className="space-y-1.5">
                {visionData.extractedMetrics.map((m: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-400">{m.label}</span>
                    <span className="font-mono font-bold text-red-400">{m.after}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HISTORICAL DEJA-VU ENGINE (INSTITUTIONAL MEMORY) */}
          {historicalMatch && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-purple-400" /> Cross-Incident Déjà-Vu Engine
                </h3>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                  {historicalMatch.similarityPct}% MATCH
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">{historicalMatch.incidentCode}</span>
                  <span className="text-slate-400 text-[11px]">{historicalMatch.resolvedBy}</span>
                </div>
                <div className="text-slate-300">{historicalMatch.title}</div>
              </div>

              {historicalMatch.historicalTrapWarning && (
                <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg text-xs text-amber-300 space-y-1">
                  <div className="font-bold text-red-400 flex items-center">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1 text-red-400" /> Historical Disaster Trap Warning:
                  </div>
                  <div className="italic">{historicalMatch.historicalTrapWarning}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CENTER & RIGHT: ADVERSARIAL SWARM DEBATE & WAR ROOM TABS (8 Cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* TAB NAVIGATION */}
          <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 flex items-center space-x-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('swarm')}
              className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${
                activeTab === 'swarm' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Adversarial AI Debate Swarm</span>
            </button>
            <button
              onClick={() => setActiveTab('topology')}
              className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${
                activeTab === 'topology' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Blast Radius & Patient Zero</span>
            </button>
            <button
              onClick={() => setActiveTab('guardrails')}
              className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${
                activeTab === 'guardrails' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>Safety Guardrail Sandbox ({guardrails.length})</span>
            </button>
            {postMortem && (
              <button
                onClick={() => setActiveTab('postmortem')}
                className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${
                  activeTab === 'postmortem' ? 'bg-emerald-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>1-Click Post-Mortem & Git Hotfix</span>
              </button>
            )}
          </div>

          {/* TAB 1: ADVERSARIAL SWARM DEBATE VIEW */}
          {activeTab === 'swarm' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-cyan-400" /> Adversarial AI Debate (Detective vs. Skeptic)
                  </h2>
                  <p className="text-xs text-slate-400">Eliminating AI hallucinations via telemetry timestamp cross-falsification</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                    CONSENSUS: 96% CONFIDENCE
                  </span>
                </div>
              </div>

              {/* LIVE DEBATE CHAT STREAM */}
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                {debates.map((d, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs leading-relaxed transition ${
                      d.agentRole === 'DETECTIVE'
                        ? 'bg-slate-950 border-cyan-500/30 text-cyan-100'
                        : d.agentRole === 'SKEPTIC'
                        ? 'bg-red-950/20 border-red-500/30 text-red-200'
                        : d.agentRole === 'MEMORY'
                        ? 'bg-purple-950/20 border-purple-500/30 text-purple-200'
                        : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1.5">
                      <span className="flex items-center">
                        {d.agentRole === 'DETECTIVE' && <Search className="h-4 w-4 mr-1.5 text-cyan-400" />}
                        {d.agentRole === 'SKEPTIC' && <AlertTriangle className="h-4 w-4 mr-1.5 text-red-400" />}
                        {d.agentRole === 'MEMORY' && <Brain className="h-4 w-4 mr-1.5 text-purple-400" />}
                        {d.agentRole === 'COMMANDER' && <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-400" />}
                        {d.agentName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">Round {d.round}</span>
                    </div>
                    <p className="text-slate-200">{d.statement}</p>
                    {d.trapWarning && (
                      <div className="mt-2 p-2 bg-red-900/40 rounded border border-red-500/40 text-amber-200 font-mono text-[11px]">
                        {d.trapWarning}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: BLAST RADIUS & TOPOLOGY VIEW */}
          {activeTab === 'topology' && incident && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center">
                    <Layers className="h-5 w-5 mr-2 text-cyan-400" /> Blast Radius & Cascading Topology Visualizer
                  </h2>
                  <p className="text-xs text-slate-400">Tracking failure waves from Patient Zero to edge user interfaces</p>
                </div>
                <span className="text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/40 px-3 py-1 rounded-full font-bold">
                  BLAST RADIUS: {incident.blast_radius_index}%
                </span>
              </div>

              {/* TOPOLOGY NODES */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-red-950/40 border-2 border-red-500 rounded-xl text-center animate-pulse">
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">🔴 Patient Zero</div>
                  <div className="text-sm font-bold text-white">{incident.patient_zero_service}</div>
                  <div className="text-[11px] text-red-300 mt-2">Connection Saturation (Root)</div>
                </div>

                <div className="p-4 bg-amber-950/30 border border-amber-500/50 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">🟠 Downstream L1</div>
                  <div className="text-sm font-bold text-white">checkout-service</div>
                  <div className="text-[11px] text-amber-300 mt-2">504 Gateway Timeouts</div>
                </div>

                <div className="p-4 bg-amber-950/30 border border-amber-500/50 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">🟡 Downstream L2</div>
                  <div className="text-sm font-bold text-white">payment-gateway</div>
                  <div className="text-[11px] text-amber-300 mt-2">Queue Worker Backlog</div>
                </div>

                <div className="p-4 bg-cyan-950/30 border border-cyan-500/50 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">🔵 User Surface</div>
                  <div className="text-sm font-bold text-white">Mobile & Web App</div>
                  <div className="text-[11px] text-cyan-300 mt-2">84% Traffic Cliff Drop</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <strong>Cascading Root Analysis:</strong> Failure originated at the primary database master due to PR #814 unindexed query lock, propagating upstream timeouts to 4 microservices.
              </div>
            </div>
          )}

          {/* TAB 3: SAFETY GUARDRAIL SANDBOX */}
          {activeTab === 'guardrails' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center">
                    <Lock className="h-5 w-5 mr-2 text-cyan-400" /> Production Dry-Run Guardrail Sandbox
                  </h2>
                  <p className="text-xs text-slate-400">Zero-Trust deterministic policy filter for diagnostic & remediation commands</p>
                </div>
              </div>

              <div className="space-y-3">
                {guardrails.map((g, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs flex flex-col justify-between space-y-2 ${
                      g.safetyTier === 'GREEN'
                        ? 'bg-slate-950 border-emerald-500/40'
                        : g.safetyTier === 'YELLOW'
                        ? 'bg-slate-950 border-amber-500/40'
                        : 'bg-red-950/20 border-red-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                            g.safetyTier === 'GREEN'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : g.safetyTier === 'YELLOW'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          TIER: {g.safetyTier}
                        </span>
                        <span className="font-bold text-white text-sm">{g.actionName}</span>
                      </div>

                      {g.safetyTier === 'RED' ? (
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded font-bold font-mono text-xs border border-red-500/40">
                          🛑 HARD-BLOCKED
                        </span>
                      ) : g.executed ? (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded font-bold font-mono text-xs flex items-center">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> EXECUTED
                        </span>
                      ) : (
                        <button
                          onClick={() => handleExecuteGuardrail(g, idx)}
                          className={`px-3 py-1 rounded font-bold text-xs transition flex items-center space-x-1 ${
                            g.safetyTier === 'GREEN'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-amber-600 hover:bg-amber-500 text-white'
                          }`}
                        >
                          <span>{g.safetyTier === 'YELLOW' ? 'Approve & Execute (Sign-off)' : 'Run Safe Probe'}</span>
                        </button>
                      )}
                    </div>

                    <div className="p-2 bg-slate-900 rounded font-mono text-cyan-300 text-[11px] overflow-x-auto">
                      {g.command}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span><strong>Reason:</strong> {g.reason}</span>
                      <span><strong>Dry-Run:</strong> {g.dryRunPrediction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 1-CLICK POST-MORTEM & GIT HOTFIX PR */}
          {activeTab === 'postmortem' && postMortem && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-emerald-400 flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-400" /> Incident Resolved: Post-Mortem & Git Hotfix Synthesizer
                  </h2>
                  <p className="text-xs text-slate-400">Automated 5-Whys PIR, Git PR Patch Diff, and CI/CD Vitest Regression Suite</p>
                </div>
              </div>

              {/* POST-MORTEM REPORT PREVIEW */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 max-h-[220px] overflow-y-auto whitespace-pre-wrap">
                {postMortem.markdownReport}
              </div>

              {/* GIT HOTFIX DIFF & TEST SUITE */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/30">
                  <div className="text-xs font-bold text-cyan-400 flex items-center mb-2">
                    <GitPullRequest className="h-4 w-4 mr-1.5" /> Auto-Generated Git Hotfix PR Patch
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[160px]">
                    {postMortem.gitHotfixDiff}
                  </pre>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-purple-500/30">
                  <div className="text-xs font-bold text-purple-400 flex items-center mb-2">
                    <Terminal className="h-4 w-4 mr-1.5" /> Automated Regression Test Suite
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[160px]">
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
