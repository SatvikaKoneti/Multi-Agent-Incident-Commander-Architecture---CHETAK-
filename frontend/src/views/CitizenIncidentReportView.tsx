import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Camera,
  CheckCircle2,
  FileVideo,
  Gauge,
  LocateFixed,
  MapPin,
  Radar,
  Send,
  ShieldAlert,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { api, mediaUrl } from '../lib/api';
import type { Classification, Complaint, SubmitComplaintResponse, TrackResponse, User } from '../lib/types';
import { LOCALITY_SUGGESTIONS, clamp, formatInr, formatNum, humanStatus, scoreColor, severityColor, statusTone, timeAgo } from '../lib/format';
import { navigate } from '../lib/router';
import { Badge, Chip, Empty, ErrorBlock, Field, Loading, Panel, ProgressBar, Section, StatusPill, Tabs } from '../components/MissionControlUiComponents';
import { TimelineFlow } from '../components/IncidentTimelineFlowComponents';
import { ComplaintLocationMap, findNearestLocality } from '../components/IncidentLocationPinMap';

/* ------------------------------------------------------------------ */

export default function CitizenRouter({ user, rest }: { user: User; rest: string[] }) {
  const sub = rest[0] || 'home';
  if (sub === 'submit') return <CitizenSubmit user={user} />;
  if (sub === 'track') return <CitizenTrack />;
  if (sub === 'mine') return <CitizenMine user={user} />;
  return <CitizenHome user={user} />;
}

/* ---------------- Home ---------------- */

