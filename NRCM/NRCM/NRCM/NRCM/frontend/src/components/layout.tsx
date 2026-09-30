import { type ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  BrainCircuit,
  Building2,
  Compass,
  FileText,
  GitBranch,
  Home as HomeIcon,
  Inbox as InboxIcon,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Radio,
  Sparkles,
  UserRound,
  Waypoints,
} from 'lucide-react';
import { navigate } from '../lib/router';
import type { User } from '../lib/types';
import { ThemeToggle } from './ThemeToggle';

export type NavItem = { key: string; label: string; to: string; icon: ReactNode; hint?: string };

const CITIZEN_NAV: NavItem[] = [
  { key: 'home', label: 'Home', to: '/citizen', icon: <HomeIcon className="h-4 w-4" /> },
  { key: 'submit', label: 'Report', to: '/citizen/submit', icon: <UserRound className="h-4 w-4" /> },
  { key: 'track', label: 'Track', to: '/citizen/track', icon: <Compass className="h-4 w-4" /> },
  { key: 'mine', label: 'My reports', to: '/citizen/mine', icon: <FileText className="h-4 w-4" /> },
];

const PLANNER_NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/planner', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'assistant', label: 'Copilot', to: '/planner/assistant', icon: <Sparkles className="h-4 w-4 text-cyan-400" /> },
  { key: 'localities', label: 'Localities', to: '/planner/localities', icon: <MapIcon className="h-4 w-4" /> },
  { key: 'analyses', label: 'Analyses', to: '/planner/analyses', icon: <GitBranch className="h-4 w-4" /> },
  { key: 'authority', label: 'Authority', to: '/planner/authority', icon: <Building2 className="h-4 w-4" /> },
  { key: 'implement', label: 'Deploy', to: '/planner/implementations', icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'memory', label: 'Memory', to: '/planner/memory', icon: <BrainCircuit className="h-4 w-4" /> },
];

const AUTHORITY_NAV: NavItem[] = [
  { key: 'inbox', label: 'Requests', to: '/authority', icon: <InboxIcon className="h-4 w-4" /> },
];

function topNavFor(role: User['role']): NavItem[] {
  if (role === 'planner') return PLANNER_NAV;
  if (role === 'authority') return AUTHORITY_NAV;
  return CITIZEN_NAV;
}

const PORTAL_TITLE: Record<User['role'], string> = {
  citizen: 'Citizen Portal',
  planner: 'Planner Portal',
  authority: 'Authority Portal',
};

export function Layout({
  role,
  user,
  ai,
  activeKey,
  children,
  onLogout,
}: {
  role: User['role'];
  user: User;
  ai: { healthy: boolean; model?: string } | null;
  activeKey?: string;
  children: ReactNode;
  onLogout: () => void;
}) {
  const nav = topNavFor(role);
  const active = activeKey || '';

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200">
      <div className="pointer-events-none fixed inset-0 grid-bg" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[32rem] bg-gradient-to-b from-cyan-500/[0.07] to-transparent" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
          <button className="flex items-center gap-2.5" onClick={() => navigate(role === 'citizen' ? '/citizen' : role === 'planner' ? '/planner' : '/authority')}>
            <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-600 text-ink-950 shadow-glow">
              <Waypoints className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-emerald-300 ring-2 ring-ink-950" />
            </span>
            <span className="hidden sm:block text-left">
              <span className="block text-sm font-bold tracking-tight text-slate-100">
                HY<span className="text-gradient">TRACE</span>
              </span>
              <span className="block text-[10px] leading-none text-slate-500">Urban Intelligence Platform</span>
            </span>
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-ink-950/70 px-3 py-1.5 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-400/20">
            {PORTAL_TITLE[role]}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={
                'chip hidden sm:inline-flex border ' +
                (ai?.healthy
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                  : 'border-amber-400/30 bg-amber-400/10 text-amber-300')
              }
            >
              <Radio className="h-3 w-3" />
              {ai?.healthy ? 'Copilot Active' : 'AI Offline'}
            </span>
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-ink-950/70 py-1 pl-1 pr-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/20 text-xs font-bold text-violet-300">
                {(user.name || '?').slice(0, 1).toUpperCase()}
              </span>
              <div className="hidden sm:block">
                <p className="max-w-[9rem] truncate text-xs font-semibold text-slate-200">{user.name}</p>
                <p className="text-[10px] capitalize leading-none text-slate-500">{user.role}</p>
              </div>
              <button onClick={onLogout} title="Log out" className="ml-1 rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-rose-300">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-7xl gap-6 px-3 py-6 sm:px-6">
        {/* Sidebar (desktop) */}
        {role !== 'citizen' ? (
          <aside className="sticky top-20 hidden h-fit w-52 shrink-0 lg:block">
            <SideNav nav={nav} active={active} />
          </aside>
        ) : null}

        {/* Main */}
        <main className="min-w-0 flex-1 pb-20 lg:pb-8">{children}</main>
      </div>

      {/* Bottom nav (mobile/tablet) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink-950/90 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg">
          {nav.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.to)}
              className={
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ' +
                (active === item.key ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300')
              }
            >
              <span className={(active === item.key ? 'text-cyan-300' : '')}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function SideNav({ nav, active }: { nav: NavItem[]; active: string }) {
  return (
    <div className="space-y-1">
      <p className="label mb-2 px-2">Workspace</p>
      {nav.map((item) => (
        <button
          key={item.key}
          onClick={() => navigate(item.to)}
          className={
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ' +
            (active === item.key
              ? 'bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/25'
              : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200')
          }
        >
          <span className={active === item.key ? 'text-cyan-300' : 'text-slate-500'}>{item.icon}</span>
          {item.label}
          {active === item.key ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300" /> : null}
        </button>
      ))}
      <div className="pt-4">
        <p className="label mb-2 px-2">Live</p>
        <div className="rounded-xl border border-white/[0.06] bg-ink-900/70 p-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-300">Agents online</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {['Coordinator', 'Traffic', 'Pollution', 'Energy'].map((a) => (
              <span key={a} className="chip border border-white/[0.07] text-slate-300">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                {a} Agent
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}