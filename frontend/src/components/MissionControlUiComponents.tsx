import { useEffect, type ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, X } from 'lucide-react';

export function Panel({
  children,
  className = '',
  glow = false,
  hover = false,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
  onClick?: () => void;
}) {
  const cls = [
    'panel',
    hover ? 'panel-hover cursor-pointer' : '',
    glow ? 'shadow-glow border-cyan-400/20' : '',
    className,
  ].join(' ');
  return onClick ? (
    <button type="button" onClick={onClick} className={cls + ' text-left'}>
      {children}
    </button>
  ) : (
    <div className={cls}>{children}</div>
  );
}

export function Section({ title, subtitle, right, children, className = '' }: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={'animate-fade-up ' + className}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-100">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Chip({ children, className = '', dot }: { children: ReactNode; className?: string; dot?: string }) {
  return (
    <span className={'chip ' + className}>
      {dot ? <span className={'h-1.5 w-1.5 rounded-full ' + dot} /> : null}
      {children}
    </span>
  );
}

export function Badge({ tone, children }: { tone: 'info' | 'ok' | 'warn' | 'bad' | 'neutral'; children: ReactNode }) {
  const tones = {
    info: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
    ok: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    warn: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    bad: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
    neutral: 'bg-slate-500/15 text-slate-300 border-slate-400/30',
  };
  return (
    <span className={'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ' + tones[tone]}>
      {children}
    </span>
  );
}

export function StatusPill({ status, label }: { status?: string | null; label?: string }) {
  if (!status) {
    return <Badge tone="neutral">{label || 'n/a'}</Badge>;
  }
  const s = String(status);
  let tone: 'info' | 'ok' | 'warn' | 'bad' | 'neutral' = 'neutral';
  if (/resolved|completed|approved|implemented/.test(s)) tone = 'ok';
  else if (/in_review|in_progress|running|awaiting|responded/.test(s)) tone = 'warn';
  else if (/clarification|authority|sent|draft/.test(s)) tone = 'info';
  else if (/error|rejected|blocked|failed/.test(s)) tone = 'bad';
  return <Badge tone={tone}>{label ?? s.replace(/_/g, ' ')}</Badge>;
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function Loading({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
      <p className="text-xs text-slate-500">{label || 'Loading…'}</p>
    </div>
  );
}

export function SkeletonBlock({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: i === 0 ? 22 : 12, width: ['52%', '88%', '72%', '40%'][i % 4] }} />
      ))}
    </div>
  );
}

export function Empty({ title = 'Nothing here yet', hint }: { title?: string; hint?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-14 text-center">
      <Inbox className="h-8 w-8 text-slate-600" />
      <p className="text-sm font-medium text-slate-400">{title}</p>
      {hint ? <p className="max-w-sm px-4 text-xs text-slate-600">{hint}</p> : null}
    </div>
  );
}

export function ErrorBlock({ error, onRetry, compact }: { error: unknown; onRetry?: () => void; compact?: boolean }) {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-center ${compact ? 'py-6' : 'py-14'}`}>
      <AlertTriangle className="h-7 w-7 text-rose-400" />
      <p className="text-sm font-medium text-rose-300">{msg}</p>
      {onRetry ? (
        <button className="btn-ghost mt-1" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'cyan',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: 'cyan' | 'violet' | 'amber' | 'emerald' | 'rose';
}) {
  const tones = {
    cyan: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20',
    violet: 'text-violet-300 bg-violet-400/10 border-violet-400/20',
    amber: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
    emerald: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
    rose: 'text-rose-300 bg-rose-400/10 border-rose-400/20',
  };
  return (
    <Panel className="p-4" hover>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="label">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-100">{value}</p>
          {sub ? <p className="mt-1 text-[11px] text-slate-500">{sub}</p> : null}
        </div>
        {icon ? (
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${tones[tone]}`}>{icon}</span>
        ) : null}
      </div>
    </Panel>
  );
}

export function ProgressBar({ value, color = '#22d3ee', className = '' }: { value: number; color?: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${v}%`, background: color, boxShadow: `0 0 8px ${color}66` }}
      />
    </div>
  );
}

export function Dimensions({ dimensions, max = 100 }: { dimensions?: Record<string, number | undefined>; max?: number }) {
  if (!dimensions) return null;
  const rows = Object.entries(dimensions).filter(([, v]) => typeof v === 'number');
  if (!rows.length) return null;
  return (
    <div className="space-y-2">
      {rows.map(([k, v]) => {
        const label = k.replace(/_/g, ' ');
        const pct = Math.max(0, Math.min(100, (v as number) / max));
        const color = pct >= 70 ? '#fb7185' : pct >= 45 ? '#fbbf24' : '#38bdf8';
        return (
          <div key={k}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="capitalize text-slate-400">{label}</span>
              <span className="font-mono text-slate-300">{v}</span>
            </div>
            <ProgressBar value={pct} color={color} />
          </div>
        );
      })}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }: {
  tabs: Array<{ key: string; label: ReactNode }>;
  value: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.07] bg-slate-100 dark:bg-ink-950/70 p-1 scroll-thin">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={
            'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ' +
            (value === t.key
              ? 'bg-cyan-600 text-white shadow-xs dark:bg-cyan-400/15 dark:text-cyan-300 dark:ring-1 dark:ring-cyan-400/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5')
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={`relative my-auto max-h-[88vh] w-full flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-900 shadow-2xl animate-fade-up ${
          wide ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-ink-900/95 px-5 py-4 backdrop-blur rounded-t-2xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/80 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 scroll-thin text-slate-800 dark:text-slate-100">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function JsonBlock({ data, className = '' }: { data: unknown; className?: string }) {
  return (
    <pre className={`scroll-thin overflow-x-auto rounded-xl bg-ink-950/70 p-3 text-[11px] leading-relaxed text-slate-400 ${className}`}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === 'object') return raw as T;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return fallback;
  }
}