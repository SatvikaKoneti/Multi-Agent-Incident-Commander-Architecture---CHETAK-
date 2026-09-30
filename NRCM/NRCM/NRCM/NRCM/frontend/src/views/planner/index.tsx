import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Globe,
  Image as ImageIcon,
  Layers,
  Landmark,
  MapPin,
  MessageSquareWarning,
  Plus,
  Radar,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  Video,
} from 'lucide-react';
import { api, mediaUrl } from '../../lib/api';
import type {
  CityIntelligenceData,
  ProblemCluster,
  Locality,
  LocalityDashboard,
  Dashboard,
} from '../../lib/types';
import { formatNum, formatDate, scoreColor } from '../../lib/format';
import { navigate } from '../../lib/router';
import {
  Badge,
  Chip,
  Empty,
  ErrorBlock,
  Field,
  JsonBlock,
  Loading,
  Modal,
  Panel,
  Section,
  StatCard,
  StatusPill,
  Tabs,
} from '../../components/ui';
import MapView from '../../components/MapView';
import CityWideProblemMap from '../../components/CityWideProblemMap';
import { AnalysisDetail } from './analysis';
import { PlannerAuthority, Deploy } from './authority';
import { MemoryView } from './memory';
import { PlannerGrokAssistantView } from './copilot';

/* ------------------------------------------------------------------ */

export default function PlannerRouter({ rest }: { rest: string[] }) {
  const sub = rest[0] || 'dashboard';
  if (sub === 'assistant' || sub === 'copilot') return <PlannerGrokAssistantView />;
  if (sub === 'localities') {
    if (rest[1]) return <LocalityDetail id={rest[1]} />;
    return <Localities />;
  }
  if (sub === 'analyses') {
    if (rest[1]) return <AnalysisDetail id={Number(rest[1])} />;
    return <AnalysesList />;
  }
  if (sub === 'authority') return <PlannerAuthority />;
  if (sub === 'implementations') return <Deploy />;
  if (sub === 'memory') return <MemoryView />;
  return <CityWideDashboard />;
}

/* ---------------- City-Wide Urban Problem Intelligence Dashboard ---------------- */

