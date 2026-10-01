import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  GitBranch,
  Handshake,
  RefreshCw,
  Send,
  Sparkles,
  ThumbsUp,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { api } from '../../lib/api';
import type {
  AnalysisDetail, ClarificationRequest, Interpretation, KpiRow, Memory, RecommendationOption,
} from '../../lib/types';
import { domainColor, formatDate, formatInr, humanStatus, timeAgo } from '../../lib/format';
import { navigate } from '../../lib/router';
import {
  Badge, Chip, Empty, ErrorBlock, Field, Loading, Panel, Section, Spinner, StatusPill, Tabs, parseJson,
} from '../../components/MissionControlUiComponents';
import { AgentActivity, CompareChart, EvidenceCards, RecommendationCard } from '../../components/IncidentTimelineFlowComponents';

type ParsedRunResult = {
  summary?: string;
  conclusion?: string;
  key_findings?: string[];
  evidence_refs?: string[];
  tradeoffs?: string[];
  missing_information?: string[];
  risks?: string[];
  confidence?: number;
  interpretation?: Record<string, unknown>;
  [k: string]: unknown;
};

const PENDING_STATUSES = new Set(['running', 'awaiting_specialist', 'awaiting_clarification', 'awaiting_authority']);

export function AnalysisDetail({ id }: { id: number }) {
  const [data, setData] = useState<AnalysisDetail | null>(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('agents');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<AnalysisDetail>(`/api/planner/analyses/${id}`);
      setData(data);
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load analysis');
    }
  }, [id]);

  useEffect(() => {
    load();
    const status = data?.analysis.status;
    const pending = status && PENDING_STATUSES.has(status);
    if (!pending) return;
    const t = setInterval(load, 3500);
    return () => clearInterval(t);
  }, [load, data?.analysis.status]);

  useEffect(() => {
    const t = setInterval(load, 40000);
    return () => clearInterval(t);
  }, [load]);

  if (err && !data) return <ErrorBlock error={err} onRetry={load} />;
  if (!data) return <Loading label="Loading analysis pipeline…" />;

  const a = data.analysis;
  const pending = PENDING_STATUSES.has(a.status);

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip border border-white/[0.07] font-mono text-[10px] text-slate-400">ANALYSIS #{a.id}</span>
              <StatusPill status={a.status} />
              {pending ? (
                <span className="chip border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                  <RefreshCw className="h-3 w-3 animate-spin" /> agents working
                </span>
              ) : null}
              {a.category ? <Chip className="border-violet-400/25 bg-violet-400/10 text-violet-300">{a.category}</Chip> : null}
            </div>
            <h1 className="mt-2 text-lg font-bold tracking-tight text-slate-100 sm:text-xl">{a.problem_title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">{a.problem_description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="chip border border-white/[0.07]">{data.locality?.name ?? a.locality_id}</span>
              <span>created {formatDate(a.created_at)}</span>
              <span>updated {timeAgo(a.updated_at)}</span>
              {a.priority_score != null ? <span className="chip font-mono">priority {a.priority_score.toFixed(1)}</span> : null}
            </div>
          </div>
          <button className="btn-ghost !px-3 !py-2 text-xs" onClick={() => navigate('/planner/analyses')}>← Analyses</button>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'agents', label: 'Agents & insights' },
          { key: 'recs', label: `Recommendations (${data.recommendations?.options?.length ?? 0})` },
          { key: 'authority', label: `Authority & requests (${data.clarifications?.length ?? 0})` },
          { key: 'deploy', label: 'Deployment & KPIs' },
        ]}
      />

      {tab === 'agents' ? <AgentsTab data={data} /> : null}
      {tab === 'recs' ? <RecsTab data={data} onChanged={load} /> : null}
      {tab === 'authority' ? <AuthorityTab data={data} onChanged={load} /> : null}
      {tab === 'deploy' ? <DeployTab data={data} onChanged={load} /> : null}
    </div>
  );
}

/* ---------------- Agents & insights ---------------- */

