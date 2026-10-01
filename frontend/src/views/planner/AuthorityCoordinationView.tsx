import { useEffect, useState } from 'react';
import { Building2, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import type { ClarificationRequest, Implementation } from '../../lib/types';
import { formatDate } from '../../lib/format';
import { navigate } from '../../lib/router';
import { Badge, Chip, Empty, ErrorBlock, Loading, Panel, StatusPill } from '../../components/MissionControlUiComponents';

type PlannerRequest = Partial<ClarificationRequest> & { planner_notes?: string | null; sent_at: string | null };

export function PlannerAuthority() {
  const [requests, setRequests] = useState<PlannerRequest[] | null>(null);
  const [err, setErr] = useState('');

  function load() {
    api
      .get<{ requests: PlannerRequest[] }>('/api/planner/authority-requests')
      .then(({ data }) => setRequests(data.requests))
      .catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">Authority coordination</h1>
          <p className="mt-1 text-sm text-slate-500">Every request shipped to a city agency — clarifications for missing information, and coordination requests for intervention support.</p>
        </div>
        <button className="btn-ghost" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      {err ? <ErrorBlock error={err} /> : !requests ? <Loading /> : !requests.length ? (
        <Empty title="No requests yet" hint="Run an analysis that needs authority input — then approve & send from the analysis page." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {requests.map((r) => (
            <Panel key={r.id} hover className="flex flex-col gap-2 p-4" onClick={() => navigate(`/planner/analyses/${r.analysis_id}`)}>
              <div className="flex items-center justify-between gap-2">
                <Chip className="border-white/[0.07] font-mono text-[10px]">req #{r.id}</Chip>
                <StatusPill status={r.status} />
              </div>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><Building2 className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-100">{r.authority_name}</p>
                  <p className="font-mono text-[10px] text-slate-500">{r.authority_code}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="chip border border-white/[0.07] text-[10px] text-slate-400">
                  {r.request_type === 'SUPPORT_REQUEST' || r.request_type === 'COORDINATION_REQUEST' ? 'coordination & support' : 'clarification / info'}
                </span>
                {r.reason ? <span className="line-clamp-1 text-[10px] text-slate-500">{r.reason}</span> : null}
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{r.message}</p>
              <div className="mt-auto flex flex-wrap justify-between gap-2 text-[10px] text-slate-500">
                <span>{r.sent_at ? formatDate(r.sent_at) : 'not sent yet'}</span>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

export function Deploy() {
  const [impls, setImpls] = useState<Implementation[] | null>(null);
  const [err, setErr] = useState('');

  function load() {
    api
      .get<{ implementations: Implementation[] }>('/api/planner/implementation')
      .then(({ data }) => setImpls(data.implementations))
      .catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">Field deployments</h1>
          <p className="mt-1 text-sm text-slate-500">Approved recommendations moving from paper to pavement.</p>
        </div>
        <button className="btn-ghost" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      {err ? <ErrorBlock error={err} /> : !impls ? <Loading /> : !impls.length ? (
        <Empty title="No deployments yet" hint="Approve a recommendation, then start deployment from the analysis page." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {impls.map((i) => (
            <Panel key={i.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="chip border-white/[0.07] font-mono text-[10px]">deploy #{i.id} · rec #{i.recommendation_id}</span>
                <StatusPill status={i.status} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Badge tone={i.status === 'completed' ? 'ok' : i.status === 'in_progress' ? 'warn' : 'neutral'}>{i.status}</Badge>
                <span>started {formatDate(i.started_at, false)}</span>
                {i.completed_at ? <span>· completed {formatDate(i.completed_at, false)}</span> : null}
              </div>
              {milestones(i.milestones).length ? (
                <ul className="mt-3 space-y-1.5">
                  {milestones(i.milestones).map((m, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="grid h-5 w-5 place-items-center rounded-md bg-white/[0.04] font-mono text-[9px] text-slate-500">{j + 1}</span>
                      {m}
                    </li>
                  ))}
                </ul>
              ) : null}
              {i.notes ? <p className="mt-2 text-[11px] text-slate-500">{i.notes}</p> : null}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function milestones(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    const p = JSON.parse(String(raw));
    return Array.isArray(p) ? p.map(String) : [String(raw)];
  } catch {
    return [String(raw)];
  }
}