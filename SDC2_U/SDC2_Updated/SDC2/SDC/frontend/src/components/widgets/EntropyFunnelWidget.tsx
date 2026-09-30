import React, { useState } from 'react';
import { Activity, Filter, Sparkles, CheckCircle2 } from 'lucide-react';

interface EntropyFunnelWidgetProps {
  rawAlertCount?: number;
  correlatedSignals?: number;
  noiseReductionPct?: number;
}

export default function EntropyFunnelWidget({
  rawAlertCount = 482,
  correlatedSignals = 3,
  noiseReductionPct = 99.4
}: EntropyFunnelWidgetProps) {
  const [filterActive, setFilterActive] = useState(true);

  const clusteredSeeds = [
    {
      id: 1,
      title: 'Database Master Connection Pool Saturation',
      volume: 312,
      service: 'database-postgres',
      entropyContribution: '0.84 bits'
    },
    {
      id: 2,
      title: 'Checkout Microservice 504 Gateway Timeouts',
      volume: 128,
      service: 'checkout-service',
      entropyContribution: '0.52 bits'
    },
    {
      id: 3,
      title: 'Async Payment Queue Consumption Lag',
      volume: 42,
      service: 'payment-gateway',
      entropyContribution: '0.22 bits'
    }
  ];

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Activity className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">Shannon Entropy Noise Sifter</h3>
            <p className="text-xs text-slate-400">Information-theoretic alert compression H(X) = -∑ p(x) log₂(p(x))</p>
          </div>
        </div>
        <button
          onClick={() => setFilterActive(!filterActive)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
            filterActive
              ? 'bg-violet-600 text-white font-semibold shadow-lg shadow-violet-600/30'
              : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>{filterActive ? '99.4% Compression Active' : 'Show Unfiltered Raw'}</span>
        </button>
      </div>

      {/* THREE-STAGE VISUAL FUNNEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/[0.06] text-center space-y-1">
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Stage 1: Raw Ingest</div>
          <div className="text-3xl font-extrabold font-mono text-rose-400">{rawAlertCount}</div>
          <div className="text-xs text-slate-400">PagerDuty, Slack, CloudWatch</div>
          <div className="text-[10px] text-slate-500">Raw alert fatigue</div>
        </div>

        <div className="p-4 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-violet-500/20 text-center space-y-1">
          <div className="text-[10px] font-medium text-violet-300 uppercase tracking-wider">Stage 2: Shannon Sifter</div>
          <div className="text-xl font-bold font-mono text-violet-300">1.58 bits</div>
          <div className="text-xs text-slate-400 font-mono">H(X) = -∑ p(x) log₂(p)</div>
          <div className="text-[10px] text-slate-500">Clustered in 5000ms window</div>
        </div>

        <div className="p-4 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-emerald-500/20 text-center space-y-1">
          <div className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Stage 3: Distilled Seeds</div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400">{correlatedSignals}</div>
          <div className="text-xs text-slate-400">Independent root causes</div>
          <div className="text-[10px] text-emerald-400/80 font-medium">99.4% noise eliminated</div>
        </div>
      </div>

      {/* CLUSTERED ROOTS BREAKDOWN */}
      <div className="space-y-2 pt-1">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Correlated Root Hypotheses:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {clusteredSeeds.map((c) => (
            <div key={c.id} className="p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.06] text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 truncate">{c.service}</span>
                <span className="font-mono text-violet-400 font-semibold">{c.entropyContribution}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">{c.title}</div>
              <div className="text-[10px] text-slate-500 font-mono">{c.volume} raw alarms subsumed</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