function CityWideDashboard() {
  const [data, setData] = useState<CityIntelligenceData | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  // Search and Filter States
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [assignedOnly, setAssignedOnly] = useState(false);

  // Selected Cluster for Modal Drawer
  const [selectedCluster, setSelectedCluster] = useState<ProblemCluster | null>(null);

  const fetchIntelligence = () => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (search) queryParams.set('search', search);
    if (filterArea) queryParams.set('filterArea', filterArea);
    if (filterCategory) queryParams.set('filterCategory', filterCategory);
    if (filterPriority) queryParams.set('filterPriority', filterPriority);
    if (filterStatus) queryParams.set('filterStatus', filterStatus);
    if (assignedOnly) queryParams.set('assignedOnly', 'true');

    api
      .get<CityIntelligenceData>(`/api/planner/city-intelligence?${queryParams.toString()}`)
      .then(({ data }) => {
        setData(data);
        // If selectedCluster is set, update it with fresh data
        if (selectedCluster) {
          const updated = data.clusters.find((c) => c.cluster_id === selectedCluster.cluster_id);
          if (updated) setSelectedCluster(updated);
        }
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIntelligence();
  }, [search, filterArea, filterCategory, filterPriority, filterStatus, assignedOnly]);

  const handleAcknowledge = async (clusterId: string) => {
    try {
      await api.post(`/api/planner/clusters/${encodeURIComponent(clusterId)}/acknowledge`);
      fetchIntelligence();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to acknowledge cluster');
    }
  };

  const handleStatusUpdate = async (clusterId: string, newStatus: string) => {
    try {
      await api.patch(`/api/planner/clusters/${encodeURIComponent(clusterId)}/status`, {
        json: { status: newStatus },
      });
      fetchIntelligence();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update status');
    }
  };

  if (err) return <ErrorBlock error={err} onRetry={() => window.location.reload()} />;
  if (!data && loading) return <Loading label="Synthesising Hyderabad city-wide intelligence…" />;

  const stats = data?.stats || {
    total_active_problems: 0,
    total_citizen_reports: 0,
    critical_problems: 0,
    high_priority_problems: 0,
    unresolved_problems: 0,
    overdue_problems: 0,
    in_progress_problems: 0,
    affected_areas_count: 0,
  };

  const categoriesList = [
    'Road Damage',
    'Traffic Congestion',
    'Public Transport',
    'Waste Management',
    'Water Supply',
    'Drainage',
    'Energy / Power Supply',
    'Street Lights',
    'Air Pollution',
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 animate-fade-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
              Hyderabad · City-Wide Problem Intelligence
            </h1>
            <Chip className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono text-xs">
              <Globe className="h-3.5 w-3.5" /> All Locality Zones
            </Chip>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live DB Aggregation · Problem Clustering Engine & Authority Matrix Active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs" onClick={() => navigate('/planner/localities')}>
            <Landmark className="h-3.5 w-3.5" /> Locality Grid
          </button>
          <button className="btn-primary text-xs" onClick={() => navigate('/planner/analyses')}>
            <Plus className="h-3.5 w-3.5" /> New AI Analysis
          </button>
        </div>
      </div>

      {/* 1. City-Wide KPI Cards Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 animate-fade-up">
        <StatCard
          label="Active Problems"
          value={stats.total_active_problems}
          sub="problem clusters"
          icon={<Radar className="h-4 w-4" />}
          tone="rose"
        />
        <StatCard
          label="Citizen Reports"
          value={stats.total_citizen_reports}
          sub="complaints submitted"
          icon={<MessageSquareWarning className="h-4 w-4" />}
          tone="cyan"
        />
        <StatCard
          label="Critical Problems"
          value={stats.critical_problems}
          sub="score ≥ 75 (24h SLA)"
          icon={<ShieldAlert className="h-4 w-4" />}
          tone="rose"
        />
        <StatCard
          label="High Priority"
          value={stats.high_priority_problems}
          sub="score ≥ 60 (48h SLA)"
          icon={<AlertTriangle className="h-4 w-4" />}
          tone="amber"
        />
        <StatCard
          label="SLA Overdue"
          value={stats.overdue_problems}
          sub="exceeded SLA window"
          icon={<Clock className="h-4 w-4" />}
          tone="amber"
        />
        <StatCard
          label="In Progress"
          value={stats.in_progress_problems}
          sub="being resolved"
          icon={<TrendingUp className="h-4 w-4" />}
          tone="emerald"
        />
        <StatCard
          label="Affected Areas"
          value={stats.affected_areas_count}
          sub="out of 12 zones"
          icon={<Building2 className="h-4 w-4" />}
          tone="violet"
        />
      </div>

      {/* 2. Interactive City-Wide Leaflet Map */}
      <Panel className="p-4 relative" glow>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-400" />
              City-Wide Geographic Problem Map — Hyderabad
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive pin markers represent problem clusters. Click any pin for cluster details & SLA.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Critical
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> High
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Medium
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Low
            </span>
          </div>
        </div>

        <CityWideProblemMap
          clusters={data?.clusters || []}
          selectedClusterId={selectedCluster?.cluster_id}
          onSelectCluster={(cluster) => setSelectedCluster(cluster)}
          height={380}
        />
      </Panel>

      {/* 3. Problem Hotspots Ranking & Problems by Area Summary Matrix */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        {/* Hotspots Card */}
        <Panel className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Top Problem Hotspots
            </h3>
            <Chip className="border-rose-500/30 bg-rose-500/10 text-rose-300">Priority Ranked</Chip>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Hyderabad localities ranked by highest count of unresolved & critical urban issues.
          </p>

          <div className="space-y-2.5">
            {data?.hotspots.map((h) => (
              <div
                key={h.locality_id}
                onClick={() => {
                  setFilterArea(h.locality_id);
                }}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-rose-500/40 hover:bg-rose-500/[0.04] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/10 text-xs font-bold text-rose-400 font-mono">
                    #{h.rank}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{h.locality_name}</h4>
                    <p className="text-[10px] text-slate-500">{h.total_reports} total citizen reports</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {h.critical_problems > 0 ? (
                    <Badge tone="bad">{h.critical_problems} Critical</Badge>
                  ) : null}
                  <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200 font-mono">
                    {h.active_problems} active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Problems by Area Summary Matrix */}
        <Panel className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Problems by Locality Area Matrix
            </h3>
            <span className="text-xs text-slate-400">12 Planning Zones</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/[0.08] text-[10px] uppercase text-slate-400 font-mono">
                <tr>
                  <th className="py-2 px-2">Locality Area</th>
                  <th className="py-2 px-2 text-center">Active</th>
                  <th className="py-2 px-2 text-center">Critical</th>
                  <th className="py-2 px-2 text-center">Overdue</th>
                  <th className="py-2 px-2 text-center">Reports</th>
                  <th className="py-2 px-2">Assigned Planner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data?.problems_by_area.map((area) => (
                  <tr
                    key={area.locality_id}
                    onClick={() => setFilterArea(area.locality_id)}
                    className="hover:bg-white/[0.03] transition cursor-pointer"
                  >
                    <td className="py-2.5 px-2 font-semibold text-slate-200">{area.locality_name}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`font-mono font-bold ${area.active_problems > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {area.active_problems}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {area.critical > 0 ? (
                        <span className="font-mono font-bold text-rose-400">{area.critical}</span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {area.overdue > 0 ? (
                        <span className="font-mono font-bold text-rose-500">{area.overdue}</span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400">{area.total_reports}</td>
                    <td className="py-2.5 px-2 text-slate-400 text-[11px] truncate max-w-[140px]">
                      {area.assigned_planner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* 4. Search & Multi-Filter Control Bar */}
      <Panel className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">Filter City-Wide Problem Clusters</h3>
            </div>

            {/* My Assigned Areas vs All City View Toggle */}
            <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-ink-950 p-1">
              <button
                onClick={() => setAssignedOnly(false)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  !assignedOnly
                    ? 'bg-cyan-500 text-slate-950 shadow-glow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                All Hyderabad (City-Wide)
              </button>
              <button
                onClick={() => setAssignedOnly(true)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  assignedOnly
                    ? 'bg-cyan-500 text-slate-950 shadow-glow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                My Assigned Areas Only
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                className="input pl-9 text-xs"
                placeholder="Search area, title, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Area Filter */}
            <select
              className="input text-xs"
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
            >
              <option value="">All Hyderabad Areas</option>
              {data?.localities.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              className="input text-xs"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Problem Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              className="input text-xs"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">All Priority Levels</option>
              <option value="Critical">Critical (≥ 75)</option>
              <option value="High">High (60 - 74)</option>
              <option value="Medium">Medium (40 - 59)</option>
              <option value="Low">Low (&lt; 40)</option>
            </select>

            {/* Status Filter */}
            <select
              className="input text-xs"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="new">New / Unacknowledged</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="overdue">Overdue</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {(search || filterArea || filterCategory || filterPriority || filterStatus || assignedOnly) ? (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-cyan-300">
                Showing {data?.filtered_clusters_count} of {data?.total_clusters_count} problem clusters
              </span>
              <button
                onClick={() => {
                  setSearch('');
                  setFilterArea('');
                  setFilterCategory('');
                  setFilterPriority('');
                  setFilterStatus('');
                  setAssignedOnly(false);
                }}
                className="flex items-center gap-1 text-xs text-rose-400 hover:underline"
              >
                <RotateCcw className="h-3 w-3" /> Reset all filters
              </button>
            </div>
          ) : null}
        </div>
      </Panel>

      {/* 5. City-Wide Problem Clusters Table */}
      <Section
        title={`Hyderabad Problem Clusters (${data?.filtered_clusters_count || 0})`}
        subtitle="Aggregated citizen complaints grouped into actionable locality problem clusters with SLAs"
      >
        {!data?.clusters.length ? (
          <Empty
            title="No problem clusters found"
            hint="Try changing or resetting your search filters."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-ink-900/60 shadow-panel backdrop-blur">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] uppercase text-slate-400 font-mono">
                <tr>
                  <th className="py-3 px-4">Area / Locality</th>
                  <th className="py-3 px-4">Problem Cluster</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Reports</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4">Assigned Planner</th>
                  <th className="py-3 px-4">Authority</th>
                  <th className="py-3 px-4">SLA / Time Remaining</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.clusters.map((cluster) => {
                  const score = cluster.priority_score;
                  const isOverdue = cluster.is_overdue;

                  return (
                    <tr
                      key={cluster.cluster_id}
                      className="hover:bg-white/[0.03] transition cursor-pointer"
                      onClick={() => setSelectedCluster(cluster)}
                    >
                      {/* Area */}
                      <td className="py-3.5 px-4 font-bold text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                          <span>{cluster.locality_name}</span>
                        </div>
                      </td>

                      {/* Problem Cluster Title */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <p className="font-bold text-slate-200 text-xs truncate">
                          {cluster.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {cluster.representative_complaint.title}
                        </p>
                        {cluster.is_recurring ? (
                          <span className="inline-block mt-1 text-[9px] font-bold text-amber-300 border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 rounded">
                            Recurring Pattern
                          </span>
                        ) : null}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Chip className="border-white/[0.08] text-slate-300 text-[11px]">
                          {cluster.category}
                        </Chip>
                      </td>

                      {/* Reports */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-200 text-sm">
                          {cluster.report_count}
                        </span>
                        <div className="flex items-center justify-center gap-1 mt-0.5 text-[10px] text-slate-500">
                          {cluster.media_summary.photos > 0 ? (
                            <span className="flex items-center gap-0.5 text-cyan-400">
                              <ImageIcon className="h-2.5 w-2.5" /> {cluster.media_summary.photos}
                            </span>
                          ) : null}
                          {cluster.media_summary.videos > 0 ? (
                            <span className="flex items-center gap-0.5 text-violet-400">
                              <Video className="h-2.5 w-2.5" /> {cluster.media_summary.videos}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded-full inline-block"
                          style={{
                            color: scoreColor(score),
                            backgroundColor: `${scoreColor(score)}15`,
                            border: `1px solid ${scoreColor(score)}40`,
                          }}
                        >
                          {score.toFixed(0)} ({cluster.priority_level.level})
                        </span>
                      </td>

                      {/* Assigned Planner */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-300 text-xs font-medium block">
                          {cluster.assigned_planner_name}
                        </span>
                        <span className="text-slate-500 text-[10px] font-mono">
                          ID: {cluster.assigned_planner_id}
                        </span>
                      </td>

                      {/* Responsible Authority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-amber-300 text-xs block">
                          {cluster.authority_code}
                        </span>
                        <span className="text-slate-400 text-[10px] truncate max-w-[120px] block">
                          {cluster.authority_name}
                        </span>
                      </td>

                      {/* SLA / Time Remaining */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className={`h-3.5 w-3.5 ${isOverdue ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
                          <div>
                            <span className={`font-mono text-xs font-bold ${isOverdue ? 'text-rose-400' : 'text-slate-200'}`}>
                              {isOverdue
                                ? `OVERDUE (+${cluster.elapsed_hours - cluster.sla_hours}h)`
                                : `${cluster.remaining_hours}h left`}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Target: {cluster.sla_hours}h SLA
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <StatusPill status={cluster.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {['new', 'overdue'].includes(cluster.status) ? (
                            <button
                              onClick={() => handleAcknowledge(cluster.cluster_id)}
                              className="btn-secondary text-[11px] py-1 px-2.5 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Acknowledge
                            </button>
                          ) : null}

                          <button
                            onClick={() => setSelectedCluster(cluster)}
                            className="btn-primary text-[11px] py-1 px-2.5"
                          >
                            <Eye className="h-3 w-3" /> View & Action
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* 6. Problem Cluster Drill-Down Modal / Drawer */}
      {selectedCluster ? (
        <ClusterDetailModal
          cluster={selectedCluster}
          onClose={() => setSelectedCluster(null)}
          onAcknowledge={() => handleAcknowledge(selectedCluster.cluster_id)}
          onStatusUpdate={(newStatus) => handleStatusUpdate(selectedCluster.cluster_id, newStatus)}
        />
      ) : null}
    </div>
  );
}

/* ---------------- Cluster Detail Modal ---------------- */

function ClusterDetailModal({
  cluster,
  onClose,
  onAcknowledge,
  onStatusUpdate,
}: {
  cluster: ProblemCluster;
  onClose: () => void;
  onAcknowledge: () => void;
  onStatusUpdate: (status: string) => void;
}) {
  const [tab, setTab] = useState<'details' | 'complaints' | 'evidence' | 'advisory'>('details');

  return (
    <Modal open={true} onClose={onClose} title={`Problem Cluster Detail — ${cluster.locality_name}`} wide>
      <div className="space-y-5 text-slate-800 dark:text-slate-100">
        {/* Modal Header Badge Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{cluster.title}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Locality Zone: <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{cluster.locality_name}</span> ·
              Category: <span className="text-slate-800 dark:text-slate-200 font-medium">{cluster.category}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs font-bold px-3 py-1 rounded-full border ${
                cluster.priority_score >= 70
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-400/30'
                  : cluster.priority_score >= 45
                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/30'
              }`}
            >
              Priority Score: {cluster.priority_score.toFixed(1)} ({cluster.priority_level.level})
            </span>
            <StatusPill status={cluster.status} />
          </div>
        </div>

        {/* Navigation Tabs inside Modal */}
        <Tabs
          value={tab}
          onChange={(t) => setTab(t as typeof tab)}
          tabs={[
            { key: 'details', label: 'Cluster Overview & Actions' },
            { key: 'complaints', label: `Citizen Reports (${cluster.complaints.length})` },
            { key: 'evidence', label: `Media Evidence (${cluster.media_summary.photos + cluster.media_summary.videos})` },
            { key: 'advisory', label: 'AI Advisory & Decision Support' },
          ]}
        />

        {/* Tab 1: Overview & Actions */}
        {tab === 'details' ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* SLA & Workflow Status Card */}
              <Panel className="p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                  SLA & Planner Workflow State
                </h4>

                <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-900/60 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">SLA Window:</span>
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-200">{cluster.sla_hours} Hours ({cluster.sla_level})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Elapsed Time:</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-300">{cluster.elapsed_hours} Hours</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.04] pt-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Time Remaining:</span>
                    <span className={`text-xs font-mono font-bold ${cluster.is_overdue ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {cluster.is_overdue
                        ? `OVERDUE by ${cluster.elapsed_hours - cluster.sla_hours}h`
                        : `${cluster.remaining_hours} Hours Remaining`}
                    </span>
                  </div>
                </div>

                {/* Workflow Buttons */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Planner Actions:</p>

                  {['new', 'overdue'].includes(cluster.status) ? (
                    <button
                      onClick={onAcknowledge}
                      className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Acknowledge Problem Cluster
                    </button>
                  ) : null}

                  <Field label="Update Cluster Status">
                    <select
                      className="input text-xs"
                      value={cluster.status}
                      onChange={(e) => onStatusUpdate(e.target.value)}
                    >
                      <option value="new">New / Unacknowledged</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="in_progress">In Progress / Actioning</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </Field>
                </div>
              </Panel>

              {/* Responsible Authority & Assigned Planner Card */}
              <Panel className="p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                  Responsibility Matrix Mapping
                </h4>

                <div className="rounded-xl border border-amber-500/30 bg-amber-50/80 dark:bg-amber-400/[0.03] p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Responsible Civic Authority</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{cluster.authority_name} ({cluster.authority_code})</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Category <span className="text-slate-900 dark:text-slate-200 font-medium">"{cluster.category}"</span> automatically mapped to {cluster.authority_code} authority matrix.
                  </p>
                </div>

                <div className="rounded-xl border border-cyan-500/30 bg-cyan-50/80 dark:bg-cyan-400/[0.03] p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
                    <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300">Assigned Zone Planner</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{cluster.assigned_planner_name}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Planner ID: <span className="font-mono text-cyan-700 dark:text-cyan-300 font-bold">{cluster.assigned_planner_id}</span> · Primary contact for {cluster.locality_name} zone.
                  </p>
                </div>
              </Panel>
            </div>

            {cluster.xai_priority ? (
              <Panel className="p-4 space-y-2.5 border-cyan-500/20 bg-cyan-50/70 dark:bg-cyan-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 font-mono">
                      Explainable AI (XAI) Priority Attribution
                    </h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-400/10 border border-cyan-300 dark:border-cyan-400/20 px-2 py-0.5 rounded-full">
                    {cluster.priority_score.toFixed(1)} / 100
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {cluster.xai_priority.human_summary}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {Object.entries(cluster.xai_priority.contributions || {}).map(([dim, pct]) => (
                    <div key={dim} className="rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.06] p-2.5 text-center shadow-xs">
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block capitalize truncate">{dim.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-bold font-mono text-cyan-700 dark:text-cyan-300">{Math.round(pct)}%</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-500 block">weight: {Math.round((cluster.xai_priority?.weights?.[dim] || 0) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {/* Representative Complaint Summary */}
            <Panel className="p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                Representative Problem Issue
              </h4>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{cluster.representative_complaint.title}</p>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-white/[0.04]">
                {cluster.representative_complaint.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <span>Location Pin: <strong className="text-slate-900 dark:text-slate-200">{cluster.lat.toFixed(4)}, {cluster.lng.toFixed(4)}</strong></span>
                <span>First Reported: <strong className="text-slate-900 dark:text-slate-200">{formatDate(cluster.first_reported_at)}</strong></span>
                <span>Latest Update: <strong className="text-slate-900 dark:text-slate-200">{formatDate(cluster.latest_reported_at)}</strong></span>
              </div>
            </Panel>
          </div>
        ) : null}

        {/* Tab 2: Linked Complaints List */}
        {tab === 'complaints' ? (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {cluster.complaints.map((c) => (
              <Panel key={c.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-300">{c.tracking_id}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Citizen Severity: {c.severity_input}/10</span>
                    <StatusPill status={c.status} />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-100">{c.title}</h4>
                <p className="text-xs leading-relaxed text-slate-300">{c.description}</p>
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-white/[0.04] pt-2 mt-2">
                  <span>Area: {c.area || cluster.locality_name}</span>
                  <span>Submitted: {formatDate(c.created_at)}</span>
                </div>
              </Panel>
            ))}
          </div>
        ) : null}

        {/* Tab 3: Media Evidence Gallery */}
        {tab === 'evidence' ? (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300">Citizen Photo & Video Evidence Gallery</h4>

            {cluster.complaints.some((c) => c.image_path || c.video_path) ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cluster.complaints.map((c) => (
                  c.image_path ? (
                    <Panel key={`img-${c.id}`} className="p-2 space-y-2">
                      <img
                        src={mediaUrl(c.image_path)!}
                        alt={c.title}
                        className="w-full h-40 object-cover rounded-lg border border-slate-800"
                      />
                      <div className="p-1">
                        <p className="text-xs font-semibold text-slate-200 truncate">{c.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{c.tracking_id}</p>
                      </div>
                    </Panel>
                  ) : null
                ))}
              </div>
            ) : (
              <Empty title="No media evidence uploaded" hint="Citizens have not attached photos or videos to these complaints yet." />
            )}
          </div>
        ) : null}

        {/* Tab 4: AI Advisory */}
        {tab === 'advisory' ? (
          <div className="space-y-4">
            {cluster.xai_priority ? (
              <Panel className="p-4 space-y-3 border-amber-400/20 bg-amber-400/[0.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <h4 className="text-sm font-bold text-slate-100">Explainable AI (XAI) Priority Attribution</h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                    Score: {cluster.priority_score.toFixed(1)} ({cluster.priority_level.level})
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {cluster.xai_priority.human_summary}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.05]">
                  {Object.entries(cluster.xai_priority.contributions || {}).map(([dim, pct]) => (
                    <div key={dim} className="rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.06] p-2 text-center shadow-xs">
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold block capitalize truncate">{dim.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-bold font-mono text-cyan-700 dark:text-cyan-300">{Math.round(pct)}%</span>
                      <span className="text-[9px] text-slate-500 block">weight: {Math.round((cluster.xai_priority?.weights?.[dim] || 0) * 100)}%</span>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-slate-500 font-mono text-center pt-1">
                  Formula: 30% Severity + 25% Population + 20% Environmental + 15% Urgency + 10% Feasibility
                </p>
              </Panel>
            ) : null}

            <Panel className="p-4 space-y-3 border-cyan-400/20 bg-cyan-400/[0.02]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-300 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Decision Support & Root Cause Analysis</h4>
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <p>
                  <strong>Cluster Recommendation:</strong> Issue has been classified under <strong>{cluster.category}</strong> with a priority score of <strong>{cluster.priority_score.toFixed(1)}</strong>. Primary authority dispatch to <strong>{cluster.authority_name} ({cluster.authority_code})</strong> recommended.
                </p>
                <p>
                  <strong>Suggested Action:</strong> Initiate field inspection team dispatch to {cluster.locality_name} coordinates ({cluster.lat.toFixed(4)}, {cluster.lng.toFixed(4)}) and issue formal clarification request to {cluster.authority_code}.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    navigate('/planner/assistant');
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-cyan-300 dark:border-cyan-400/40 bg-cyan-50 dark:bg-cyan-950/40 px-4 py-2.5 text-xs font-semibold text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition w-full shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 animate-pulse" /> Consult Copilot
                </button>
              </div>
            </Panel>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

/* ---------------- Localities ---------------- */

function Localities() {
  const [localities, setLocalities] = useState<Locality[] | null>(null);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get<{ localities: Locality[] }>('/api/planner/localities')
      .then(({ data }) => setLocalities(data.localities))
      .catch((e) => setErr(e.message));
  }, []);

  const filteredLocalities = useMemo(() => {
    if (!localities) return [];
    if (!search.trim()) return localities;
    const q = search.toLowerCase();
    return localities.filter(
      (l) => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)
    );
  }, [localities, search]);

  const selectedLoc = useMemo(() => {
    return localities?.find((l) => l.id === selected) || null;
  }, [localities, selected]);

  if (err) return <ErrorBlock error={err} />;
  if (!localities) return <Loading label="Loading locality grid…" />;

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">Hyderabad Localities</h1>
          <p className="mt-1 text-sm text-slate-400">{localities.length} planning zones across Hyderabad · select to inspect live telemetry.</p>
        </div>
        {selectedLoc ? (
          <button
            onClick={() => navigate(`/planner/localities/${selectedLoc.id}`)}
            className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3.5 shadow-glow"
          >
            <span>View {selectedLoc.name} Intelligence</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Locality Navigation Bar */}
      <div className="rounded-2xl border border-white/[0.08] bg-ink-900/80 p-3 shadow-panel backdrop-blur space-y-3">
        {/* Top Controls Bar: Search & Quick Jump Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="input !pl-9 !py-1.5 text-xs w-full"
              placeholder={`Search across ${localities.length} localities (e.g. Charminar, HITEC City, Alwal)...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Jump to:</span>
            <select
              className="rounded-xl border border-white/10 bg-ink-950 px-3 py-1.5 text-xs font-semibold text-slate-200 outline-none focus:border-cyan-400 transition"
              value={selected || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setSelected(val);
                } else {
                  setSelected(null);
                }
              }}
            >
              <option value="">All Hyderabad Zones ({localities.length})</option>
              {localities.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({formatNum(l.population)} ppl)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Horizontal Scrolling Nav Bar of Locality Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scroll-thin">
          <button
            onClick={() => setSelected(null)}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
              !selected
                ? 'bg-cyan-500 text-ink-950 font-bold shadow-glow'
                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            All Zones ({filteredLocalities.length})
          </button>
          {filteredLocalities.map((l) => {
            const isSelected = selected === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setSelected(isSelected ? null : l.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition shrink-0 ${
                  isSelected
                    ? 'border border-cyan-400/60 bg-cyan-400/20 text-cyan-200 font-semibold ring-1 ring-cyan-400/40 shadow-glow'
                    : 'border border-white/[0.06] bg-ink-950/70 text-slate-300 hover:border-cyan-400/30 hover:bg-cyan-400/[0.05] hover:text-white'
                }`}
              >
                <Landmark className={`h-3 w-3 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{l.name}</span>
                <span className="text-[10px] opacity-60 font-mono">({formatNum(l.population)})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-Width Interactive Map */}
      <Panel className="p-3" glow>
        <MapView
          localities={filteredLocalities}
          selected={selected ?? undefined}
          onSelect={(id) => {
            setSelected(id);
            navigate(`/planner/localities/${id}`);
          }}
          height={540}
        />
      </Panel>
    </div>
  );
}

function LocalityDetail({ id }: { id: string }) {
  const [data, setData] = useState<LocalityDashboard | null>(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('problems');

  useEffect(() => {
    setData(null);
    setErr('');
    api
      .get<LocalityDashboard>(`/api/planner/localities/${encodeURIComponent(id)}/dashboard`)
      .then(({ data }) => setData(data))
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <ErrorBlock error={err} />;
  if (!data) return <Loading label="Loading locality intelligence…" />;

  const loc = data.locality;

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">{loc.name}</h1>
            <Chip className="border-white/[0.07]">{loc.id}</Chip>
          </div>
          <p className="mt-1 text-sm text-slate-500">{formatNum(loc.population)} residents · {loc.area_sqkm} km² · {formatNum(loc.lat, 4)}, {formatNum(loc.lng, 4)}</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/planner/analyses')}>
          <Plus className="h-4 w-4" /> Analyse this zone
        </button>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'problems', label: `Problems (${data.top_problems.length})` },
          { key: 'complaints', label: `Complaints (${data.complaints.length})` },
          { key: 'infra', label: 'Infrastructure' },
        ]}
      />

      {tab === 'problems' ? (
        data.top_problems.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.top_problems.map((p) => (
              <Panel key={p.id} hover className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{p.category}</span>
                  <span className="font-mono text-xs font-bold" style={{ color: scoreColor(p.priority_score) }}>
                    {p.priority_score.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{p.representative_complaint.title}</p>
              </Panel>
            ))}
          </div>
        ) : <Empty />
      ) : null}

      {tab === 'complaints' ? (
        data.complaints.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.complaints.map((c) => (
              <Panel key={c.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-slate-500">{c.tracking_id}</span>
                  <StatusPill status={c.status} />
                </div>
                <p className="mt-2 text-[13px] font-semibold text-slate-100">{c.title}</p>
                <p className="mt-1 text-xs text-slate-500">{c.description}</p>
              </Panel>
            ))}
          </div>
        ) : <Empty />
      ) : null}

      {tab === 'infra' ? (
        data.infrastructure?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(data.infrastructure || []).concat(data.amenities || []).map((item: Record<string, unknown>, i) => (
              <Panel key={i} className="p-4">
                <p className="text-sm font-semibold capitalize text-slate-200">{String(item.name ?? item.type ?? 'asset')}</p>
                <JsonBlock data={item} className="mt-2 max-h-40" />
              </Panel>
            ))}
          </div>
        ) : <Empty title="No infrastructure records" />
      ) : null}
    </div>
  );
}

/* ---------------- Analyses List ---------------- */

function AnalysesList() {
  const [analyses, setAnalyses] = useState<Dashboard['analyses'] | null>(null);
  const [err, setErr] = useState('');

  function load() {
    api
      .get<{ analyses: Dashboard['analyses'] }>('/api/planner/analyses')
      .then(({ data }) => setAnalyses(data.analyses))
      .catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">Analyses Archive</h1>
          <p className="mt-1 text-sm text-slate-500">
            Historical pipeline runs. To diagnose urban bottlenecks, evaluate trade-offs, and draft authority memos, consult the Copilot dashboard.
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-950/40 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 transition shadow-glow"
          onClick={() => navigate('/planner/assistant')}
        >
          <Sparkles className="h-4 w-4 text-cyan-400" /> Open Copilot
        </button>
      </div>

      {err ? <ErrorBlock error={err} onRetry={load} /> : null}
      {!analyses ? (
        <Loading />
      ) : !analyses.length ? (
        <Empty
          title="No archived analyses"
          hint="Use the Copilot dashboard to investigate civic issues, formulate interventions, and coordinate with authorities."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {analyses.map((a) => (
            <Panel
              key={a.id}
              hover
              className="flex flex-col gap-2 p-4 cursor-pointer"
              onClick={() => navigate(`/planner/analyses/${a.id}`)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="chip border border-white/[0.07] font-mono text-[10px] text-slate-400">
                  #{a.id}
                </span>
                <StatusPill status={a.status} />
              </div>
              <p className="text-[14px] font-semibold text-slate-100">{a.problem_title}</p>
              <p className="line-clamp-2 text-xs text-slate-500">{a.problem_description}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{a.locality_id}</span>
                  {a.category ? (
                    <Chip className="border-violet-400/20 bg-violet-400/10 text-violet-300">
                      {a.category}
                    </Chip>
                  ) : null}
                </div>
                {a.priority_score != null ? (
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: scoreColor(a.priority_score) }}
                  >
                    {a.priority_score.toFixed(0)}
                  </span>
                ) : null}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

export { AnalysisDetail };