function CitizenHome({ user }: { user: User }) {
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get<{ complaints: Complaint[] }>('/api/complaints')
      .then(({ data }) => setComplaints(data.complaints.slice(0, 6)))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-ink-900 via-ink-850 to-ink-900 p-6 sm:p-8 animate-fade-up">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative">
          <Badge tone="info"><Sparkles className="h-3 w-3" /> AI-assisted urban reporting</Badge>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
            Help run Hyderabad, <span className="text-gradient">one report at a time</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            Report road, air, energy, waste or water issues. Agentic AI analyses your report, ranks priority, and routes the problem to the right city authority.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => navigate('/citizen/submit')}>
              <Send className="h-4 w-4" /> Report an issue
            </button>
            <button className="btn-ghost" onClick={() => navigate('/citizen/track')}>
              Track my report
            </button>
          </div>
          <div className="mt-6 grid max-w-lg grid-cols-3 gap-2 text-center">
            {[['1', 'Report'], ['2', 'AI analyses'], ['3', 'Authority acts']].map(([n, t]) => (
              <div key={n} className="rounded-xl border border-white/[0.06] bg-ink-950/60 p-3">
                <p className="font-mono text-lg font-bold text-cyan-300">{n}</p>
                <p className="text-[11px] text-slate-500">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section
        title={user ? 'Your latest reports' : 'Recent reports across the city'}
        right={
          <button className="btn-ghost !flex !px-3 !py-1.5 text-xs" onClick={() => navigate(user ? '/citizen/mine' : '/citizen/track')}>
            View all
          </button>
        }
      >
        {err ? <ErrorBlock error={err} /> : !complaints ? <Loading /> : !complaints.length ? <Empty /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {complaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

export function ComplaintCard({ complaint, tracking = true }: { complaint: Complaint; tracking?: boolean }) {
  const tone = statusTone(complaint.status);
  return (
    <Panel hover className="flex flex-col gap-2 p-4" onClick={() => navigate(`/citizen/track?q=${complaint.tracking_id}`)}>
      <div className="flex items-center justify-between gap-2">
        <Chip className="border border-white/[0.07] bg-white/[0.03] font-mono text-[10px] text-slate-400">
          {complaint.tracking_id}
        </Chip>
        <span className="chip" style={{ color: tone.text }}>
          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          {humanStatus(complaint.status)}
        </span>
      </div>
      <p className="text-[14px] font-semibold leading-snug text-slate-100">{complaint.title}</p>
      <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{complaint.description}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {complaint.category ? <Chip className="border-violet-400/25 bg-violet-400/10 text-violet-300">{complaint.category}</Chip> : null}
          {complaint.ai_classified ? <Chip className="border-cyan-400/25 bg-cyan-400/10 text-cyan-300"><Sparkles className="h-3 w-3" />AI</Chip> : null}
        </div>
        <div className="flex items-center gap-2">
          {complaint.priority_score ? (
            <span className="font-mono text-xs font-bold" style={{ color: scoreColor(complaint.priority_score) }}>
              {complaint.priority_score.toFixed(0)}
            </span>
          ) : null}
          <span className="text-[10px] text-slate-600">{timeAgo(complaint.created_at)}</span>
        </div>
      </div>
      {tracking ? null : null}
    </Panel>
  );
}

/* ---------------- Submit ---------------- */

const CATEGORY_OPTIONS = [
  '', 'Traffic & Roads', 'Air Pollution', 'Energy / Power Supply', 'Public Transport',
  'Waste Management', 'Water Supply', 'Drainage', 'Street Lights', 'Other',
];

function ClassificationDetail({ classification }: { classification: Classification }) {
  if (!classification) return null;
  const dims = classification.priority_dimensions;
  const score = classification.priority_score ?? classification.score ?? 0;
  return (
    <Panel glow className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <p className="text-sm font-semibold text-slate-100">AI classification complete</p>
          <Chip className="border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
            {Math.round(classification.confidence * 100)}% confidence
          </Chip>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold" style={{ color: scoreColor(score) }}>{score.toFixed(1)}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">priority score</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-violet-400/20 bg-violet-400/[0.06] p-3">
          <p className="label">Category</p>
          <p className="mt-1 text-sm font-bold text-violet-200">{classification.category || '—'}</p>
          {classification.domain ? <p className="text-[10px] text-slate-500">domain · {classification.domain}</p> : null}
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
          <p className="label">Severity</p>
          <p className="mt-1 text-sm font-bold" style={{ color: severityColor(classification.severity) }}>{classification.severity}/10</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
          <p className="label">Locality</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">{classification.locality || '—'}</p>
        </div>
      </div>
      {classification.summary ? <p className="text-sm leading-relaxed text-slate-300">{classification.summary}</p> : null}
      {dims ? <DimensionsCompact dims={dims as Record<string, number | undefined>} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {classification.key_indicators?.length ? (
          <div>
            <p className="label mb-1.5">Key indicators</p>
            <ul className="space-y-1 text-xs text-slate-400">
              {classification.key_indicators.map((k) => (
                <li key={k} className="flex gap-1.5"><span className="mt-1 h-1 w-1 rounded-full bg-cyan-300" />{k}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {classification.missing_information?.length ? (
          <div>
            <p className="label mb-1.5">Missing information</p>
            <ul className="space-y-1 text-xs text-amber-200/80">
              {classification.missing_information.map((k) => (
                <li key={k} className="flex gap-1.5"><span className="mt-1 h-1 w-1 rounded-full bg-amber-300" />{k}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function DimensionsCompact({ dims }: { dims: Record<string, number | undefined> }) {
  const rows = Object.entries(dims).filter(([, v]) => typeof v === 'number');
  if (!rows.length) return null;
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-5">
      {rows.map(([k, v]) => (
        <div key={k}>
          <div className="mb-1 flex justify-between text-[10px]">
            <span className="capitalize text-slate-500">{k.replace(/_/g, ' ')}</span>
            <span className="font-mono text-slate-300">{v}</span>
          </div>
          <ProgressBar value={clamp(v as number, 0, 100)} color={scoreColor(v as number)} />
        </div>
      ))}
    </div>
  );
}

function CitizenSubmit({ user }: { user: User | null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locality, setLocality] = useState('');
  const [area, setArea] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState(6);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubmitComplaintResponse | null>(null);
  const [geo, setGeo] = useState<'idle' | 'busy' | 'done' | 'denied'>('idle');

  function onFile(f: File | null, kind: 'image' | 'video') {
    if (!f) return;
    if (kind === 'image' && !/^image\/(png|jpeg|webp)$/.test(f.type)) {
      setError('Image must be PNG, JPEG or WebP.');
      return;
    }
    if (kind === 'video' && !/^video\/(mp4|webm|quicktime)$/.test(f.type)) {
      setError('Video must be MP4, WebM or QuickTime.');
      return;
    }
    if (kind === 'image') {
      setImage(f);
      setImageUrl(URL.createObjectURL(f));
    } else {
      setVideo(f);
      setVideoUrl(URL.createObjectURL(f));
    }
  }

  function locate() {
    if (!navigator.geolocation) return;
    setGeo('busy');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        setLat(latitude.toString());
        setLng(longitude.toString());
        const detected = findNearestLocality(latitude, longitude);
        if (detected) setLocality(detected);
        setGeo('done');
      },
      () => setGeo('denied'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
      setError('Please select the location of the issue on the map.');
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('description', description.trim());
      if (category) form.append('category', category);
      if (locality.trim()) form.append('locality', locality.trim());
      if (area.trim()) form.append('area', area.trim());
      if (lat.trim()) form.append('lat', lat);
      if (lng.trim()) form.append('lng', lng);
      form.append('severity_input', String(severity));
      if (image) form.append('image', image);
      if (video) form.append('video', video);
      const { data } = await api.post<SubmitComplaintResponse>('/api/complaints', { form });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 animate-fade-up">
        <Panel glow className="p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
          <h2 className="mt-3 text-xl font-bold text-slate-100">Report submitted</h2>
          <p className="mt-1 text-sm text-slate-400">Keep this tracking ID for updates</p>
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 font-mono text-lg font-bold tracking-wide text-cyan-200">
            {result.tracking_id}
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button className="btn-primary" onClick={() => navigate(`/citizen/track?q=${result.tracking_id}`)}>Track progress</button>
            <button className="btn-ghost" onClick={() => window.location.reload()}>Report another</button>
          </div>
        </Panel>
        {result.classification ? (
          <ClassificationDetail classification={result.classification} />
        ) : (
          <Panel className="p-4">
            <p className="text-sm text-slate-400">AI classification pending — the live LLM is not configured (no <code className="text-[11px]">OPENROUTER_API_KEY</code>), so no AI analysis is fabricated.</p>
          </Panel>
        )}
        {result.classification?.complaint ? (
          <Panel className="p-4">
            <p className="label mb-2">Live status</p>
            <div className="flex items-center justify-between">
              <StatusPill status={result.classification.complaint.status} />
              <span className="text-xs text-slate-500">priority · <span className="font-mono text-slate-300">{result.classification.complaint.priority_score ?? '—'}</span></span>
            </div>
          </Panel>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">Report an urban issue</h1>
        <p className="mt-1 text-sm text-slate-500">Include text, photos or video — the AI agents handle the rest.</p>
      </div>

      <Panel className="p-5">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Issue title">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. Pothole blocking the right lane on Road No. 45" required />
          </Field>
          <Field label="Describe what you see" hint="Add a landmark, timing, frequency and who is affected.">
            <textarea className="input min-h-[96px] resize-y" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} placeholder="Only AI-relevant detail — be specific…" required />
          </Field>

          {/* Location Map Selection */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-200">
                Complaint Location on Map <span className="text-cyan-400">*</span>
              </label>
              <button type="button" className="btn-ghost !px-2.5 !py-1 text-xs" onClick={locate}>
                <LocateFixed className="h-3.5 w-3.5 text-cyan-300" />
                {geo === 'busy' ? 'Detecting…' : geo === 'done' ? 'GPS Locked' : 'Locate me'}
              </button>
            </div>
            <ComplaintLocationMap
              lat={lat ? parseFloat(lat) : null}
              lng={lng ? parseFloat(lng) : null}
              onLocationSelect={(selectedLat, selectedLng, detectedLocality) => {
                setLat(selectedLat.toFixed(6));
                setLng(selectedLng.toFixed(6));
                if (detectedLocality && !locality) {
                  setLocality(detectedLocality);
                }
              }}
              height={320}
            />
            {lat && lng ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-3.5 py-2.5 text-xs text-cyan-200">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-300 shrink-0" />
                  <span>
                    Selected: <strong className="font-mono">{lat}, {lng}</strong>
                  </span>
                </div>
                {locality ? (
                  <Chip className="border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                    {locality}
                  </Chip>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-amber-300/80">
                * Click/tap on the Hyderabad map above or use &quot;Locate me&quot; to set the issue location.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Locality">
              <>
                <input className="input" list="locality-list" value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="e.g. Gachibowli" />
                <datalist id="locality-list">
                  {LOCALITY_SUGGESTIONS.map((l) => <option key={l} value={l} />)}
                </datalist>
              </>
            </Field>
            <Field label="Nearest landmark / area">
              <input className="input" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Near Durgam Cheruvu gate 1" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category (optional)">
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c || 'Let AI classify'}</option>)}
              </select>
            </Field>
            <Field label={`Severity · ${severity}/10`} hint="How urgent is it for daily life?">
              <input type="range" min={1} max={10} value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="w-full accent-cyan-400" />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed border-white/15 p-4">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-cyan-300" />
                <p className="text-xs font-semibold text-slate-300">Photo <span className="text-slate-600">(≤ 5 MB)</span></p>
              </div>
              <input className="mt-2 block w-full text-[11px] text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-cyan-300" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onFile(e.target.files?.[0] ?? null, 'image')} />
              {imageUrl ? <img src={imageUrl} alt="preview" className="mt-2 h-24 w-full rounded-lg object-cover" /> : null}
            </div>
            <div className="rounded-xl border border-dashed border-white/15 p-4">
              <div className="flex items-center gap-2">
                <FileVideo className="h-4 w-4 text-violet-300" />
                <p className="text-xs font-semibold text-slate-300">Video <span className="text-slate-600">(≤ 50 MB)</span></p>
              </div>
              <input className="mt-2 block w-full text-[11px] text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-400/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-violet-300" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => onFile(e.target.files?.[0] ?? null, 'video')} />
              {videoUrl ? <video src={videoUrl} className="mt-2 h-24 w-full rounded-lg object-cover" controls muted /> : null}
            </div>
          </div>

          {error ? <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p> : null}

          {!user ? (
            <p className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-[11px] text-amber-200/90">
              <ShieldAlert className="h-3.5 w-3.5" /> Submitting as a guest — sign in to keep your reports listed under your account.
            </p>
          ) : null}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? (<><UploadCloud className="h-4 w-4 animate-pulse" /> Submitting…</>) : (<><Send className="h-4 w-4" /> Submit report</>)}
          </button>
        </form>
      </Panel>
    </div>
  );
}

/* ---------------- Track ---------------- */

function CitizenTrack() {
  const [q, setQ] = useState('');
  const [tracking, setTracking] = useState<string | null>(null);
  const [data, setData] = useState<TrackResponse | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qv = params.get('q');
    if (qv) {
      setTracking(qv);
      setQ(qv);
    }
  }, []);

  const load = useCallback(async (id: string) => {
    setBusy(true);
    setErr('');
    setData(null);
    try {
      const { data } = await api.get<TrackResponse>(`/api/complaints/track/${encodeURIComponent(id)}`);
      setData(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Not found');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (tracking) load(tracking);
  }, [tracking, load]);

  function submit(e: FormEvent) {
    e.preventDefault();
    setTracking(q.trim());
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">Track a report</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the tracking ID you received when you submitted.</p>
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input
          ref={inputRef}
          className="input font-mono"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="HYD-2026-123456"
        />
        <button className="btn-primary shrink-0" disabled={busy || !q.trim()}>
          <Gauge className="h-4 w-4" /> Track
        </button>
      </form>

      {err ? <ErrorBlock error={err} onRetry={() => tracking && load(tracking)} /> : null}
      {busy ? <Loading label="Looking up report…" /> : null}
      {data ? (
        <>
          <Panel glow className="flex items-center justify-between gap-3 p-5">
            <div>
              <p className="label">Tracking ID</p>
              <p className="font-mono text-lg font-bold text-cyan-200">{data.complaint.tracking_id}</p>
            </div>
            <StatusPill status={data.complaint.status} />
          </Panel>
          <Panel className="p-5">
            <p className="label mb-2">Title</p>
            <p className="text-base font-semibold text-slate-100">{data.complaint.title}</p>
            <p className="mt-1 text-sm text-slate-400">{data.complaint.description}</p>
            {data.complaint.image_path ? <img src={mediaUrl(data.complaint.image_path)!} className="mt-3 max-h-52 rounded-xl object-cover" alt="evidence" /> : null}
            {(data.complaint.category || data.complaint.priority_score != null) ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {data.complaint.category ? <Chip className="border-violet-400/25 bg-violet-400/10 text-violet-300">{data.complaint.category}</Chip> : null}
                {data.complaint.priority_score != null ? (
                  <Chip className="border-cyan-400/25 bg-cyan-400/10 font-mono text-cyan-300">priority {data.complaint.priority_score.toFixed(1)}</Chip>
                ) : null}
                {data.complaint.severity_input ? <Chip className="border-white/[0.07]">severity {data.complaint.severity_input}/10</Chip> : null}
              </div>
            ) : null}
          </Panel>

          {data.complaint.lat != null && data.complaint.lng != null && !isNaN(Number(data.complaint.lat)) && !isNaN(Number(data.complaint.lng)) ? (
            <Panel className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-300" />
                  <p className="label">Complaint location</p>
                </div>
                <Chip className="border-cyan-400/30 bg-cyan-400/10 font-mono text-cyan-300">
                  {Number(data.complaint.lat).toFixed(4)}, {Number(data.complaint.lng).toFixed(4)}
                </Chip>
              </div>
              <ComplaintLocationMap
                lat={Number(data.complaint.lat)}
                lng={Number(data.complaint.lng)}
                readOnly
                height={240}
              />
            </Panel>
          ) : null}
          <Panel className="p-5">
            <p className="label mb-4">Status journey</p>
            <TimelineFlow steps={data.timeline} />
          </Panel>
        </>
      ) : null}
      {!busy && !err && !data && !tracking ? (
        <Panel className="p-6 text-center">
          <MapPin className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-2 text-sm text-slate-500">Example: HYD-2026-000001</p>
        </Panel>
      ) : null}
    </div>
  );
}

/* ---------------- Mine ---------------- */

const MINE_FILTERS = ['all', 'in_review', 'in_progress', 'resolved'];

function CitizenMine({ user }: { user: User }) {
  const [list, setList] = useState<Complaint[] | null>(null);
  const [filter, setFilter] = useState('all');
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get<{ complaints: Complaint[] }>('/api/complaints')
      .then(({ data }) => setList(data.complaints))
      .catch((e) => setErr(e.message));
  }, []);

  const filtered = useMemo(() => (filter === 'all' ? list ?? [] : (list ?? []).filter((c) => c.status === filter)), [list, filter]);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">My reports</h1>
          <p className="mt-1 text-sm text-slate-500">{user.name}</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/citizen/submit')}><Send className="h-4 w-4" /> New report</button>
      </div>

      <Tabs value={filter} onChange={setFilter} tabs={MINE_FILTERS.map((f) => ({ key: f, label: f.replace('_', ' ') }))} />

      {err ? <ErrorBlock error={err} /> : !list ? <Loading /> : !filtered.length ? (
        <Empty title="No reports here" hint="Submit your first report and the AI pipeline will start working on it." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
        </div>
      )}
    </div>
  );
}

export function ComplaintTypeIcon() {
  return <Radar className="h-4 w-4" />;
}
export function costMaybe(v?: number | null) {
  return formatInr(v ?? undefined);
}
export function numMaybe(v?: number | null) {
  return v == null ? '—' : formatNum(v);
}