import { useEffect, useState } from 'react';
import { BrainCircuit, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import type { Memory } from '../../lib/types';
import { domainColor } from '../../lib/format';
import { Empty, ErrorBlock, Loading, Panel } from '../../components/MissionControlUiComponents';

export function MemoryView() {
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [err, setErr] = useState('');

  function load() {
    api
      .get<{ memories: Memory[] }>('/api/planner/memory')
      .then(({ data }) => setMemories(data.memories))
      .catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">Agent memory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every completed cycle writes a memory that feeds RAG retrieval — the platform learns from its own outcomes.
          </p>
        </div>
        <button className="btn-ghost" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      {err ? <ErrorBlock error={err} /> : !memories ? <Loading /> : !memories.length ? (
        <Empty title="Memory bank is empty" hint="Approve a recommendation, track implementation and record KPI outcomes — a memory entry is written automatically." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {memories.map((m) => (
            <MemoryCard key={m.memory_id ?? m.id} memory={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <Panel hover className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-400/10 text-violet-300"><BrainCircuit className="h-4 w-4" /></span>
        <span className="chip border-white/[0.07] font-mono text-[10px]">{memory.memory_id ?? memory.id}</span>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-slate-100">{memory.problem_text || memory.problem_key}</p>
        {memory.category ? (
          <p className="mt-0.5 text-[11px] text-slate-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: domainColor(memory.category) }} /> {memory.category}
          </p>
        ) : null}
      </div>
      {memory.summary ? <p className="text-xs leading-relaxed text-slate-400 line-clamp-3">{memory.summary}</p> : null}
      <div className="space-y-1 text-[11px]">
        <MemLine label="Chosen" value={memory.planner_decision} />
        <MemLine label="Authority" value={memory.authority_response} />
        <MemLine label="Deployment" value={memory.implementation_result} />
        <MemLine label="Outcome" value={memory.kpi_summary} />
      </div>
      {memory.tags?.length ? (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {memory.tags.map((t) => (
            <span key={t} className="chip border border-white/[0.08] bg-white/[0.03] text-[10px] text-slate-400">{t}</span>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}

function MemLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <p className="flex gap-2">
      <span className="w-16 shrink-0 text-slate-600">{label}</span>
      <span className="min-w-0 flex-1 truncate text-slate-400">{value}</span>
    </p>
  );
}