function AgentsTab({ data }: { data: AnalysisDetail }) {
  const runsWithParsed = (data.runs || []).map((r) => ({
    ...r,
    results: (r.results || []).map((res) => ({
      ...res,
      parsedResult: parseJson<ParsedRunResult>(res.result, {}),
      parsedEvidence: parseJson<unknown[]>(res.evidence, []),
    })),
  }));

  const coordinatorDecision = useMemo(() => {
    const raw = data.analysis.coordinator_decision;
    if (raw && typeof raw === 'object' && Object.keys(raw).length) return raw as Record<string, unknown>;
    const first = runsWithParsed.find((r) => /coordinator/i.test(r.agent_name))?.results?.[0]?.parsedResult;
    return first || null;
  }, [data, runsWithParsed]);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
      <div className="space-y-5">
        <SpecialistStatus data={data} />
        {coordinatorDecision ? (
          <Panel glow className="p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300"><Bot className="h-4 w-4" /></span>
              <p className="text-sm font-semibold text-slate-100">Coordinator decision</p>
              <Chip className="border-cyan-400/25 bg-cyan-400/10 text-cyan-300">plans the run</Chip>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {String(coordinatorDecision.understanding || '')}
            </p>
            {Array.isArray(coordinatorDecision.required_agents) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(coordinatorDecision.required_agents as Array<{ agent: string; objective: string }>).map((ag, i) => (
                  <span key={i} className="chip border border-white/[0.07] bg-white/[0.03] text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: domainColor(ag.agent) }} />
                    {ag.agent} · {ag.objective}
                  </span>
                ))}
              </div>
            ) : null}
            {Array.isArray(coordinatorDecision.missing_information) ? (
              <p className="mt-2 text-[11px] text-amber-200/70">
                missing: {(coordinatorDecision.missing_information as string[]).join(', ')}
              </p>
            ) : null}
          </Panel>
        ) : null}

        {(() => {
          const specialistRuns = (data.runs || []).filter((r) =>
            ['coordinator', 'traffic', 'pollution', 'energy'].includes(r.agent_name)
          );
          return (
            <Section title="Specialist agent runs" subtitle="Every specialist agent invoked by the coordinator with evidence citations">
              {specialistRuns.length ? <AgentActivity runs={specialistRuns} /> : <Empty title="No specialist agent runs recorded" />}
            </Section>
          );
        })()}

        <FusionCard data={data} />
      </div>

      <div className="space-y-5">
        {runsWithParsed.filter((r) => ['traffic', 'pollution', 'energy'].includes(r.agent_name)).map((r) => {
          if (!r.results.length) return null;
          return r.results.map((res) => {
            const pr = res.parsedResult;
            return (
              <Panel key={res.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold capitalize text-slate-100">{res.agent_name.replace(/_/g, ' ')}</p>
                  {typeof pr.confidence === 'number' ? (
                    <Chip className="border-white/[0.07]">{Math.round(pr.confidence * 100)}% confidence</Chip>
                  ) : null}
                </div>
                {pr.summary ? <p className="mt-2 text-sm leading-relaxed text-slate-300">{pr.summary}</p> : null}
                {pr.conclusion ? (
                  <p className="mt-2 rounded-lg bg-white/[0.03] p-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Conclusion · </span>{pr.conclusion}
                  </p>
                ) : null}
                <FindingsList title="Key findings" items={pr.key_findings} />
                <FindingsList title="Trade-offs" items={pr.tradeoffs} tone="amber" />
                <FindingsList title="Risks" items={pr.risks} tone="rose" />
                {Array.isArray(res.parsedEvidence) && res.parsedEvidence.length ? (
                  <div className="mt-3">
                    <EvidenceCards evidence={res.parsedEvidence as never[]} title="Citations" />
                  </div>
                ) : null}
              </Panel>
            );
          });
        })}
      </div>
    </div>
  );
}

