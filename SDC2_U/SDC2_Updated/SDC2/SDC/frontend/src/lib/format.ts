export function formatInr(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const negative = n < 0;
  const v = Math.round(Math.abs(n));
  const s = String(v);
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return `${negative ? '−' : ''}₹${grouped}`;
}

export function formatNum(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits });
}

export function formatDate(raw: string | null | undefined, withTime = true): string {
  if (!raw) return '—';
  const d = new Date(String(raw).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return raw;
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (!withTime) return date;
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
}

export function timeAgo(raw: string | null | undefined): string {
  if (!raw) return '—';
  const d = new Date(String(raw).replace(' ', 'T'));
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(raw, false);
}

export function domainColor(domain: string | null | undefined): string {
  const d = (domain || '').toLowerCase();
  if (d.includes('traffic')) return '#38bdf8';
  if (d.includes('air') || d.includes('pollution')) return '#a78bfa';
  if (d.includes('energy') || d.includes('power')) return '#34d399';
  if (d.includes('water') || d.includes('drainage')) return '#2dd4bf';
  if (d.includes('waste')) return '#fbbf24';
  if (d.includes('transport')) return '#fb7185';
  return '#94a3b8';
}

export function statusTone(status: string): { dot: string; text: string; label: string } {
  const s = status || '';
  if (s.includes('resolved') || s.includes('completed') || s.includes('approved') || s.includes('implemented'))
    return { dot: 'bg-emerald-400', text: 'text-emerald-300', label: s };
  if (s.includes('in_review') || s.includes('in_progress') || s.includes('running') || s.includes('awaiting'))
    return { dot: 'bg-amber-400', text: 'text-amber-300', label: s };
  if (s.includes('clarification') || s.includes('authority') || s.includes('sent') || s.includes('draft'))
    return { dot: 'bg-cyan-400', text: 'text-cyan-300', label: s };
  if (s.includes('error') || s.includes('rejected') || s.includes('blocked') || s.includes('failed'))
    return { dot: 'bg-rose-400', text: 'text-rose-300', label: s };
  return { dot: 'bg-slate-500', text: 'text-slate-300', label: s || 'n/a' };
}

export function humanStatus(status: string): string {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function severityColor(severity: number | null | undefined): string {
  if (severity === null || severity === undefined) return '#94a3b8';
  if (severity >= 9) return '#f43f5e';
  if (severity >= 7) return '#fb7185';
  if (severity >= 5) return '#fbbf24';
  if (severity >= 3) return '#38bdf8';
  return '#34d399';
}

export function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return '#94a3b8';
  if (score >= 75) return '#f43f5e';
  if (score >= 55) return '#fb7185';
  if (score >= 35) return '#fbbf24';
  return '#38bdf8';
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function initials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  );
}

export const DEMO_LOGINS = {
  citizen: { email: 'citizen@hyd.city', password: 'demo1234' },
  planner: { email: 'planner@hyd.city', password: 'demo1234' },
  authority: { email: 'authority@hyd.city', password: 'demo1234' },
  authority_tsspdcl: { email: 'authority.tsspdcl@hyd.city', password: 'demo1234' },
  authority_ghmc: { email: 'authority.ghmc@hyd.city', password: 'demo1234' },
  authority_htp: { email: 'authority.htp@hyd.city', password: 'demo1234' },
  authority_tspcb: { email: 'authority.tspcb@hyd.city', password: 'demo1234' },
  authority_hmwssb: { email: 'authority.hmwssb@hyd.city', password: 'demo1234' },
  authority_swm: { email: 'authority.swm@hyd.city', password: 'demo1234' },
  authority_tsrtc: { email: 'authority.tsrtc@hyd.city', password: 'demo1234' },
} as const;

export const LOCALITY_SUGGESTIONS = [
  'HITEC City / Madhapur',
  'Gachibowli',
  'Kukatpally',
  'Begumpet',
  'Secunderabad',
  'Charminar',
  'Miyapur',
  'Uppal',
  'LB Nagar',
  'Tarnaka',
  'Dilsukhnagar',
  'Kondapur',
];