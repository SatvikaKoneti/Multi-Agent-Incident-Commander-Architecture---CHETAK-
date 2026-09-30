import React, { useState } from 'react';
import { Layers, Server, Globe, Database, X, ShieldAlert, Cpu } from 'lucide-react';

interface NodeData {
  id: string;
  name: string;
  role: string;
  status: 'CRITICAL' | 'DEGRADED' | 'HEALTHY';
  metrics: {
    latency: string;
    errorRate: string;
    trafficDrop: string;
    connections: string;
  };
  details: string;
  containerId: string;
}

export default function TopologyGraphWidget() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  const nodes: NodeData[] = [
    {
      id: 'patient-zero',
      name: 'database-postgres',
      role: 'Root Service (Patient Zero)',
      status: 'CRITICAL',
      metrics: {
        latency: '4,820 ms P99',
        errorRate: '100% Saturation',
        trafficDrop: '-88%',
        connections: '100/100 slots'
      },
      details: 'Unindexed query on orders table introduced in commit #814 starved connection pool.',
      containerId: 'k8s://db-cluster-prod-master-0'
    },
    {
      id: 'downstream-checkout',
      name: 'checkout-service',
      role: 'Downstream L1 (Worker Pods)',
      status: 'DEGRADED',
      metrics: {
        latency: '5,100 ms',
        errorRate: '18.4% HTTP 504',
        trafficDrop: '-74%',
        connections: 'Pool Exhausted'
      },
      details: 'Worker threads hung awaiting database responses; incoming customer checkout requests timed out.',
      containerId: 'k8s://checkout-service-7f89b-x3v'
    },
    {
      id: 'downstream-payment',
      name: 'payment-gateway',
      role: 'Downstream L2 (Queue Consumer)',
      status: 'DEGRADED',
      metrics: {
        latency: '2,900 ms',
        errorRate: '12.1% Webhook Failure',
        trafficDrop: '-62%',
        connections: 'Queue Backlogged'
      },
      details: '1,480 payment verification jobs queued up in RabbitMQ without receiving checkout confirmation.',
      containerId: 'k8s://payment-gateway-69d2a-m9q'
    },
    {
      id: 'user-surface',
      name: 'api-gateway / edge',
      role: 'User Surface (Edge Routing)',
      status: 'DEGRADED',
      metrics: {
        latency: '3,200 ms',
        errorRate: '24.6% Client 5xx',
        trafficDrop: '-84.8% Cliff Drop',
        connections: '14,200 → 2,150 RPS'
      },
      details: 'Public-facing traffic cliff drop; end-users seeing Gateway Timeout error screens.',
      containerId: 'edge://aws-alb-prod-external'
    }
  ];

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Layers className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">System Dependency Flow</h3>
            <p className="text-xs text-slate-400">Cascading propagation map from Root Cause to Edge API</p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
          88% Blast Radius
        </span>
      </div>

      {/* LINEAR-STYLE TOPOLOGY HIERARCHICAL NODES CANVAS */}
      <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/[0.06] p-8 overflow-hidden">
        {/* SVG SOFT CONNECTING BEAMS */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <line x1="22%" y1="50%" x2="48%" y2="50%" stroke="url(#beamGradient)" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
          <line x1="48%" y1="50%" x2="74%" y2="50%" stroke="url(#beamGradient)" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
          <line x1="74%" y1="50%" x2="90%" y2="50%" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 4" />
        </svg>

        {/* NODES ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {nodes.map((n) => {
            const isSelected = selectedNode?.id === n.id;
            return (
              <div
                key={n.id}
                onClick={() => setSelectedNode(n)}
                className={`cursor-pointer p-4 rounded-xl backdrop-blur-xl border transition-all duration-300 transform hover:-translate-y-1 text-center space-y-2 select-none ${
                  n.id === 'patient-zero'
                    ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400 shadow-lg shadow-rose-500/10'
                    : 'bg-white/[0.03] border-white/[0.08] hover:border-violet-500/40 hover:bg-white/[0.06] shadow-md'
                } ${isSelected ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-black' : ''}`}
              >
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {n.role}
                </div>
                <div className="text-sm font-semibold text-white flex items-center justify-center space-x-1.5">
                  {n.id === 'patient-zero' && <Database className="h-4 w-4 text-rose-400" />}
                  {n.id.includes('downstream') && <Server className="h-4 w-4 text-amber-300" />}
                  {n.id === 'user-surface' && <Globe className="h-4 w-4 text-violet-400" />}
                  <span className="truncate">{n.name}</span>
                </div>
                <div className="text-xs font-mono text-slate-300">
                  {n.metrics.latency}
                </div>
                <div
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full inline-block ${
                    n.status === 'CRITICAL'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {n.metrics.errorRate}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INSPECTOR DRAWER FOR SELECTED NODE */}
      {selectedNode && (
        <div className="p-5 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-violet-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-violet-400" />
              <span className="font-semibold text-sm text-white">{selectedNode.name}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-400">
                {selectedNode.containerId}
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-black/30 rounded-lg border border-white/[0.06]">
              <span className="text-slate-400 block text-[10px]">Latency</span>
              <span className="font-mono font-semibold text-white">{selectedNode.metrics.latency}</span>
            </div>
            <div className="p-3 bg-black/30 rounded-lg border border-white/[0.06]">
              <span className="text-slate-400 block text-[10px]">Error Rate</span>
              <span className="font-mono font-semibold text-rose-400">{selectedNode.metrics.errorRate}</span>
            </div>
            <div className="p-3 bg-black/30 rounded-lg border border-white/[0.06]">
              <span className="text-slate-400 block text-[10px]">Traffic Delta</span>
              <span className="font-mono font-semibold text-amber-300">{selectedNode.metrics.trafficDrop}</span>
            </div>
            <div className="p-3 bg-black/30 rounded-lg border border-white/[0.06]">
              <span className="text-slate-400 block text-[10px]">Connections</span>
              <span className="font-mono font-semibold text-violet-300">{selectedNode.metrics.connections}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            <strong className="text-slate-200">Root Cause Trace:</strong> {selectedNode.details}
          </p>
        </div>
      )}
    </div>
  );
}