function SpecialistStatus({ data }: { data: AnalysisDetail }) {
  const coordinator = data.analysis.coordinator_decision as Record<string, unknown> | null;
  const required = new Set((Array.isArray(coordinator?.required_agents) ? (coordinator.required_agents as Array<{ agent: string }>).map((a) => a.agent) : []));
  const failByAgent = new Map((data.analysis.specialist_failures || []).map((f) => [f.agent, f]));
  const complete = new Set(data.runs.filter((r) => r.status === 'complete' && ['traffic', 'pollution', 'energy'].includes(r.agent_name)).map((r) => r.agent_name));

  const specs: Array<{ agent: string; label: string }> = [
    { agent: 'traffic', label: 'Traffic Agent' },
    { agent: 'pollution', label: 'Pollution Agent' },
    { agent: 'energy', label: 'Energy Agent' },
  ];

  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04] text-slate-300"><Circle className="h-4 w-4" /></span>
        <p className="text-sm font-semibold text-slate-100">Specialist status</p>
        {data.analysis.specialist_failures?.length ? (
          <Chip className="border-amber-400/25 bg-amber-400/10 text-amber-300">{data.analysis.specialist_failures.length} unavailable</Chip>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        {specs.map((s) => {
          const fail = failByAgent.get(s.agent);
          const done = complete.has(s.agent);
          if (done) {
            return (
              <div key={s.agent} className="flex items-center gap-2 text-[12px]">
                <span className="chip border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">completed</span>
                <span className="text-slate-300">{s.label}</span>
              </div>
            );
          }
          if (fail) {
            return (
              <div key={s.agent} className="rounded-lg border border-rose-400/20 bg-rose-400/[0.05] p-2">
                <div className="flex items-center gap-2 text-[12px]">
                  <span className={fail.kind === 'unavailable' ? 'chip border border-amber-400/30 bg-amber-400/10 text-amber-300' : 'chip border border-rose-400/30 bg-rose-400/10 text-rose-300'}>
                    {fail.kind === 'unavailable' ? 'unavailable' : 'failed'}
                  </span>
                  <span className="text-slate-300">{s.label}</span>
                </div>
                <p className="mt-1 pl-1 text-[11px] leading-relaxed text-rose-200/70">{fail.reason}</p>
              </div>
            );
          }
          return (
            <div key={s.agent} className="flex items-center gap-2 text-[12px] text-slate-500">
              <span className="chip border border-white/[0.07] text-[10px] text-slate-500">{required.has(s.agent) ? 'pending' : 'not required'}</span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function FindingsList({ title, items, tone = 'default' }: { title: string; items?: string[]; tone?: 'default' | 'amber' | 'rose' }) {
  if (!items?.length) return null;
  const color = tone === 'amber' ? 'bg-amber-300' : tone === 'rose' ? 'bg-rose-300' : 'bg-cyan-300';
  const text = tone === 'amber' ? 'text-amber-200/80' : tone === 'rose' ? 'text-rose-200/80' : 'text-slate-400';
  return (
    <div className="mt-3">
      <p className="label mb-1">{title}</p>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it} className={`flex gap-1.5 text-xs ${text}`}>
            <span className={`mt-1 h-1 w-1 shrink-0 rounded-full ${color}`} />
            <span className="min-w-0">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FusionCard({ data }: { data: AnalysisDetail }) {
  const f = data.fusion_result;
  if (!f) return null;
  return (
    <Panel className="border-amber-400/20 p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400/10 text-amber-300"><GitBranch className="h-4 w-4" /></span>
        <p className="text-sm font-semibold text-slate-100">Fusion & trade-off analysis</p>
        <Chip className="border-amber-400/25 bg-amber-400/10 text-amber-300">cross-domain</Chip>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{f.summary}</p>
      {f.verdict ? (
        <p className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-2.5 text-xs leading-relaxed text-amber-100/90">
          <span className="font-semibold">Verdict: </span>{f.verdict}
        </p>
      ) : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <FindingsList title="Common findings" items={f.common_findings} />
        <FindingsList title="Conflicts" items={f.conflicting_findings} tone="amber" />
        <FindingsList title="Cross-domain impacts" items={f.cross_domain_impacts} />
        <FindingsList title="Trade-offs" items={f.tradeoffs} tone="amber" />
        <FindingsList title="Dependencies" items={f.dependencies} />
        <FindingsList title="Uncertainties" items={f.uncertainties} tone="rose" />
      </div>
    </Panel>
  );
}

/* ---------------- Recommendations ---------------- */

function RecsTab({ data, onChanged }: { data: AnalysisDetail; onChanged: () => void }) {
  const rec = data.recommendations;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  if (!rec) {
    if (data.analysis.status === 'insufficient_data') {
      return (
        <Empty
          title="Insufficient specialist data"
          hint="Every specialist agent was temporarily unavailable, so no recommendation was fabricated. The recorded failures and reasons are shown in the Agents tab."
        />
      );
    }
    if (data.analysis.status === 'recommendation_failed') {
      return (
        <Empty
          title="Recommendation generation failed"
          hint={
            data.analysis.recommendation_failure
              ? `The recommendation agent could not produce a valid response after its single compact retry: ${data.analysis.recommendation_failure}`
              : `The recommendation agent could not produce a valid response after its single compact retry.`
          }
        />
      );
    }
    return <Empty title="Recommendations not ready" hint="The pipeline is still running — recommendations appear when all specialist and fusion agents finish." />;
  }

  if (!rec.options?.length) {
    return <Empty title="No viable options" hint="Every option was filtered out by constraints. Check the authority loop or run a new analysis." />;
  }

  const recId = rec.id;
  const top = rec.options[0];

  async function approve(option: RecommendationOption) {
    setBusy(true);
    setErr('');
    try {
      await api.post(`/api/planner/recommendations/${option.id}/approve`, { json: { planner_notes: note || undefined } });
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setBusy(false);
    }
  }

  async function revise() {
    setBusy(true);
    setErr('');
    try {
      await api.post(`/api/planner/recommendations/${recId}/revise`, { json: { notes: note || undefined } });
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Revision failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Panel glow className="p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold text-slate-100">Option comparison</p>
              <Badge tone="info">rec #{rec.id} · {humanStatus(rec.status)}</Badge>
            </div>
            <span className="text-[11px] text-slate-500">impact vs feasibility</span>
          </div>
          <CompareChart options={rec.options} />
        </Panel>

        <Panel className="p-5">
          <p className="label mb-2">Recommendation state</p>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusPill status={rec.status} /></div>
            <div className="flex justify-between"><span className="text-slate-500">Options</span><span className="font-semibold text-slate-200">{rec.options.length}</span></div>
            {rec.final_option_id ? (
              <div className="flex justify-between"><span className="text-slate-500">Planner pick</span><span className="font-mono text-cyan-300">#{rec.final_option_id}</span></div>
            ) : null}
            {rec.planner_notes ? <p className="rounded-lg bg-white/[0.03] p-2 text-xs text-slate-400">{rec.planner_notes}</p> : null}
          </div>
          <div className="mt-4 space-y-2">
            <p className="label">Planner decision log</p>
            <div className="space-y-1.5">
              {decisionLog(rec.status).map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  {s.done ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Circle className="h-3.5 w-3.5 text-slate-600" />}
                  <span className={s.done ? 'text-slate-300' : 'text-slate-500'}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {rec.xai_explanation ? (
        <Panel glow className="p-4 border-cyan-500/30 bg-cyan-950/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-100">
                Explainable AI (XAI) Ranking Rationale
              </p>
            </div>
            <Chip className="border-cyan-400/30 bg-cyan-400/10 text-cyan-300">deterministic audit</Chip>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            {rec.xai_explanation}
          </p>
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {rec.options.map((o, i) => (
          <RecommendationCard
            key={o.id}
            option={o}
            selected={selectedId === o.id}
            onSelect={() => setSelectedId(o.id)}
            notes={o.revised_from_id ? `Revised from option #${o.revised_from_id} after authority input` : undefined}
            action={
              <div className="flex flex-wrap items-center gap-2">
                {rec.status !== 'approved' ? (
                  <>
                    <button className="btn-primary flex-1 !py-2 text-xs" disabled={busy} onClick={() => approve(o)}>
                      <ThumbsUp className="h-3.5 w-3.5" /> Approve #{i + 1}
                    </button>
                    <button className="btn-ghost flex-1 !py-2 text-xs" disabled={busy} onClick={revise}>
                      <RefreshCw className="h-3.5 w-3.5" /> Revise with note
                    </button>
                  </>
                ) : o.is_recommended ? (
                  <span className="chip border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"><Check className="h-3 w-3" /> Approved by planner</span>
                ) : null}
              </div>
            }
          />
        ))}
      </div>

      <Panel className="p-4">
        <Field label="Planner decision note (optional)">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Prioritise feeder reinforcement ahead of the monsoon…" />
        </Field>
        {err ? <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{err}</p> : null}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <p className="text-sm font-semibold text-slate-100">Data gaps & assumptions</p>
            </div>
            {rec.uncertainty ? <Chip className="border-amber-400/25 bg-amber-400/10 text-amber-300">provisional</Chip> : null}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">What the recommendation is based on, and what must be verified before implementation.</p>
          {rec.missing_information?.length ? <FindingsList title="Missing information" items={rec.missing_information} tone="amber" /> : null}
          {rec.assumptions?.length ? <FindingsList title="Assumptions made" items={rec.assumptions} /> : null}
          {rec.uncertainty ? (
            <p className="mt-3 rounded-lg bg-white/[0.03] p-2 text-xs italic text-slate-400">{rec.uncertainty}</p>
          ) : null}
          {rec.verification_needed?.length ? <FindingsList title="Verify before implementation" items={rec.verification_needed} /> : null}
          {!rec.missing_information?.length && !rec.assumptions?.length && !rec.verification_needed?.length && !rec.uncertainty ? (
            <p className="mt-3 text-xs text-slate-500">No explicit data gaps were flagged for this recommendation.</p>
          ) : null}
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold text-slate-100">Refinement history</p>
            {rec.refinement_log?.length ? <Badge tone="info">{rec.refinement_log.length} refinement{rec.refinement_log.length === 1 ? '' : 's'}</Badge> : null}
          </div>
          {rec.refinement_log?.length ? (
            <div className="mt-3 space-y-3">
              {rec.refinement_log.map((e, i) => (
                <div key={i} className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-cyan-200">Refined after authority response</p>
                    <span className="text-[10px] text-slate-500">{timeAgo(e.at)}</span>
                  </div>
                  <p className="mt-1.5 text-xs italic leading-relaxed text-slate-400">“{e.authority_response}”</p>
                  <div className="mt-2 space-y-1">
                    {e.what_changed?.length ? (
                      <ul className="space-y-0.5 text-[11px] text-slate-300">
                        {e.what_changed.map((w, j) => (
                          <li key={j} className="flex gap-1.5"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-cyan-300" />{w}</li>
                        ))}
                      </ul>
                    ) : null}
                    {e.why_changed ? <p className="text-[11px] text-slate-400"><span className="text-slate-500">Why: </span>{e.why_changed}</p> : null}
                    {e.authority_information_used ? <p className="text-[11px] text-slate-400"><span className="text-slate-500">Authority info used: </span>{e.authority_information_used}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">No authority response has been folded in yet.</p>
          )}
        </Panel>
      </div>

      {top ? <div className="text-right"><Chip className="border-cyan-400/25 bg-cyan-400/10 text-cyan-300">best viability {Math.round(top.viability)}%</Chip></div> : null}
    </div>
  );
}

function decisionLog(status: string) {
  const steps = ['Drafted', 'Approved', 'Implemented', 'Measured'];
  const idx = /approved/.test(status) ? 1 : /implement|deploy/.test(status) ? 2 : /kpi|measure/.test(status) ? 3 : 0;
  return steps.map((label, i) => ({ label, done: i <= idx }));
}

/* ---------------- Authority loop ---------------- */

function requestKindLabel(t?: string): string {
  if (t === 'SUPPORT_REQUEST' || t === 'COORDINATION_REQUEST') return 'Coordination & support request';
  return 'Clarification / information request';
}

function requestKindHint(t?: string): string {
  if (t === 'SUPPORT_REQUEST' || t === 'COORDINATION_REQUEST') {
    return 'Asks the authority to coordinate, evaluate and support implementation of the recommended intervention.';
  }
  return 'Asks the authority for information still missing before the recommendation can be finalised.';
}

function AuthorityTab({ data, onChanged }: { data: AnalysisDetail; onChanged: () => void }) {
  const clar = data.clarifications?.[0];
  const [message, setMessage] = useState(clar?.message ?? '');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (clar) setMessage((m) => m || clar.message);
  }, [clar?.id, clar?.message]);

  if (!clar) {
    if (data.analysis.status === 'insufficient_data') {
      return (
        <Panel className="border-rose-400/20 p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-400/10 text-rose-300"><Circle className="h-4 w-4" /></span>
            <p className="text-sm font-semibold text-slate-100">No authority routing</p>
            <StatusPill status="insufficient_data" />
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            Every specialist agent was temporarily unavailable, so no recommendation — and therefore no authority interaction — was produced.
            The recorded failures and reasons are shown in the Agents tab.
          </p>
        </Panel>
      );
    }
    if (data.analysis.status === 'recommendation_failed') {
      return (
        <Panel className="border-rose-400/20 p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-400/10 text-rose-300"><Circle className="h-4 w-4" /></span>
            <p className="text-sm font-semibold text-slate-100">No authority routing</p>
            <StatusPill status="recommendation_failed" />
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            The recommendation could not be generated, so no authority interaction was created.
            {data.analysis.recommendation_failure ? ` Reason: ${data.analysis.recommendation_failure}` : ''}
          </p>
        </Panel>
      );
    }
    if (!data.recommendations) {
      return (
        <Empty
          title="Authority requirement is being assessed"
          hint="The recommendation must be produced before the system can tell whether external authority involvement is needed. Check back once the agents finish."
        />
      );
    }
    const coordinator = data.analysis.coordinator_decision as Record<string, unknown> | null;
    const missing = Array.isArray(coordinator?.missing_information) ? (coordinator.missing_information as string[]) : [];
    return (
      <Panel className="border-emerald-400/20 p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><CheckCircle2 className="h-4 w-4" /></span>
          <p className="text-sm font-semibold text-slate-100">No authority involvement required</p>
          <Chip className="border-emerald-400/25 bg-emerald-400/10 text-emerald-300">finalise locally</Chip>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
          This analysis's specialist agents had enough evidence to finalise the recommendation without routing a request to an external authority.
          The planner can approve an option directly in the Recommendations tab.
        </p>
        {missing.length ? (
          <p className="mt-3 rounded-lg bg-white/[0.03] p-2 text-[11px] text-amber-200/70">
            residual gaps to weigh: {missing.join(', ')}
          </p>
        ) : null}
        {data.analysis.status === 'rejected' ? (
          <p className="mt-2 text-[11px] text-slate-500">A drafted request was rejected by the planner; the recommendation stands without authority input.</p>
        ) : null}
      </Panel>
    );
  }

  async function act(endpoint: string, body?: Record<string, unknown>) {
    setBusy(true);
    setErr('');
    try {
      await api.post(`/api/planner/clarifications/${clar.id}/${endpoint}`, { json: body });
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  const notSent = clar.status === 'draft';
  const workflow = [
    { label: 'Initial recommendation produced', done: !!data.recommendations },
    { label: 'Authority requirement assessed', done: !!data.recommendations },
    { label: 'Request drafted by AI', done: true },
    { label: 'Planner approves & sends', done: !notSent },
    { label: 'Authority acknowledges / responds', done: clar.status === 'acknowledged' || clar.status === 'responded' },
    { label: 'AI refines recommendation', done: data.analysis.status === 'refined' || data.recommendations?.status === 'revised' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel glow className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><Building2 className="h-4 w-4" /></span>
            <p className="text-sm font-semibold text-slate-100">{clar.authority_name}</p>
            <Chip className="border-white/[0.07] font-mono">{clar.authority_code}</Chip>
            <Chip className="border-cyan-400/25 bg-cyan-400/10 text-cyan-300">{requestKindLabel(clar.request_type)}</Chip>
            <StatusPill status={clar.status} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{requestKindHint(clar.request_type)}</p>
          <p className="mt-2 text-xs text-slate-500">Reason: {clar.reason}</p>
          {data.analysis.coordinator_decision && (data.analysis.coordinator_decision as Record<string, unknown>)?.new_specialist_required ? (
            <p className="mt-2 rounded-lg bg-amber-400/[0.06] p-2 text-[11px] text-amber-200/80">
              Specialist coverage gap: {(data.analysis.coordinator_decision as Record<string, unknown>).new_specialist_reason as string}
            </p>
          ) : null}

          {notSent ? (
            <div className="mt-4 space-y-3">
              <p className="label">AI-drafted request (editable before send)</p>
              <textarea className="input min-h-[120px] resize-y" value={message} onChange={(e) => setMessage(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" disabled={busy} onClick={() => act('edit', { message })}>
                  <Check className="h-4 w-4" /> Save edits
                </button>
                <button className="btn-primary !bg-emerald-400/90 hover:!bg-emerald-300" disabled={busy} onClick={() => act('approve-send', notes.trim() ? { planner_notes: notes.trim() } : undefined)}>
                  <Send className="h-4 w-4" /> Approve & Send
                </button>
                <button className="btn-danger" disabled={busy} onClick={() => act('reject', notes.trim() ? { planner_notes: notes.trim() } : undefined)}>
                  <X className="h-4 w-4" /> Reject request
                </button>
              </div>
              <Field label="Planner note (optional)">
                <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context for the authority…" />
              </Field>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-ink-950/60 p-4">
              <p className="label mb-1.5">Request sent to {clar.authority_name}</p>
              <p className="text-sm leading-relaxed text-slate-200">{clar.message}</p>
              {clar.sent_at ? <p className="mt-2 text-[10px] text-slate-500">sent {formatDate(clar.sent_at)}</p> : null}
            </div>
          )}

          {err ? <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{err}</p> : null}
        </Panel>

        <Panel className="p-5">
          <p className="label mb-3">Workflow</p>
          <div className="space-y-4">
            {workflow.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                {s.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />}
                <p className={'text-[13px] ' + (s.done ? 'text-slate-200' : 'text-slate-500')}>{s.label}</p>
                {i === workflow.length - 1 && (data.analysis.status === 'refined' || data.recommendations?.status === 'revised') ? (
                  <ChatAnswer visible onChanged={onChanged} />
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <ResponsesThread clar={clar} />
    </div>
  );
}

function ChatAnswer({ visible, onChanged }: { visible: boolean; onChanged: () => void }) {
  if (!visible) return null;
  void onChanged;
  return null;
}

function ResponsesThread({ clar }: { clar: ClarificationRequest }) {
  if (!clar.responses?.length) return null;
  return (
    <Section title="Authority thread" subtitle="The AI-interpreted response has already been folded into the refined options">
      <div className="space-y-3">
        {clar.responses.map((r) => {
          const interp = r.ai_interpretation as Interpretation | null;
          return (
            <Panel key={r.id} className="border-emerald-400/15 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><Handshake className="h-4 w-4" /></span>
                  <p className="text-[13px] font-semibold text-slate-100">{clar.authority_name} responded</p>
                </div>
                <span className="text-[10px] text-slate-500">{timeAgo(r.received_at)}</span>
              </div>
              <p className="mt-2 text-sm italic leading-relaxed text-slate-300">“{r.response}”</p>
              {interp ? (
                <div className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                    <p className="label">AI interpretation</p>
                    <Chip className="border-cyan-400/25 bg-cyan-400/10 text-cyan-300">{interp.provides_clarification ? 'clarifies' : 'partial'}</Chip>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{interp.acknowledgement}</p>
                  <p className="mt-1 text-xs text-slate-400">{interp.new_information_summary}</p>
                  {interp.constraints_or_conditions?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {interp.constraints_or_conditions.map((c, i) => (
                        <span key={i} className="chip border border-amber-400/25 bg-amber-400/10 text-amber-200">{c}</span>
                      ))}
                    </div>
                  ) : null}
                  {interp.requested_changes?.length ? (
                    <div className="mt-2">
                      <p className="label mb-1">Requested changes</p>
                      <ul className="space-y-1 text-xs text-rose-200/90">
                        {interp.requested_changes.map((c) => <li key={c} className="flex gap-1.5"><span className="mt-1 h-1 w-1 rounded-full bg-rose-300" />{c}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Panel>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------------- Deployment & KPIs ---------------- */

function DeployTab({ data, onChanged }: { data: AnalysisDetail; onChanged: () => void }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ImplementationPanel data={data} onChanged={onChanged} />
      <KpiPanel data={data} />
    </div>
  );
}

function ImplementationPanel({ data, onChanged }: { data: AnalysisDetail; onChanged: () => void }) {
  const rec = data.recommendations;
  const recId = rec?.id;
  const [impls, setImpls] = useState<Array<{ id: number; recommendation_id: number; status: string; notes: string; milestones: string; started_at: string; completed_at: string | null }>>([]);
  const [optionId, setOptionId] = useState<number | ''>('');
  const [milestones, setMilestones] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!recId) return;
    api
      .get<{ implementations: unknown[] }>('/api/planner/implementation')
      .then(({ data: d }) => setImpls(d.implementations as never[]))
      .catch(() => {});
  }, [recId, data.analysis.status]);

  if (!recId) return <Empty title="No recommendation to deploy" />;

  const mine = impls.filter((i) => i.recommendation_id === recId);

  async function start() {
    setBusy(true);
    setErr('');
    try {
      await api.post('/api/planner/implementation', {
        json: {
          recommendationId: recId,
          recommendationOptionId: optionId || undefined,
          status: 'planned',
          milestones: milestones.split('\n').map((s) => s.trim()).filter(Boolean),
          notes,
        },
      });
      setMilestones('');
      setNotes('');
      setOptionId('');
      onChanged();
      const d = await api.get<{ implementations: unknown[] }>('/api/planner/implementation');
      setImpls(d.data.implementations as never[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(implId: number, status: string) {
    await api.patch(`/api/planner/implementation/${implId}`, { json: { status } });
    onChanged();
    const d = await api.get<{ implementations: unknown[] }>('/api/planner/implementation');
    setImpls(d.data.implementations as never[]);
  }

  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg text-cyan-300" style={{ background: 'rgba(34,211,238,0.1)' }}><Wrench className="h-4 w-4" /></span>
        <p className="text-sm font-semibold text-slate-100">Implementation tracking</p>
        <Badge tone="info">recommendation #{recId}</Badge>
      </div>

      {!mine.length ? (
        <div className="mt-4 space-y-3">
          <Field label="Option to deploy">
            <select className="input" value={optionId} onChange={(e) => setOptionId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Recommended default…</option>
              {rec?.options.map((o) => <option key={o.id} value={o.id}>#{o.rank} {o.name} · {formatInr(o.est_cost_inr)}</option>)}
            </select>
          </Field>
          <Field label="Milestones (one per line)">
            <textarea className="input min-h-[70px]" value={milestones} onChange={(e) => setMilestones(e.target.value)} placeholder={'Procurement & award\nSite works start\nStakeholder review\nCommissioning'} />
          </Field>
          <Field label="Notes">
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any constraints or coordination notes…" />
          </Field>
          {err ? <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{err}</p> : null}
          <button className="btn-primary w-full" disabled={busy} onClick={start}><Zap className="h-4 w-4" /> Start deployment</button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {mine.map((i) => (
            <div key={i.id} className="rounded-xl border border-white/[0.07] bg-ink-950/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusPill status={i.status} />
                  <span className="font-mono text-[10px] text-slate-500">deploy #{i.id}</span>
                </div>
                <div className="flex gap-1.5">
                  {i.status === 'planned' ? <button className="btn-ghost !px-2.5 !py-1 text-[11px]" onClick={() => updateStatus(i.id, 'in_progress')}>Start</button> : null}
                  {i.status === 'in_progress' ? <button className="btn-ghost !px-2.5 !py-1 text-[11px]" onClick={() => updateStatus(i.id, 'completed')}>Complete</button> : null}
                </div>
              </div>
              {milestonesList(i.milestones).length ? (
                <ul className="mt-3 space-y-1.5">
                  {milestonesList(i.milestones).map((m, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="grid h-5 w-5 place-items-center rounded-md bg-white/[0.04] font-mono text-[9px] text-slate-500">{j + 1}</span>
                      {m}
                    </li>
                  ))}
                </ul>
              ) : null}
              {i.notes ? <p className="mt-2 text-[11px] text-slate-500">{i.notes}</p> : null}
              <p className="mt-2 text-[10px] text-slate-600">started {formatDate(i.started_at)}{i.completed_at ? ` · completed ${formatDate(i.completed_at)}` : ''}</p>
            </div>
          ))}
          <div>
            <button className="btn-ghost text-xs" onClick={async () => {
              setImpls((await api.get<{ implementations: never[] }>('/api/planner/implementation')).data.implementations);
            }}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function milestonesList(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map(String) : [String(raw)];
  } catch {
    return [String(raw)];
  }
}

function KpiPanel({ data }: { data: AnalysisDetail }) {
  const recId = data.recommendations?.id;
  const [kpis, setKpis] = useState<KpiRow[] | null>(null);
  const [rows, setRows] = useState([{ metric: 'avg_speed_kmh', predicted: '', observed: '', lowerIsBetter: false }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [memory, setMemory] = useState<Memory | null>(null);

  useEffect(() => {
    if (!recId) return;
    api
      .get<{ kpis: KpiRow[] }>(`/api/planner/kpis/${recId}`)
      .then(({ data }) => setKpis(data.kpis))
      .catch(() => setKpis([]));
  }, [recId]);

  if (!recId) return <Empty title="No recommendation to measure" />;

  async function submit() {
    setBusy(true);
    setErr('');
    setMemory(null);
    try {
      const payload = rows
        .filter((r) => r.metric.trim())
        .map((r) => ({
          metricName: r.metric.trim(),
          predicted: r.predicted.trim() ? Number(r.predicted.trim()) : undefined,
          observed: r.observed.trim() ? Number(r.observed.trim()) : undefined,
          lowerIsBetter: r.lowerIsBetter,
        }));
      if (!payload.length) {
        setErr('Add at least one metric.');
        return;
      }
      const { data: d } = await api.post<{ kpis: KpiRow[]; memory: Memory | null }>('/api/planner/kpis', { json: { recommendationId: recId, kpis: payload } });
      setKpis(d.kpis);
      setMemory(d.memory);
      setRows([{ metric: '', predicted: '', observed: '', lowerIsBetter: false }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'KPI save failed');
    } finally {
      setBusy(false);
    }
  }

  const METRICS = ['avg_speed_kmh', 'network_avg_speed', 'avg_delay_seconds', 'transport_aqi', 'pm25', 'feeder_utilization', 'interruption_hours', 'open_complaints', 'resolution_days', 'citizen_feedback', 'implementation_cost'];

  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg text-cyan-300" style={{ background: 'rgba(34,211,238,0.1)' }}><Zap className="h-4 w-4" /></span>
        <p className="text-sm font-semibold text-slate-100">KPI & outcome feedback</p>
        <Badge tone="info">feeds agent memory</Badge>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-white/[0.06] bg-ink-950/50 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <select className="input !py-2 text-xs" value={r.metric} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, metric: e.target.value } : x)))}>
                <option value="">metric…</option>
                {METRICS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input className="input !py-2 text-xs" placeholder="predicted" value={r.predicted} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, predicted: e.target.value } : x)))} />
              <input className="input !py-2 text-xs" placeholder="observed" value={r.observed} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, observed: e.target.value } : x)))} />
            </div>
            <label className="flex items-center gap-2 text-[11px] text-slate-400">
              <input type="checkbox" checked={r.lowerIsBetter} className="accent-cyan-400" onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, lowerIsBetter: e.target.checked } : x)))} />
              lower is better
            </label>
          </div>
        ))}
        <button className="btn-ghost !py-1.5 text-xs" onClick={() => setRows((rs) => [...rs, { metric: '', predicted: '', observed: '', lowerIsBetter: false }])}>+ Add metric</button>

        {err ? <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{err}</p> : null}
        <button className="btn-primary w-full" disabled={busy} onClick={submit}>
          {busy ? <Spinner className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />} Record outcomes → write memory
        </button>
      </div>

      {kpis && kpis.length ? (
        <div className="mt-5">
          <p className="label mb-2">Measured outcomes</p>
          <div className="space-y-2">
            {kpis.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-slate-200">{k.metric_name}</p>
                  <p className="text-[10px] text-slate-500">{k.unit || ''} · measured {timeAgo(k.measured_at)}</p>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-slate-500">Δ {k.delta ?? '—'}</span>
                  <span className="text-cyan-300">{k.observed ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {memory ? (
        <div className="mt-5 rounded-xl border border-violet-400/25 bg-violet-400/[0.06] p-4 animate-fade-up">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-300" />
            <p className="text-sm font-semibold text-violet-200">Agent memory written</p>
            <Chip className="border-violet-400/30 bg-violet-400/10 text-violet-300">RAG index update</Chip>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">{memory.summary || memory.kpi_summary}</p>
          {memory.tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {memory.tags.map((t) => <span key={t} className="chip border border-white/[0.08] bg-white/[0.03] text-[10px] text-slate-400">{t}</span>)}
            </div>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}