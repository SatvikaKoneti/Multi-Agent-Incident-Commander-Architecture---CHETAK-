import { useState, type FormEvent } from 'react';
import { Landmark, ShieldCheck, UserRound } from 'lucide-react';
import { api, setToken, setStoredUser } from '../lib/api';
import type { User } from '../lib/types';
import { DEMO_LOGINS } from '../lib/format';
import { navigate } from '../lib/router';
import { Panel, Tabs, Field } from '../components/ui';
import { ThemeToggle } from '../components/ThemeToggle';

const ROLE_HOME: Record<string, string> = { citizen: '/citizen', planner: '/planner', authority: '/authority' };

export default function AuthView({ onAuthed }: { onAuthed: (u: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = mode === 'login'
        ? await api.post<{ token: string; user: User }>('/api/auth/login', { json: { email, password } })
        : await api.post<{ token: string; user: User }>('/api/auth/register', { json: { name, email, password } });
      setToken(data.token);
      setStoredUser(data.user);
      onAuthed(data.user);
      navigate(ROLE_HOME[data.user.role] || '/citizen');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  const [showAuthorityModal, setShowAuthorityModal] = useState(false);

  async function demo(roleKey: keyof typeof DEMO_LOGINS) {
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post<{ token: string; user: User }>('/api/auth/login', { json: DEMO_LOGINS[roleKey] });
      setToken(data.token);
      setStoredUser(data.user);
      onAuthed(data.user);
      navigate(ROLE_HOME[data.user.role] || `/${data.user.role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  const AUTHORITY_OPTIONS: Array<{ key: keyof typeof DEMO_LOGINS; code: string; name: string; domain: string }> = [
    { key: 'authority_ghmc', code: 'GHMC', name: 'GHMC Municipal Infrastructure', domain: 'Roads, Drainage, Potholes & Sanitation' },
    { key: 'authority_htp', code: 'HTP', name: 'Hyderabad Traffic Police', domain: 'Traffic Signals, Congestion & Junctions' },
    { key: 'authority_tspcb', code: 'TSPCB', name: 'Telangana Pollution Control Board', domain: 'Air, Water & Industrial Pollution' },
    { key: 'authority_tsspdcl', code: 'TSSPDCL', name: 'TSSPDCL Power Distribution', domain: 'Electricity & Street Lighting' },
    { key: 'authority_hmwssb', code: 'HMWSSB', name: 'Water Supply & Sewerage Board', domain: 'Water Distribution & Sewer Lines' },
    { key: 'authority_swm', code: 'GHMC-SWM', name: 'GHMC Solid Waste Management', domain: 'Garbage Collection & Bins' },
    { key: 'authority_tsrtc', code: 'TSRTC', name: 'TSRTC Public Transport', domain: 'Buses & Transit Infrastructure' },
  ];

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-950 px-4 py-10">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle showLabel />
      </div>
      <div className="pointer-events-none fixed inset-0 grid-bg" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.12),transparent_55%)]" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-600 text-ink-950 shadow-glow">
            <Landmark className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            HY<span className="text-gradient">TRACE</span>
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Agentic AI urban planning decision support · Hyderabad
          </p>
        </div>

        <Panel className="p-5 sm:p-6">
          <Tabs
            value={mode}
            onChange={(k) => {
              setMode(k as 'login' | 'register');
              setError('');
            }}
            tabs={[
              { key: 'login', label: 'Sign in' },
              { key: 'register', label: 'New citizen' },
            ]}
          />

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === 'register' ? (
              <Field label="Full name">
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ananya Rao" required />
              </Field>
            ) : null}
            <Field label="Email">
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </Field>
            <Field label="Password">
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
            </Field>

            {error ? (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>
            ) : null}

            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create citizen account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-slate-600">
            <span className="h-px flex-1 bg-white/[0.06]" />
            demo access
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => demo('citizen')} className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.06]">
              <UserRound className="h-4 w-4 text-cyan-300" />
              <p className="mt-1.5 text-xs font-semibold text-slate-200">Citizen</p>
              <p className="mt-0.5 text-[9px] text-slate-500">report · track</p>
            </button>
            <button onClick={() => demo('planner')} className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition hover:border-violet-400/40 hover:bg-violet-400/[0.06]">
              <Landmark className="h-4 w-4 text-violet-300" />
              <p className="mt-1.5 text-xs font-semibold text-slate-200">Planner</p>
              <p className="mt-0.5 text-[9px] text-slate-500">analyse · decide</p>
            </button>
            <button onClick={() => setShowAuthorityModal(true)} className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition hover:border-emerald-400/40 hover:bg-emerald-400/[0.06]">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <p className="mt-1.5 text-xs font-semibold text-slate-200">Authority</p>
              <p className="mt-0.5 text-[9px] text-slate-500">7 agencies</p>
            </button>
          </div>

          {showAuthorityModal ? (
            <div className="mt-4 space-y-2 rounded-2xl border border-emerald-500/30 bg-ink-900/95 p-4 shadow-panel animate-fade-up">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Select Civic Authority to Log In
                </h4>
                <button onClick={() => setShowAuthorityModal(false)} className="text-xs text-slate-400 hover:text-slate-200">
                  ✕ Close
                </button>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {AUTHORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => {
                      setShowAuthorityModal(false);
                      demo(opt.key);
                    }}
                    className="w-full text-left p-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-emerald-500/10 hover:border-emerald-400/40 transition flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">{opt.name}</p>
                      <p className="text-[10px] text-slate-400">{opt.domain}</p>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-emerald-300 border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                      {opt.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-3 text-center text-[10px] text-slate-600">All demo users share one password: demo1234</p>
        </Panel>
      </div>
    </div>
  );
}