import React from 'react';
import {
  Shield,
  ArrowRight,
  Activity,
  Sparkles,
  Lock,
  Database,
  Radio,
  KeyRound,
  Globe2,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Terminal,
  Layers
} from 'lucide-react';

interface ChetakLandingPageProps {
  onEnterWarRoom: (scenarioId?: string) => void;
}

export default function ChetakLandingPage({ onEnterWarRoom }: ChetakLandingPageProps) {
  const scenarios = [
    {
      id: 'SCENARIO_DB_COLLAPSE',
      title: 'Database Connection Pool Starvation',
      service: 'database-postgres',
      severity: 'P1 CRITICAL',
      impact: '₹28,000 / min',
      cause: 'Unindexed query on /checkout starved connection pool (100/100 slots)',
      tagColor: 'rose',
      icon: Database
    },
    {
      id: 'SCENARIO_AUTH_MEMORY_LEAK',
      title: 'Auth Service OOMKilled CrashLoop',
      service: 'auth-service',
      severity: 'P1 CRITICAL',
      impact: '₹18,500 / min',
      cause: 'Memory leak in TokenBlacklistMap triggered K8s OOM cgroup termination',
      tagColor: 'rose',
      icon: KeyRound
    },
    {
      id: 'SCENARIO_PAYMENT_GATEWAY_OUTAGE',
      title: 'Payment Gateway Webhook Hang',
      service: 'payment-gateway',
      severity: 'P2 HIGH',
      impact: '₹32,000 / min',
      cause: 'Upstream payment processor timeouts accumulated in customer checkout queue',
      tagColor: 'amber',
      icon: Radio
    },
    {
      id: 'SCENARIO_CITY_POWER_CASCADE',
      title: 'Smart Grid Substation Transformer Trip',
      service: 'grid-substation-4',
      severity: 'P1 CRITICAL',
      impact: '₹45,000 / min',
      cause: 'Substation thermal trip cascaded across 4 traffic & transit corridors',
      tagColor: 'rose',
      icon: Globe2
    }
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-violet-500 selection:text-white relative overflow-x-hidden">
      {/* LUXURY AMBIENT BACKGROUND GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-violet-600/15 via-indigo-600/5 to-transparent blur-[160px] pointer-events-none -z-10" />

      {/* 1. TOP NAVIGATION BAR */}
      <header className="w-full max-w-6xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/[0.04]">
        <div className="flex items-center space-x-3.5">
          <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-wider text-white">CHETAK</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
                PNG2
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Multi-Agent Incident Commander</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="#scenarios"
            className="text-xs font-medium text-slate-400 hover:text-white transition hidden sm:inline-block"
          >
            Outage Scenarios
          </a>
          <a
            href="#pillars"
            className="text-xs font-medium text-slate-400 hover:text-white transition hidden sm:inline-block"
          >
            Architecture
          </a>
          <button
            onClick={() => onEnterWarRoom()}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25 transition-all flex items-center space-x-1.5"
          >
            <span>Launch War Room</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center space-y-8">
        {/* STATEMENT PILL */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mx-auto text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Statement ID: PNG2 · Autonomous SRE Incident Commander</span>
        </div>

        {/* MAIN HEADLINE */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Detect. Alert. Act.
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-indigo-200 to-white bg-clip-text text-transparent">
              Without the Noise.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
            Autonomous multi-agent incident defense that filters 99.4% of alert noise, cross-falsifies root causes with an adversarial debate swarm, and safely restores production with zero-trust guardrails.
          </p>
        </div>

        {/* PRIMARY CALL TO ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onEnterWarRoom('SCENARIO_DB_COLLAPSE')}
            className="px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 inline-flex items-center space-x-2.5 shadow-xl shadow-violet-600/35 hover:scale-[1.02]"
          >
            <span>Enter Incident War Room</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="#scenarios"
            className="px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white font-medium text-sm transition-all border border-white/[0.08] inline-flex items-center space-x-2"
          >
            <span>Simulate 4 Outages</span>
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {/* 3. COCKPIT INTERACTIVE PREVIEW WINDOW */}
        <div className="pt-10 max-w-4xl mx-auto">
          <div
            onClick={() => onEnterWarRoom('SCENARIO_DB_COLLAPSE')}
            className="group cursor-pointer rounded-2xl border border-white/[0.1] bg-[#0c101a]/80 backdrop-blur-2xl p-1 shadow-2xl transition-all duration-300 hover:border-violet-500/40 hover:shadow-violet-500/10 text-left"
          >
            {/* WINDOW TOP HEADER */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="ml-3 font-mono text-[11px] text-slate-400">
                  chetak-cockpit · incident-8021 [ACTIVE OUTAGE]
                </span>
              </div>
              <div className="flex items-center space-x-2 text-violet-400 font-medium group-hover:text-violet-300">
                <span>Click to Enter Cockpit</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* PREVIEW INTERIOR */}
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      P1 CRITICAL
                    </span>
                    <span className="text-xs text-slate-400 font-mono">database-postgres</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">PostgreSQL Connection Saturation & Deadlock</h3>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Bleed Rate</div>
                    <div className="text-sm font-bold font-mono text-rose-400">₹24,000 / min</div>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Noise Cut</div>
                    <div className="text-sm font-bold font-mono text-emerald-400">99.4% Sifted</div>
                  </div>
                </div>
              </div>

              {/* MOCK TELEMETRY BAR & SWARM SUMMARY */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="text-slate-400 font-medium flex items-center space-x-1.5">
                    <Activity className="h-3.5 w-3.5 text-violet-400" />
                    <span>Telemetry Cliff Drop</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 font-mono">P99: 45ms → 4,820ms</div>
                  <div className="text-[11px] text-slate-500">100/100 slots exhausted</div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="text-slate-400 font-medium flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    <span>Swarm Verdict</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 font-mono">96% AI Consensus</div>
                  <div className="text-[11px] text-slate-500">Detective & Skeptic reconciled</div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="text-slate-400 font-medium flex items-center space-x-1.5">
                    <Lock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Zero-Trust Guardrail</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-300 font-mono">Safe Dry-Run Ready</div>
                  <div className="text-[11px] text-slate-500">Destructive drops blocked</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. SCENARIO SELECTOR SECTION */}
        <section id="scenarios" className="pt-20 space-y-6 text-left max-w-4xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">Simulate Real Production Outages</h2>
            <p className="text-sm text-slate-400">
              Select any incident below to launch directly into the War Room with live telemetry, swarm debates, and deterministic guardrails.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              return (
                <div
                  key={sc.id}
                  onClick={() => onEnterWarRoom(sc.id)}
                  className="cursor-pointer group p-5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] hover:border-violet-500/40 transition-all duration-200 shadow-lg hover:shadow-violet-600/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-violet-400" />
                      </div>
                      <span className="font-mono text-xs text-slate-300">{sc.service}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        sc.severity.includes('P1')
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                      }`}
                    >
                      {sc.severity}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-violet-300 transition">
                      {sc.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sc.cause}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">Impact: {sc.impact}</span>
                    <span className="text-violet-400 font-medium group-hover:translate-x-1 transition flex items-center">
                      Launch Cockpit <ArrowRight className="h-3 w-3 ml-1" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. THREE CORE ARCHITECTURAL PILLARS */}
        <section id="pillars" className="pt-20 space-y-6 text-left max-w-4xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">The 3-Pillar Autonomous Engine</h2>
            <p className="text-sm text-slate-400">
              Built specifically for mission-critical infrastructure under Statement ID: PNG2.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/[0.06] space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Shannon Entropy Noise Sifter</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies mathematical Shannon Entropy across log distributions, compressing 482 noisy PagerDuty alerts into 3 root cause signals in under 5 seconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/[0.06] space-y-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Adversarial AI Debate Swarm</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pairs a hypothesis Detective with a skeptical Devil&apos;s Advocate to cross-falsify root cause claims against real metric timestamps, eliminating hallucinations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/[0.06] space-y-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Zero-Trust Guardrail Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A 3-tier deterministic policy firewall. Green probes run automatically, Yellow requires dual sign-off, and Red commands (DROP TABLE, mass kill) are permanently blocked.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 6. CLEAN FOOTER */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-white/[0.05] gap-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-4 w-4 text-violet-400" />
          <span>CHETAK · Statement ID: PNG2 · Autonomous Advisory SRE Co-Pilot</span>
        </div>
        <div className="flex items-center space-x-6">
          <button
            onClick={() => onEnterWarRoom()}
            className="text-violet-400 hover:text-violet-300 font-medium transition"
          >
            Launch War Room →
          </button>
        </div>
      </footer>
    </div>
  );
}
