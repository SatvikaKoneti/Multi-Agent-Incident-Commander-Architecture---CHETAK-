import { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  ChevronRight,
  Layers,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { api, getStoredUser } from '../../lib/api';
import { loadCopilotChat, saveCopilotChat, clearCopilotChat } from '../../lib/copilotChat';
import type { CityIntelligenceData, ProblemCluster, Locality } from '../../lib/types';
import { navigate } from '../../lib/router';
import { Panel, Loading } from '../../components/ui';

interface CopilotPreset {
  id: string;
  title: string;
  prompt: string;
}

interface SuggestedAction {
  label: string;
  action: string;
  target?: string;
  locality?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  suggestedActions?: SuggestedAction[];
  timestamp: string;
}

interface CopilotResponse {
  ok: boolean;
  reply: string;
  suggestedActions: SuggestedAction[];
  model: string;
  provider: string;
  isGrok: boolean;
}

const DEFAULT_WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    `### Greetings, City Planner 👋\n\n` +
    `I am your specialized **Urban Planning & Municipal Intelligence Copilot** for Hyderabad.\n\n` +
    `I am connected directly to Hyderabad's live geospatial database, citizen grievance clusters, and inter-agency workflows across **GHMC, HMDA, TSSPDCL, HMWSSB, HYDRAA, and TSPCB**.\n\n` +
    `**How I can aid you today:**\n` +
    `- 🚦 **Resolve Bottlenecks:** Analyze traffic gridlocks (e.g. Secunderabad underpass, Cyber Towers), waterlogging corridors (Begumpet nala), or feeder overload (Kondapur).\n` +
    `- ⚖️ **Evaluate Interventions & Trade-offs:** Compare cost, timeline, and viability of capital projects vs tactical municipal measures.\n` +
    `- 📝 **Draft Official Inquiries:** Formulate ready-to-dispatch letters and memos to statutory authorities.\n` +
    `- 📊 **Prioritize Problem Clusters:** Extract high-impact interventions from live citizen reports.\n\n` +
    `Select a quick starter below or type your question!`,
  suggestedActions: [
    { label: 'Analyze Begumpet Drainage', action: 'preset_begumpet' },
    { label: 'Cyber Towers Decongestion', action: 'preset_cyber_towers' },
    { label: 'Draft GHMC Clarification', action: 'preset_ghmc' },
    { label: 'City-Wide Urban Pulse', action: 'preset_city_wide' },
  ],
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export function PlannerGrokAssistantView() {
  const currentUser = getStoredUser();
  const userId = currentUser?.id || currentUser?.email || 'planner';

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = loadCopilotChat<Message>(userId);
    if (saved && Array.isArray(saved.messages) && saved.messages.length > 0) {
      return saved.messages;
    }
    return [DEFAULT_WELCOME];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState<CopilotPreset[]>([]);
  const [clusters, setClusters] = useState<ProblemCluster[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string>(() => {
    const saved = loadCopilotChat<Message>(userId);
    return saved?.selectedClusterId || '';
  });
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>(() => {
    const saved = loadCopilotChat<Message>(userId);
    return saved?.selectedLocalityId || '';
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiInfo, setAiInfo] = useState<{ model: string; isGrok: boolean; provider: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Load presets
    api
      .get<{ presets: CopilotPreset[] }>('/api/planner/copilot/presets')
      .then(({ data }) => setPresets(data.presets || []))
      .catch(() => {});

    // Load city clusters and localities for grounding
    api
      .get<CityIntelligenceData>('/api/planner/city-intelligence')
      .then(({ data }) => {
        if (data.clusters) setClusters(data.clusters);
      })
      .catch(() => {});

    api
      .get<{ localities: Locality[] }>('/api/planner/localities')
      .then(({ data }) => {
        if (data.localities) setLocalities(data.localities);
      })
      .catch(() => {});

    // Check AI health and active model
    api
      .get<{ ok: boolean; model?: string; isGrok?: boolean; provider?: string }>('/api/ai/health')
      .then(({ data }) => {
        if (data.ok) {
          setAiInfo({
            model: data.model || 'grok-2-vision-1212',
            isGrok: Boolean(data.isGrok || data.model?.toLowerCase().includes('grok')),
            provider: data.provider || 'xai',
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    saveCopilotChat(userId, {
      messages,
      selectedClusterId,
      selectedLocalityId,
    });
  }, [messages, selectedClusterId, selectedLocalityId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(userText?: string) {
    const textToSend = userText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userText) setInput('');
    setLoading(true);

    try {
      // Build history from current session
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data } = await api.post<CopilotResponse>('/api/planner/copilot', {
        json: {
          message: textToSend.trim(),
          history,
          clusterId: selectedClusterId || undefined,
          localityId: selectedLocalityId || undefined,
        },
      });

      const assistantMsg: Message = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        model: data.model,
        suggestedActions: data.suggestedActions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.model) {
        setAiInfo((prev) => ({
          model: data.model,
          isGrok: Boolean(data.isGrok || data.model.includes('grok')),
          provider: data.provider || prev?.provider || 'groq',
        }));
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Copilot Encountered an Issue:** ${errMsg}\n\nPlease check that your API key is configured in \`backend/.env\` and the backend server is active.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleActionClick(action: SuggestedAction) {
    if (action.action === 'preset_begumpet') {
      const p = presets.find((x) => x.id === 'begumpet_waterlogging');
      handleSend(p?.prompt || 'Analyze Begumpet Waterlogging & Drainage');
      return;
    }
    if (action.action === 'preset_cyber_towers') {
      const p = presets.find((x) => x.id === 'cyber_towers_traffic');
      handleSend(p?.prompt || 'Decongest Cyber Towers / Madhapur Junction');
      return;
    }
    if (action.action === 'preset_ghmc') {
      const p = presets.find((x) => x.id === 'ghmc_clarification_draft');
      handleSend(p?.prompt || 'Draft Official Inquiry to GHMC');
      return;
    }
    if (action.action === 'preset_city_wide') {
      const p = presets.find((x) => x.id === 'city_wide_summary');
      handleSend(p?.prompt || 'Provide a structured executive briefing on Hyderabad\'s top active problem clusters');
      return;
    }
    if (action.action === 'draft_memo') {
      handleSend(`Please draft an official formal memorandum to ${action.target || 'GHMC'} with subject, context, requested engineering specifications, and a 14-day compliance timeline.`);
      return;
    }
    if (action.action === 'view_cluster' || action.action === 'view_dashboard') {
      navigate('/planner');
      return;
    }
    if (action.action === 'view_locality' || action.action === 'view_localities') {
      navigate('/planner/localities');
      return;
    }
    handleSend(action.label);
  }

  function copyToClipboard(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  function clearHistory() {
    const resetMsg: Message = {
      id: `cleared_${Date.now()}`,
      role: 'assistant',
      content: 'Conversation history reset. How may I assist your urban planning initiatives today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([resetMsg]);
    clearCopilotChat(userId);
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 text-ink-950 shadow-glow">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
                  Planner Copilot
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {aiInfo?.model ? aiInfo.model : 'Copilot Active'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Session Saved ({messages.length} msg)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Agentic Municipal Intelligence Assistant for Hyderabad Urban Planning Authority
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-ink-900/60 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 transition"
            title="Reset conversation and start fresh session"
          >
            <Trash2 className="h-3.5 w-3.5" />
            New Session
          </button>
        </div>
      </div>

      {/* Context Grounding Bar */}
      <Panel className="p-3 bg-ink-950/60 border-white/[0.06]">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-slate-400 font-medium">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            Live Grounding Context:
          </span>

          {/* Cluster Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Problem Cluster:</span>
            <select
              value={selectedClusterId}
              onChange={(e) => {
                setSelectedClusterId(e.target.value);
                if (e.target.value) setSelectedLocalityId('');
              }}
              className="rounded-lg border border-white/[0.1] bg-ink-900 px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="">None (City-Wide Context)</option>
              {clusters.map((c) => (
                <option key={c.cluster_id} value={c.cluster_id}>
                  {c.locality_name} — {c.title.slice(0, 45)}... (P:{c.priority_score})
                </option>
              ))}
            </select>
          </div>

          {/* Locality Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Locality:</span>
            <select
              value={selectedLocalityId}
              onChange={(e) => {
                setSelectedLocalityId(e.target.value);
                if (e.target.value) setSelectedClusterId('');
              }}
              className="rounded-lg border border-white/[0.1] bg-ink-900 px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="">None (All Localities)</option>
              {localities.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.population?.toLocaleString('en-IN')} pop)
                </option>
              ))}
            </select>
          </div>

          {(selectedClusterId || selectedLocalityId) && (
            <button
              onClick={() => {
                setSelectedClusterId('');
                setSelectedLocalityId('');
              }}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Reset Context
            </button>
          )}
        </div>
      </Panel>

      {/* Preset Starters Chips */}
      {presets.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
            Recommended Inquiries for Hyderabad
          </p>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSend(preset.prompt)}
                className="group flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-ink-900/40 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-950/20 hover:text-cyan-200 transition text-left"
              >
                <Sparkles className="h-3 w-3 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>{preset.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation Thread */}
      <div className="space-y-4 min-h-[420px] max-h-[620px] overflow-y-auto pr-1">
        {messages.map((m) => {
          const isAssistant = m.role === 'assistant';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-ink-950 font-bold shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div className={`max-w-3xl space-y-2.5 ${isAssistant ? 'w-full' : ''}`}>
                <div
                  className={`rounded-2xl p-4 text-sm leading-relaxed ${
                    isAssistant
                      ? 'border border-white/[0.08] bg-ink-900/70 text-slate-200 shadow-md backdrop-blur-md'
                      : 'bg-cyan-600 text-white shadow-glow'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/[0.06]">
                    <span className="text-[11px] font-medium opacity-75">
                      {isAssistant ? (m.model ? `Copilot (${m.model})` : 'Copilot') : 'City Planner'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] opacity-60">{m.timestamp}</span>
                      {isAssistant && (
                        <button
                          onClick={() => copyToClipboard(m.id, m.content)}
                          title="Copy response"
                          className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition"
                        >
                          {copiedId === m.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="markdown-prose whitespace-pre-wrap font-sans text-[13px] leading-relaxed">
                    {m.content}
                  </div>
                </div>

                {/* Suggested Action Chips */}
                {isAssistant && m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 pl-1">
                    {m.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleActionClick(action)}
                        className="flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-950/30 px-2.5 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition"
                      >
                        <ChevronRight className="h-3 w-3" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!isAssistant && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-violet-600/30 text-violet-300 font-bold border border-violet-500/30">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs py-2 pl-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-ink-950 animate-pulse">
              <Bot className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-2">
              <Loading label="Copilot is analyzing Hyderabad urban evidence & formulating recommendations..." />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <Panel className="p-3 bg-ink-900/90 border-white/[0.08] shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex flex-col gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Copilot: e.g. 'How can we solve traffic congestion at the Secunderabad railway station underpass?', 'Draft an inquiry to GHMC'..."
            rows={3}
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-ink-950/80 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
          />

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="text-[11px] text-slate-500">
              Press <kbd className="rounded border border-white/[0.1] px-1 py-0.5 text-[10px]">Enter</kbd> to send, <kbd className="rounded border border-white/[0.1] px-1 py-0.5 text-[10px]">Shift+Enter</kbd> for newline
            </div>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-5 py-2 text-xs font-semibold text-ink-950 shadow-glow transition hover:from-cyan-400 hover:to-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Ask Copilot</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
