import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Activity, TrendingDown, Layers, Sparkles } from 'lucide-react';

interface TelemetryChartWidgetProps {
  scenarioId?: string;
}

export default function TelemetryChartWidget({ scenarioId }: TelemetryChartWidgetProps) {
  const [activeMetric, setActiveMetric] = useState<'throughput' | 'connections' | 'errors'>('throughput');

  const data = [
    { time: '10:10', rps: 14200, p99: 45, connections: 38, errorRate: 0.1 },
    { time: '10:11', rps: 14350, p99: 42, connections: 41, errorRate: 0.1 },
    { time: '10:12', rps: 14100, p99: 48, connections: 44, errorRate: 0.2 },
    { time: '10:13', rps: 14400, p99: 45, connections: 48, errorRate: 0.1 },
    { time: '10:14', rps: 14250, p99: 52, connections: 65, errorRate: 0.4 },
    { time: '10:14:30', rps: 10500, p99: 420, connections: 92, errorRate: 4.8 },
    { time: '10:15', rps: 4800, p99: 2450, connections: 100, errorRate: 14.2 },
    { time: '10:16', rps: 2400, p99: 4820, connections: 100, errorRate: 28.6 },
    { time: '10:17', rps: 2150, p99: 4950, connections: 100, errorRate: 31.2 },
    { time: '10:18', rps: 2300, p99: 4700, connections: 100, errorRate: 29.8 },
    { time: '10:19', rps: 3800, p99: 3100, connections: 84, errorRate: 18.5 },
    { time: '10:20', rps: 11200, p99: 210, connections: 52, errorRate: 1.2 }
  ];

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Activity className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center space-x-1.5">
              <span>Telemetry Streams</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                P99 Cliff Drop
              </span>
            </h3>
            <p className="text-xs text-slate-400">High-resolution APM timeseries during failure window</p>
          </div>
        </div>

        {/* PILL METRIC SELECTOR */}
        <div className="flex items-center space-x-1 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/[0.06] text-xs">
          <button
            onClick={() => setActiveMetric('throughput')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeMetric === 'throughput'
                ? 'bg-violet-600 text-white font-semibold shadow-lg shadow-violet-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            RPS & Latency
          </button>
          <button
            onClick={() => setActiveMetric('connections')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeMetric === 'connections'
                ? 'bg-rose-500 text-white font-semibold shadow-lg shadow-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pool Saturation
          </button>
          <button
            onClick={() => setActiveMetric('errors')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeMetric === 'errors'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Error Rate
          </button>
        </div>
      </div>

      {/* THREE GLASS STAT PILLS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/[0.02] hover:bg-white/[0.04] transition p-3.5 rounded-xl border border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-slate-400">Throughput Drop</span>
          <span className="text-xs font-mono font-semibold text-rose-400 flex items-center">
            <TrendingDown className="h-3.5 w-3.5 mr-1" /> -84.8% cliff
          </span>
        </div>
        <div className="bg-white/[0.02] hover:bg-white/[0.04] transition p-3.5 rounded-xl border border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-slate-400">P99 Latency</span>
          <span className="text-xs font-mono font-semibold text-amber-300">45ms → 4,820ms</span>
        </div>
        <div className="bg-white/[0.02] hover:bg-white/[0.04] transition p-3.5 rounded-xl border border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-slate-400">Connection Slots</span>
          <span className="text-xs font-mono font-semibold text-rose-400">100/100 (Maxed)</span>
        </div>
      </div>

      {/* RECHARTS AREA CHART */}
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#f8fafc',
                backdropFilter: 'blur(16px)'
              }}
            />

            <ReferenceLine
              x="10:14"
              stroke="#8b5cf6"
              strokeDasharray="3 3"
              label={{ value: 'Deploy PR #814', fill: '#c084fc', fontSize: 10, position: 'top' }}
            />
            <ReferenceLine
              x="10:16"
              stroke="#f43f5e"
              strokeDasharray="3 3"
              label={{ value: 'Pool Starvation', fill: '#fb7185', fontSize: 10, position: 'top' }}
            />

            {activeMetric === 'throughput' && (
              <>
                <Area
                  type="monotone"
                  dataKey="rps"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#violetGradient)"
                  name="RPS Throughput"
                />
                <Area
                  type="monotone"
                  dataKey="p99"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#roseGradient)"
                  name="P99 Latency (ms)"
                />
              </>
            )}

            {activeMetric === 'connections' && (
              <Area
                type="stepAfter"
                dataKey="connections"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#roseGradient)"
                name="Active Connections (100 Max)"
              />
            )}

            {activeMetric === 'errors' && (
              <Area
                type="monotone"
                dataKey="errorRate"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#amberGradient)"
                name="Error Rate (%)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Prometheus Agent · 1000ms Resolution</span>
        <span className="text-violet-400 font-medium">Real-time Ingestion Active</span>
      </div>
    </div>
  );
}
