import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Check, CircleDashed, Loader2, Sparkles } from 'lucide-react';
import type { TimelineStep } from '../lib/types';
import { formatInr, timeAgo } from '../lib/format';
import { Chip, Panel, ProgressBar, Section } from './MissionControlUiComponents';
import type { AgentRun, EvidenceItem, RecommendationOption } from '../lib/types';

/* ---------- complaint status timeline ---------- */
export function TimelineFlow({ steps }: { steps: TimelineStep[] }) {
  const order = ['submitted', 'classified', 'review', 'authority', 'implementation', 'resolved'];
  const sorted = useMemo(() => {
    const byKey = new Map(steps.map((s) => [s.key, s]));
    return order.map((k) => byKey.get(k)).filter(Boolean) as TimelineStep[];
  }, [steps, order]);

  const activeIdx = sorted.findIndex((s) => s.status === 'active');

  return (
    <ol className="relative space-y-4 pl-1">
      {sorted.map((s, i) => {
        const done = s.status === 'done';
        const active = s.status === 'active';
        const last = i === sorted.length - 1;
        const dotCls = done
          ? 'border-emerald-400/50 bg-emerald-400'
          : active
            ? 'border-cyan-400/60 bg-cyan-400 animate-pulse-ring'
            : 'border-white/10 bg-ink-800';
        return (
          <li key={s.key} className="relative flex gap-3">
            {!last ? (
              <span
                className={
                  'absolute left-[11px] top-7 h-[calc(100%-14px)] w-px ' +
                  (i < activeIdx || done ? 'bg-emerald-400/40' : 'bg-white/10')
                }
              />
            ) : null}
            <span className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${dotCls} ${active ? 'animate-pulse' : ''}`}>
              {done ? <Check className="h-3 w-3 text-ink-950" /> : active ? <Loader2 className="h-3 w-3 animate-spin text-ink-950" /> : null}
            </span>
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-[13px] font-semibold ${done ? 'text-slate-200' : active ? 'text-cyan-200' : 'text-slate-500'}`}>
                  {s.step}
                </p>
                {done ? (
                  <span className="text-[10px] text-slate-500">{s.at ? timeAgo(s.at) : ''}</span>
                ) : active ? (
                  <span className="chip border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">in progress</span>
                ) : null}
              </div>
              {active && i === sorted.length - 1 && done ? null : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- evidence card ---------- */
export function EvidenceCards({ evidence, title = 'Evidence & sources' }: { evidence: EvidenceItem[]; title?: string }) {
  if (!evidence || !evidence.length) return null;
  return (
    <Section
      title={title}
      subtitle={`${evidence.length} ${evidence.length === 1 ? 'source' : 'sources'} cited by the AI agents`}
    >
      <div className="space-y-2">
        {evidence.map((e, i) => (
          <Panel key={i} className="flex items-start gap-3 p-3">
            <span className="chip border border-violet-400/30 bg-violet-400/10 font-mono text-violet-300">{e.ref}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-200">{e.source_label || e.source}</p>
              {e.detail ? <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{e.detail}</p> : null}
              <p className="mt-1 text-[10px] text-slate-600">
                {e.source}
                {e.is_demo ? ' · demo data' : ''}
              </p>
            </div>
            {e.is_demo ? <Chip className="border-amber-400/30 bg-amber-400/10 text-amber-300">demo</Chip> : null}
          </Panel>
        ))}
      </div>
    </Section>
  );
}

/* ---------- agent run activity ---------- */
export function AgentActivity({ runs }: { runs: AgentRun[] }) {
  if (!runs?.length) return null;
  const nameMap: Record<string, string> = {
    coordinator: 'Coordinator',
    traffic_agent: 'Traffic Agent',
    pollution_agent: 'Pollution Agent',
    energy_agent: 'Energy Agent',
    fusion: 'Fusion Engine',
    clarification: 'Clarification Engine',
    rag: 'RAG Retrieval',
    recommendation: 'Recommendation Engine',
    memory: 'Memory Writer',
  };
  const colorMap: Record<string, string> = {
    coordinator: '#22d3ee',
    traffic_agent: '#38bdf8',
    pollution_agent: '#a78bfa',
    energy_agent: '#34d399',
    fusion: '#fbbf24',
    clarification: '#fb7185',
    rag: '#c084fc',
    recommendation: '#2dd4bf',
    memory: '#86efac',
  };
  const order = ['coordinator', 'traffic_agent', 'pollution_agent', 'energy_agent', 'fusion', 'clarification', 'rag', 'recommendation', 'memory'];
  const sorted = [...runs].sort((a, b) => a.id - b.id);
  const nice = sorted.map((r) => ({
    ...r,
    label: nameMap[r.agent_name] || r.agent_name.replace(/_/g, ' '),
    color: colorMap[r.agent_name] || '#94a3b8',
  }));
  void order;
  return (
    <div className="space-y-2">
      {nice.map((r) => (
        <div key={r.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-900/60 px-3 py-2.5">
          <span className="relative">
            <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `${r.color}1a`, color: r.color }}>
              <Sparkles className="h-4 w-4" />
            </span>
            {r.status === 'running' ? (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-cyan-300 animate-ping" />
            ) : null}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-semibold capitalize text-slate-200">{r.label}</p>
              <span
                className={
                  'chip ' +
                  (r.status === 'complete'
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                    : r.status === 'running'
                      ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                      : 'border-rose-400/30 bg-rose-400/10 text-rose-300')
                }
              >
                {r.status}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {r.status === 'complete' && r.finished_at ? `completed ${timeAgo(r.finished_at)}` : `started ${timeAgo(r.started_at)}`}
              {r.error ? ` · ${r.error}` : ''}
            </p>
          </div>
          {r.status === 'complete' ? <Check className="h-4 w-4 text-emerald-400" /> : r.status === 'running' ? <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> : <CircleDashed className="h-4 w-4 text-rose-400" />}
        </div>
      ))}
    </div>
  );
}

/* ---------- recommendation comparison chart ---------- */
export function CompareChart({ options }: { options: RecommendationOption[] }) {
  const data = options.map((o) => ({
    name: o.rank ? `#${o.rank}` : o.name,
    impact: o.impact_score ?? 0,
    feasibility: o.feasibility_score ?? 0,
  }));
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 20, right: 8, left: -18, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#0a101f', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
        />
        <Bar dataKey="impact" name="Impact" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={`i${i}`} fill="#fb7185" />
          ))}
          <LabelList dataKey="impact" position="top" style={{ fontSize: 10, fill: '#fb7185' }} />
        </Bar>
        <Bar dataKey="feasibility" name="Feasibility" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={`f${i}`} fill="#22d3ee" />
          ))}
          <LabelList dataKey="feasibility" position="top" style={{ fontSize: 10, fill: '#22d3ee' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- recommendation option card ---------- */
export function RecommendationCard({
  option,
  selected,
  onSelect,
  action,
  notes,
}: {
  option: RecommendationOption;
  selected?: boolean;
  onSelect?: () => void;
  action?: React.ReactNode;
  notes?: string;
}) {
  const viability = Math.round(option.viability ?? 0);
  const viaColor = viability >= 70 ? '#34d399' : viability >= 45 ? '#fbbf24' : '#fb7185';
  return (
    <Panel
      className={'relative flex flex-col gap-3 p-4 ' + (selected ? 'ring-2 ring-cyan-400/40 border-cyan-400/40' : '')}
      onClick={onSelect}
      hover
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cyan-400/10 font-mono text-xs font-bold text-cyan-300">
            {option.rank}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-slate-100">{option.name}</p>
            <p className="text-[11px] text-slate-500">
              {option.target_authority ? `Lead: ${option.target_authority}` : ''}
              {option.target_authority && option.constraint_status ? ' · ' : ''}
              {option.constraint_status === 'approval_required'
                ? 'requires authority approval'
                : option.constraint_status === 'blocked'
                  ? 'blocked by constraints'
                  : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {option.constraint_status === 'approval_required' ? (
            <span className="chip border border-amber-400/40 bg-amber-400/15 text-amber-300">approval</span>
          ) : option.constraint_status === 'blocked' ? (
            <span className="chip border border-rose-400/40 bg-rose-400/15 text-rose-300">blocked</span>
          ) : null}
          {option.is_recommended ? (
            <span className="chip border border-emerald-400/40 bg-emerald-400/15 text-emerald-300">
              <Check className="h-3 w-3" /> selected
            </span>
          ) : null}
        </div>
      </div>

      <p className="text-xs leading-relaxed text-slate-400">{option.description}</p>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="label">Cost</p>
          <p className="mt-1 font-mono text-[13px] font-semibold text-slate-200">{formatInr(option.est_cost_inr)}</p>
        </div>
        <div>
          <p className="label">Timeline</p>
          <p className="mt-1 text-[13px] font-semibold text-slate-200">{option.timeline_months} mo</p>
        </div>
        <div>
          <p className="label">Viability</p>
          <p className="mt-1 font-mono text-[13px] font-semibold" style={{ color: viaColor }}>
            {viability}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 flex justify-between text-[10px] text-slate-500">
            <span>Impact</span>
            <span className="text-rose-300">{option.impact_score}</span>
          </div>
          <ProgressBar value={option.impact_score} color="#fb7185" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[10px] text-slate-500">
            <span>Feasibility</span>
            <span className="text-cyan-300">{option.feasibility_score}</span>
          </div>
          <ProgressBar value={option.feasibility_score} color="#22d3ee" />
        </div>
      </div>

      {option.xai_scores ? (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Explainable AI (XAI) Breakdown
            </span>
            <span className="font-mono text-[10px] text-cyan-400/80">
              55% Impact + 45% Feasibility
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.05]">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Impact Driver:</span>
                <span className="font-medium text-rose-300 capitalize truncate">
                  {option.xai_scores.impact.top_driver.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(option.xai_scores.impact.contributions || {}).map(([dim, pct]) => (
                  <span
                    key={dim}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-200"
                    title={`${dim}: ${Math.round(pct)}% of impact score`}
                  >
                    {dim.replace(/_/g, ' ')}: {Math.round(pct)}%
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Feasibility Driver:</span>
                <span className="font-medium text-cyan-300 capitalize truncate">
                  {option.xai_scores.feasibility.top_driver.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(option.xai_scores.feasibility.contributions || {}).map(([dim, pct]) => (
                  <span
                    key={dim}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-200"
                    title={`${dim}: ${Math.round(pct)}% of feasibility score`}
                  >
                    {dim.replace(/_/g, ' ')}: {Math.round(pct)}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {option.components?.length ? (
        <div className="flex flex-wrap gap-1">
          {option.components.map((c) => (
            <span key={c} className="chip border border-white/[0.07] bg-white/[0.03] font-mono text-[10px] text-slate-400">
              {c}
            </span>
          ))}
        </div>
      ) : null}

      {option.constraints_applied?.length ? (
        <div className="space-y-1">
          <p className="label">Constraints applied</p>
          {option.constraints_applied.map((c, i) => (
            <p key={i} className="flex items-start gap-1.5 text-[11px] text-amber-200/90">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-300" />
              {c.description || `${c.type}${c.authority ? ` · ${c.authority}` : ''}`}
            </p>
          ))}
        </div>
      ) : null}

      {option.environmental_effect || option.energy_effect || option.population_benefit ? (
        <div className="space-y-1.5">
          {option.environmental_effect ? (
            <p className="flex items-start gap-1.5 text-[11px] text-slate-400">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-300" />
              <span>
                <span className="text-slate-500">Environmental:</span> {option.environmental_effect}
              </span>
            </p>
          ) : null}
          {option.energy_effect ? (
            <p className="flex items-start gap-1.5 text-[11px] text-slate-400">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-sky-300" />
              <span>
                <span className="text-slate-500">Energy:</span> {option.energy_effect}
              </span>
            </p>
          ) : null}
          {option.population_benefit ? (
            <p className="flex items-start gap-1.5 text-[11px] text-slate-400">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-300" />
              <span className="text-slate-500">Population:</span> {option.population_benefit}
            </p>
          ) : null}
        </div>
      ) : null}

      {option.dependencies?.length ? (
        <div className="space-y-1">
          <p className="label">External dependencies</p>
          <div className="flex flex-wrap gap-1">
            {option.dependencies.map((d) => (
              <span key={d} className="chip border border-white/[0.07] bg-white/[0.03] text-[10px] text-slate-400">
                {d}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {option.evidence?.length ? (
        <div className="space-y-1">
          <p className="label">Evidence</p>
          {option.evidence.map((e, i) => (
            <p key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-cyan-300" />
              <span>
                <span className="font-mono text-[10px] text-cyan-300/80">{e.source_label}</span>
                {e.is_demo ? ' · demo' : ''} — {e.detail}
              </span>
            </p>
          ))}
        </div>
      ) : null}

      {option.why_generated ? (
        <p className="rounded-lg bg-white/[0.03] p-2 text-[11px] italic leading-relaxed text-slate-500">
          {option.why_generated}
        </p>
      ) : null}

      {notes !== undefined ? <p className="text-[11px] text-slate-500">{notes}</p> : null}
      {action ? <div className="mt-auto">{action}</div> : null}
    </Panel>
  );
}

/* ---------- shared key-value list bytes ---------- */
export function KV({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-1.5">
          <dt className="text-[11px] uppercase tracking-wide text-slate-500">{k}</dt>
          <dd className="text-right text-[13px] font-medium text-slate-200">{v}</dd>
        </div>
      ))}
    </dl>
  );
}