import React from 'react';
import { Flame, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';

interface BlastRadiusGaugeWidgetProps {
  blastRadiusIndex: number;
  financialImpactPerMin: number;
  financialLossTotal: number;
}

export default function BlastRadiusGaugeWidget({
  blastRadiusIndex = 88,
  financialImpactPerMin = 28000,
  financialLossTotal = 142000
}: BlastRadiusGaugeWidgetProps) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (blastRadiusIndex / 100) * circumference;

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Flame className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">Blast Radius & Financial Burn</h3>
            <p className="text-xs text-slate-400">Containment horizon & revenue velocity metrics</p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 font-medium">
          Tier 1 Core
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* CIRCULAR RADIAL SVG GAUGE WITH VIOLET GLOW */}
        <div className="flex flex-col items-center justify-center p-5 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/[0.06] relative">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#8b5cf6"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))'
                }}
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
                {blastRadiusIndex}%
              </div>
              <div className="text-[10px] font-medium text-violet-400 uppercase tracking-widest mt-0.5">
                Blast Index
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 text-center mt-3">
            Core cluster isolated to 4 microservices
          </div>
        </div>

        {/* FINANCIAL ACCELERATION CARD */}
        <div className="space-y-3">
          <div className="p-4 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/[0.06] space-y-1.5">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Accumulated Loss</span>
              <span className="text-rose-400 font-mono font-semibold flex items-center text-xs">
                <TrendingUp className="h-3.5 w-3.5 mr-1" /> ₹{(financialImpactPerMin / 60).toFixed(0)}/sec
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              ₹{financialLossTotal.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500">
              Rate: ₹{financialImpactPerMin.toLocaleString('en-IN')}/min
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.06]">
              <div className="text-[10px] text-slate-500 font-medium">MTTR Horizon</div>
              <div className="font-mono font-semibold text-violet-300 mt-0.5">8.2m Target</div>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.06]">
              <div className="text-[10px] text-slate-500 font-medium">SLO Remaining</div>
              <div className="font-mono font-semibold text-emerald-400 mt-0.5">99.91%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
