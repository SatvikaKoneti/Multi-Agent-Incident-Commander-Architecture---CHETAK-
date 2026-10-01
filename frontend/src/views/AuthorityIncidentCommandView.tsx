import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Handshake,
  Landmark,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { api, setToken, setStoredUser } from '../lib/api';
import type {
  AuthorityEntity,
  AuthorityRequestDetail,
  ClarificationRequest,
  Interpretation,
  ProblemCluster,
  User,
} from '../lib/types';
import { DEMO_LOGINS, formatDate, formatNum, scoreColor, timeAgo } from '../lib/format';
import { navigate } from '../lib/router';
import { Chip, Empty, ErrorBlock, Field, Loading, Panel, Section, StatusPill, Tabs } from '../components/MissionControlUiComponents';
import { KV } from '../components/IncidentTimelineFlowComponents';

export default function AuthorityRouter({ rest }: { rest: string[] }) {
  if (rest[0] === 'requests' && rest[1]) return <RequestDetail id={Number(rest[1])} />;
  return <AuthorityDashboard />;
}

/* ---------------- Authority Dashboard ---------------- */

function AuthorityDashboard() {
  const [tab, setTab] = useState<'inbox' | 'clusters' | 'directory'>('inbox');
  const [data, setData] = useState<{
    authority: AuthorityEntity | null;
    inbox: ClarificationRequest[];
    availableAuthorities?: AuthorityEntity[];
  } | null>(null);
  const [clusters, setClusters] = useState<ProblemCluster[]>([]);
  const [allAuthorities, setAllAuthorities] = useState<AuthorityEntity[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const load = () => {
    setLoading(true);
    setErr('');
    Promise.all([
      api.get<{ authority: AuthorityEntity | null; inbox: ClarificationRequest[]; availableAuthorities?: AuthorityEntity[] }>('/api/authority/inbox'),
      api.get<{ clusters: ProblemCluster[] }>('/api/authority/clusters').catch(() => ({ data: { clusters: [] } })),
      api.get<{ authorities: AuthorityEntity[] }>('/api/authority/list').catch(() => ({ data: { authorities: [] } })),
    ])
      .then(([inboxRes, clusterRes, authListRes]) => {
        setData(inboxRes.data);
        setClusters(clusterRes.data.clusters || []);
        setAllAuthorities(authListRes.data.authorities || []);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const switchAuthority = async (loginKey: keyof typeof DEMO_LOGINS) => {
    setSwitching(true);
    try {
      const { data: d } = await api.post<{ token: string; user: User }>('/api/auth/login', { json: DEMO_LOGINS[loginKey] });
      setToken(d.token);
      setStoredUser(d.user);
      window.location.hash = '#/authority';
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Switch failed');
    } finally {
      setSwitching(false);
    }
  };

  if (err && !data) return <ErrorBlock error={err} onRetry={load} />;
  if (loading && !data) return <Loading label="Connecting to Civic Authority Portal…" />;

  const auth = data?.authority;

  const DEMO_AUTHORITY_KEYS: Record<string, keyof typeof DEMO_LOGINS> = {
    TSSPDCL: 'authority_tsspdcl',
    GHMC: 'authority_ghmc',
    HTP: 'authority_htp',
    TSPCB: 'authority_tspcb',
    HMWSSB: 'authority_hmwssb',
    'GHMC-SWM': 'authority_swm',
    TSRTC: 'authority_tsrtc',
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header Bar */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
              Civic Authority Portal
            </h1>
            <Chip className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono text-xs">
              {auth?.code || 'AUTHORITY'}
            </Chip>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-world Hyderabad civic agency decision workspace & planner coordination portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Authority Quick Switcher Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-ink-950 p-1">
            <ShieldCheck className="h-4 w-4 text-emerald-300 ml-2" />
            <select
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none pr-2 py-1 cursor-pointer"
              value={auth?.code || 'TSSPDCL'}
              onChange={(e) => {
                const code = e.target.value;
                const key = DEMO_AUTHORITY_KEYS[code] || 'authority';
                switchAuthority(key);
              }}
              disabled={switching}
            >
              <option value="GHMC">GHMC Municipal</option>
              <option value="HTP">Hyderabad Traffic Police (HTP)</option>
              <option value="TSPCB">Pollution Control Board (TSPCB)</option>
              <option value="TSSPDCL">TSSPDCL Power</option>
              <option value="HMWSSB">Water & Sewerage (HMWSSB)</option>
              <option value="GHMC-SWM">Solid Waste (GHMC-SWM)</option>
              <option value="TSRTC">Transport (TSRTC)</option>
            </select>
          </div>

          <button className="btn-ghost text-xs" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Authority Profile Card */}
      {auth ? (
        <Panel glow className="p-5 border-emerald-400/20 bg-emerald-400/[0.02]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300 shadow-glow">
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-100">{auth.name}</h2>
                <p className="font-mono text-xs text-slate-400 mt-0.5">
                  Code: <strong className="text-emerald-300">{auth.code}</strong> · Domain:{' '}
                  <span className="text-slate-300">{auth.domain}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip className="border-white/[0.08] text-slate-300">
                SLA: {auth.sla_hours || 48}h Response Window
              </Chip>
              <Chip className="border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                {auth.jurisdiction || 'Hyderabad Metropolitan Area'}
              </Chip>
              <span className="chip border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 flex items-center gap-1 font-semibold">
                <Handshake className="h-3 w-3" /> Active Official Portal
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-300 border-t border-white/[0.06] pt-3">
            {auth.responsibility || auth.domain}
          </p>

          {/* Assigned Categories */}
          {auth.assigned_categories?.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Managed Categories:</span>
              {auth.assigned_categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
                >
                  {cat}
                </span>
              ))}
            </div>
          ) : null}
        </Panel>
      ) : (
        <Panel className="p-4">
          <p className="text-xs text-amber-200/90">
            No authority code linked to this account. Use the top right selector to switch authority profiles.
          </p>
        </Panel>
      )}

      {/* Navigation Tabs */}
      <Tabs
        value={tab}
        onChange={(t) => setTab(t as typeof tab)}
        tabs={[
          { key: 'inbox', label: `Planner Requests Inbox (${data?.inbox.length || 0})` },
          { key: 'clusters', label: `Assigned Problem Clusters (${clusters.length})` },
          { key: 'directory', label: `Authority Directory (${allAuthorities.length || 8})` },
        ]}
      />

      {/* Tab 1: Inbox */}
      {tab === 'inbox' ? (
        <Section
          title={`Incoming Planner Requests (${data?.inbox.length || 0})`}
          subtitle={`Clarifications & coordination requests sent by AI planning engine to ${auth?.code || 'your agency'}`}
        >
          {!data?.inbox.length ? (
            <Empty
              title="Inbox Clear"
              hint="When a planner approves and sends a clarification request for your domain, it will appear here."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.inbox.map((r) => (
                <Panel
                  key={r.id}
                  hover
                  className="flex flex-col gap-2 p-4 cursor-pointer"
                  onClick={() => navigate(`/authority/requests/${r.id}`)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="chip border-white/[0.07] font-mono text-[10px]">
                      Req #{r.id} · Analysis #{r.analysis_id}
                    </span>
                    <StatusPill status={r.status} />
                  </div>
                  <p className="text-[13px] leading-relaxed text-slate-200 font-medium">
                    “{r.message}”
                  </p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 pt-2 border-t border-white/[0.04]">
                    <span>{r.sent_at ? `Sent ${timeAgo(r.sent_at)}` : ''}</span>
                    <span className="text-cyan-300 hover:underline font-bold">View & Respond →</span>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </Section>
      ) : null}

      {/* Tab 2: Assigned Problem Clusters */}
      {tab === 'clusters' ? (
        <Section
          title={`Assigned Problem Clusters — ${auth?.code || 'Authority'}`}
          subtitle={`City-wide urban problem clusters matching ${auth?.name || 'agency'} domain categories`}
        >
          {!clusters.length ? (
            <Empty
              title="No active problem clusters assigned"
              hint="Problems created under your authority categories will automatically route here."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-ink-900/60 shadow-panel backdrop-blur">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] uppercase text-slate-400 font-mono">
                  <tr>
                    <th className="py-3 px-4">Locality Area</th>
                    <th className="py-3 px-4">Problem Cluster</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Reports</th>
                    <th className="py-3 px-4 text-center">Priority</th>
                    <th className="py-3 px-4">SLA / Target</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {clusters.map((c) => (
                    <tr key={c.cluster_id} className="hover:bg-white/[0.03] transition">
                      <td className="py-3 px-4 font-bold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                          <span>{c.locality_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-100 text-xs">{c.title}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-[240px]">
                          {c.representative_complaint.description}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <Chip className="border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                          {c.category}
                        </Chip>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                        {c.report_count}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold" style={{ color: scoreColor(c.priority_score) }}>
                        {c.priority_score.toFixed(0)} ({c.priority_level.level})
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-mono text-xs font-bold ${c.is_overdue ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {c.is_overdue ? `OVERDUE (+${c.elapsed_hours - c.sla_hours}h)` : `${c.remaining_hours}h remaining`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusPill status={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      ) : null}

      {/* Tab 3: Authority Directory */}
      {tab === 'directory' ? (
        <Section
          title="Hyderabad Civic Authority Directory & Responsibility Matrix"
          subtitle="All registered real-world municipal authorities and domain categories supported by the platform"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allAuthorities.map((item) => {
              const isCurrent = item.code === auth?.code;
              return (
                <Panel
                  key={item.code}
                  className={`p-4 flex flex-col gap-2.5 transition ${
                    isCurrent ? 'border-emerald-400/40 bg-emerald-400/[0.04]' : 'hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`h-4 w-4 ${isCurrent ? 'text-emerald-300' : 'text-slate-400'}`} />
                      <span className="font-bold text-slate-100 text-sm">{item.name}</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-emerald-300 border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{item.responsibility}</p>

                  <div className="mt-auto pt-2 border-t border-white/[0.06] space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-300">Domain: {item.domain}</p>
                    {item.assigned_categories?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {item.assigned_categories.map((cat) => (
                          <span key={cat} className="text-[9px] font-semibold text-cyan-300 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {DEMO_AUTHORITY_KEYS[item.code] ? (
                    <button
                      onClick={() => switchAuthority(DEMO_AUTHORITY_KEYS[item.code])}
                      className="btn-secondary w-full py-1 text-xs mt-2 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                    >
                      Switch to {item.code} Portal →
                    </button>
                  ) : null}
                </Panel>
              );
            })}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

/* ---------------- Request Detail View ---------------- */

function RequestDetail({ id }: { id: number }) {
  const [data, setData] = useState<AuthorityRequestDetail | null>(null);
  const [err, setErr] = useState('');
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);
  const [sorry, setSorry] = useState('');
  const [refined, setRefined] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<AuthorityRequestDetail>(`/api/authority/requests/${id}`);
      setData(data);
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function acknowledge() {
    setBusy(true);
    setSorry('');
    try {
      await api.post(`/api/authority/requests/${id}/acknowledge`);
      await load();
    } catch (e) {
      setSorry(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function respond() {
    setBusy(true);
    setSorry('');
    setRefined(null);
    try {
      const { data: d } = await api.post<{ refined_options?: { ranked?: unknown[] } | null }>(`/api/authority/requests/${id}/respond`, {
        json: { response },
      });
      if (d.refined_options) setRefined(d.refined_options as unknown as Record<string, unknown>);
      setResponse('');
      await load();
    } catch (e) {
      setSorry(e instanceof Error ? e.message : 'Respond failed');
    } finally {
      setBusy(false);
    }
  }

  if (err && !data) return <ErrorBlock error={err} onRetry={load} />;
  if (!data) return <Loading label="Opening request…" />;

  const r = data.request;
  const a = data.analysis;
  const interpretations = data.responses.filter((x) => x.ai_interpretation);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-ghost !px-3 !py-2 text-xs" onClick={() => navigate('/authority')}>
          <ArrowLeft className="h-4 w-4" /> Inbox
        </button>
        <span className="chip border-white/[0.07] font-mono text-[10px]">Req #{r.id}</span>
        <StatusPill status={r.status} />
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Landmark className="h-3.5 w-3.5" /> {data.locality?.name ?? '—'}
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" /> {a?.category ?? '—'}
          </div>
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Panel glow className="p-5">
            <p className="label">AI-generated question from the planner</p>
            <p className="mt-2 text-base leading-relaxed text-slate-100 font-medium">“{r.message}”</p>
            <p className="mt-3 text-xs text-slate-500">Reason recorded by coordination engine: {r.reason}</p>
          </Panel>

          {a ? (
            <Panel className="p-5">
              <p className="label mb-2">Problem context</p>
              <p className="text-[15px] font-semibold text-slate-100">{a.problem_title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{a.problem_description}</p>
            </Panel>
          ) : null}

          {data.responses.length ? (
            <Section title={`Thread · ${data.responses.length} response${data.responses.length > 1 ? 's' : ''}`}>
              <div className="space-y-2">
                {data.responses.map((resp) => (
                  <Panel key={resp.id} className="border-emerald-400/15 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Chip className="border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
                        <Send className="h-3 w-3" /> Sent Official Response
                      </Chip>
                      <span className="text-[10px] text-slate-500">{timeAgo(resp.received_at)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200">{resp.response}</p>
                    {interpretationView(resp.ai_interpretation as Interpretation | null)}
                  </Panel>
                ))}
              </div>
            </Section>
          ) : null}
        </div>

        <div className="h-fit space-y-4">
          <Panel className="p-5">
            <p className="label mb-3">Your Official Authority Response</p>
            {r.status === 'responded' ? (
              <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-200">
                Response submitted. The AI planning pipeline has updated recommendations based on your data.
              </p>
            ) : r.status === 'acknowledged' ? (
              <>
                <Field label="Provide requested authority data or approval">
                  <textarea
                    className="input min-h-[132px] resize-y text-xs"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="e.g. Approved field repair schedule for Kukatpally feeder. Feeder load data attached..."
                  />
                </Field>
                <button className="btn-primary mt-3 w-full" disabled={busy || !response.trim()} onClick={respond}>
                  <Send className="h-4 w-4" /> Submit Official Response
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400">Acknowledge receipt of request first, then provide authority response data.</p>
                <button className="btn-primary mt-3 w-full" disabled={busy} onClick={acknowledge}>
                  <Handshake className="h-4 w-4" /> Acknowledge Receipt
                </button>
              </>
            )}
            {sorry ? <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{sorry}</p> : null}
          </Panel>

          {refined ? <RefinedSummary refined={refined} /> : null}
          {interpretations.length ? <InterpretSnap interpretations={interpretations} /> : null}

          <Panel className="p-4">
            <p className="label mb-2">Authority Ledger Record</p>
            <KV
              rows={[
                ['Request ID', `#${r.id}`],
                ['Analysis ID', `#${r.analysis_id}`],
                ['Target Authority', r.authority_code],
                ['Created', formatDate(r.created_at)],
                ['Sent', r.sent_at ? formatDate(r.sent_at) : '—'],
                ['Locality Zone', data.locality?.name ? `${data.locality.name} (${formatNum(data.locality.population)} residents)` : '—'],
              ]}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function interpretationView(interp: Interpretation | null) {
  if (!interp) return null;
  return (
    <div className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
        <p className="label">AI Agent Interpretation</p>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
        {interp.acknowledgement} {interp.new_information_summary}
      </p>
      {interp.provides_clarification ? (
        <p className="mt-1 text-[11px] text-emerald-300 font-semibold">
          ✓ Additional data successfully clarifies planning decisions.
        </p>
      ) : null}
    </div>
  );
}

function RefinedSummary({ refined }: { refined: Record<string, unknown> }) {
  const ranked = (refined.ranked as Array<{ option?: { name?: string; description?: string }; viability?: number }>) || [];
  return (
    <Panel className="border-violet-400/25 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-300" />
        <p className="text-sm font-semibold text-violet-200">AI Refined Recommendations</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-300">
        {String((refined.refined as { analysis_of_response?: string } | undefined)?.analysis_of_response || '')}
      </p>
      <div className="mt-3 space-y-1.5">
        {ranked.slice(0, 3).map((x, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-violet-400/15 font-mono text-[9px] text-violet-200">
              {i + 1}
            </span>
            <span className="flex-1 truncate text-slate-300">{x.option?.name}</span>
            <span className="font-mono text-violet-300">{Math.round(x.viability ?? 0)}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function InterpretSnap({ interpretations }: { interpretations: AuthorityRequestDetail['responses'] }) {
  return (
    <Panel className="p-4">
      <p className="label mb-2">Authority Response Summary</p>
      {interpretations.slice(0, 1).map((x) => (
        <div key={x.id} className="space-y-1 text-[11px] text-slate-400">
          <p>{x.ai_interpretation?.new_information_summary}</p>
          {x.ai_interpretation?.constraints_or_conditions?.length ? (
            <p className="text-amber-200/80">
              Constraints: {x.ai_interpretation.constraints_or_conditions.join('; ')}
            </p>
          ) : null}
        </div>
      ))}
    </Panel>
  );
}