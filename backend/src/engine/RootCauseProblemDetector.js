import { query, get, run } from '../db/index.js';
import { jsonOrNull, round, nowIso } from '../utils/index.js';
import { priorityLevel } from './IncidentPriorityRanker.js';
import { explainPriority } from './ExplainableAiScoringEngine.js';

export const AUTHORITY_CATEGORY_MAP = {
  'Traffic & Roads': { code: 'GHMC', name: 'GHMC Roads & Infrastructure' },
  'Road Damage': { code: 'GHMC', name: 'GHMC Roads & Infrastructure' },
  'Potholes': { code: 'GHMC', name: 'GHMC Roads & Infrastructure' },
  'Civic Infrastructure': { code: 'GHMC', name: 'GHMC Civic Infrastructure' },
  'Sanitation': { code: 'GHMC', name: 'GHMC Sanitation Department' },
  'Municipal Issues': { code: 'GHMC', name: 'GHMC Municipal Administration' },
  'Roads': { code: 'GHMC', name: 'GHMC Roads & Infrastructure' },
  'Infrastructure': { code: 'GHMC', name: 'GHMC Urban Infrastructure' },

  'Traffic Congestion': { code: 'HTP', name: 'Hyderabad Traffic Police' },
  'Traffic Signals': { code: 'HTP', name: 'Hyderabad Traffic Police' },
  'Junction Problems': { code: 'HTP', name: 'Hyderabad Traffic Police' },
  'Road Traffic Management': { code: 'HTP', name: 'Hyderabad Traffic Police' },
  'Traffic Violations': { code: 'HTP', name: 'Hyderabad Traffic Police' },
  'Parking': { code: 'HTP', name: 'Hyderabad Traffic Police' },

  'Air Pollution': { code: 'TSPCB', name: 'Telangana State Pollution Control Board' },
  'Industrial Pollution': { code: 'TSPCB', name: 'Telangana State Pollution Control Board' },
  'Water Pollution': { code: 'TSPCB', name: 'Telangana State Pollution Control Board' },
  'Noise Pollution': { code: 'TSPCB', name: 'Telangana State Pollution Control Board' },
  'Environment': { code: 'TSPCB', name: 'Telangana State Pollution Control Board' },

  'Waste Management': { code: 'GHMC-SWM', name: 'GHMC Solid Waste Management' },
  'Garbage Collection': { code: 'GHMC-SWM', name: 'GHMC Solid Waste Management' },

  'Water Supply': { code: 'HMWSSB', name: 'HMWSSB Water Supply' },
  'Drainage': { code: 'HMWSSB', name: 'HMWSSB Sewerage & Drainage' },
  'Sewerage': { code: 'HMWSSB', name: 'HMWSSB Sewerage & Drainage' },

  'Energy / Power Supply': { code: 'TSSPDCL', name: 'TSSPDCL Power Distribution' },
  'Electricity': { code: 'TSSPDCL', name: 'TSSPDCL Power Distribution' },
  'Electrical Infrastructure': { code: 'TSSPDCL', name: 'TSSPDCL Power Distribution' },
  'Street Lights': { code: 'TSSPDCL', name: 'TSSPDCL Electrical & Street Lighting' },

  'Public Transport': { code: 'TSRTC', name: 'TSRTC Public Transport' },
  'Bus Operations': { code: 'TSRTC', name: 'TSRTC Public Transport' },

  'Other': { code: 'GHMC', name: 'GHMC Civic Administration' },
};

export function resolveAuthorityForCategory(category) {
  if (!category) return { code: 'GHMC', name: 'GHMC Urban Infrastructure' };

  // 1. Try static map first for speed
  if (AUTHORITY_CATEGORY_MAP[category]) {
    return AUTHORITY_CATEGORY_MAP[category];
  }

  // 2. Query dynamic SQLite DB authorities table
  try {
    const allAuthorities = query('SELECT * FROM authorities WHERE active = 1');
    const catLower = category.toLowerCase();
    for (const auth of allAuthorities) {
      const assigned = jsonOrNull(auth.assigned_categories) || [];
      if (assigned.some((c) => String(c).toLowerCase() === catLower || catLower.includes(String(c).toLowerCase()))) {
        return { code: auth.code, name: auth.name };
      }
    }
    // Partial search on domain
    const match = allAuthorities.find(
      (a) => a.domain.toLowerCase().includes(catLower) || a.description?.toLowerCase().includes(catLower),
    );
    if (match) {
      return { code: match.code, name: match.name };
    }
  } catch {
    // Fallback if DB not ready
  }

  return { code: 'GHMC', name: 'GHMC Civic Administration' };
}

export const LOCALITY_PLANNER_MAP = {
  // West Corridor (IT & Residential)
  'HITEC City / Madhapur': { id: 'P101', name: 'Planner Ananya Rao' },
  'Gachibowli': { id: 'P102', name: 'Planner Vikram Sharma' },
  'Kondapur': { id: 'P112', name: 'Planner Harini S' },
  'Kukatpally': { id: 'P103', name: 'Planner Priya Reddy' },
  'KPHB Colony': { id: 'P103', name: 'Planner Priya Reddy' },
  'Miyapur': { id: 'P107', name: 'Planner Kavita Nair' },
  'Nizampet': { id: 'P113', name: 'Planner Sandeep V' },
  'Chandanagar': { id: 'P107', name: 'Planner Kavita Nair' },
  'Hafeezpet': { id: 'P112', name: 'Planner Harini S' },
  'Financial District / Nanakramguda': { id: 'P102', name: 'Planner Vikram Sharma' },
  'Raidurg': { id: 'P101', name: 'Planner Ananya Rao' },
  'Manikonda': { id: 'P114', name: 'Planner Ritu Sen' },
  'Jubilee Hills': { id: 'P115', name: 'Planner Aditya Varma' },
  'Banjara Hills': { id: 'P115', name: 'Planner Aditya Varma' },
  'Kokapet': { id: 'P102', name: 'Planner Vikram Sharma' },
  'Tellapur': { id: 'P102', name: 'Planner Vikram Sharma' },
  'Lingampally': { id: 'P107', name: 'Planner Kavita Nair' },
  'Bachupally': { id: 'P113', name: 'Planner Sandeep V' },
  'Pragathi Nagar': { id: 'P103', name: 'Planner Priya Reddy' },

  // Central Corridor
  'Begumpet': { id: 'P104', name: 'Planner Rajesh Kumar' },
  'Somajiguda': { id: 'P104', name: 'Planner Rajesh Kumar' },
  'Panjagutta': { id: 'P104', name: 'Planner Rajesh Kumar' },
  'Ameerpet': { id: 'P116', name: 'Planner Divya Teja' },
  'Khairatabad': { id: 'P116', name: 'Planner Divya Teja' },
  'Lakdikapul': { id: 'P116', name: 'Planner Divya Teja' },
  'Abids / Koti': { id: 'P117', name: 'Planner Arvind Swamy' },
  'Himayatnagar': { id: 'P117', name: 'Planner Arvind Swamy' },
  'Narayanguda': { id: 'P117', name: 'Planner Arvind Swamy' },
  'Domalguda': { id: 'P117', name: 'Planner Arvind Swamy' },
  'Basheerbagh': { id: 'P117', name: 'Planner Arvind Swamy' },
  'Nampally': { id: 'P116', name: 'Planner Divya Teja' },
  'SR Nagar': { id: 'P116', name: 'Planner Divya Teja' },
  'Sanathnagar': { id: 'P104', name: 'Planner Rajesh Kumar' },

  // North Corridor (Secunderabad & Northern Suburbs)
  'Secunderabad': { id: 'P105', name: 'Planner Sneha Verma' },
  'Marredpally': { id: 'P105', name: 'Planner Sneha Verma' },
  'Malkajgiri': { id: 'P118', name: 'Planner Alok Nath' },
  'Alwal': { id: 'P118', name: 'Planner Alok Nath' },
  'Bowenpally': { id: 'P105', name: 'Planner Sneha Verma' },
  'Trimulgherry': { id: 'P105', name: 'Planner Sneha Verma' },
  'Sainikpuri': { id: 'P118', name: 'Planner Alok Nath' },
  'Bolarum': { id: 'P118', name: 'Planner Alok Nath' },
  'ECIL': { id: 'P119', name: 'Planner Karthik M' },
  'Kompally': { id: 'P113', name: 'Planner Sandeep V' },
  'Medchal': { id: 'P113', name: 'Planner Sandeep V' },

  // South Corridor (Old City & Southern Corridors)
  'Charminar': { id: 'P106', name: 'Planner Mohammed Ali' },
  'Falaknuma': { id: 'P106', name: 'Planner Mohammed Ali' },
  'Bahadurpura': { id: 'P106', name: 'Planner Mohammed Ali' },
  'Chandrayangutta': { id: 'P120', name: 'Planner Farooq Ahmed' },
  'Santosh Nagar': { id: 'P120', name: 'Planner Farooq Ahmed' },
  'Malakpet': { id: 'P120', name: 'Planner Farooq Ahmed' },
  'Mehdipatnam': { id: 'P121', name: 'Planner Asif Qureshi' },
  'Tolichowki': { id: 'P121', name: 'Planner Asif Qureshi' },
  'Attapur': { id: 'P121', name: 'Planner Asif Qureshi' },
  'Rajendranagar': { id: 'P121', name: 'Planner Asif Qureshi' },
  'Shamshabad': { id: 'P122', name: 'Planner Srikanth P' },
  'Amberpet': { id: 'P110', name: 'Planner Rahul Mehta' },

  // East Corridor (Uppal, LB Nagar, Peripheral East)
  'Uppal': { id: 'P108', name: 'Planner Suresh Babu' },
  'LB Nagar': { id: 'P109', name: 'Planner Deepa K' },
  'Dilsukhnagar': { id: 'P111', name: 'Planner Venkat R' },
  'Tarnaka': { id: 'P110', name: 'Planner Rahul Mehta' },
  'Kothapet': { id: 'P111', name: 'Planner Venkat R' },
  'Nagole': { id: 'P108', name: 'Planner Suresh Babu' },
  'Hayathnagar': { id: 'P109', name: 'Planner Deepa K' },
  'Vanasthalipuram': { id: 'P109', name: 'Planner Deepa K' },
  'Habsiguda': { id: 'P110', name: 'Planner Rahul Mehta' },
  'Nacharam': { id: 'P119', name: 'Planner Karthik M' },
  'Boduppal': { id: 'P108', name: 'Planner Suresh Babu' },
  'Peerzadiguda': { id: 'P108', name: 'Planner Suresh Babu' },
  'Ghatkesar': { id: 'P108', name: 'Planner Suresh Babu' },
};

export function getSLAConfig(priorityScore) {
  if (priorityScore >= 75) return { hours: 24, levelName: 'Critical' };
  if (priorityScore >= 60) return { hours: 48, levelName: 'High' };
  if (priorityScore >= 40) return { hours: 72, levelName: 'Medium' };
  return { hours: 120, levelName: 'Low' };
}

/**
 * Deterministic clustering: open/in-review complaints are grouped by
 * (locality, AI category). The representative complaint (highest priority
 * score) determines the problem's dimension scores.
 */
export function aggregateProblems({ localityId, limit = 3, openOnly = true }) {
  const where = ['locality_id = $localityId'];
  if (openOnly) where.push("status IN ('open','in_review')");
  const rows = query(
    `SELECT * FROM citizen_complaints WHERE ${where.join(' AND ')} ORDER BY priority_score DESC, created_at DESC`,
    { $localityId: localityId },
  );

  const groups = new Map();
  for (const row of rows) {
    const ai = jsonOrNull(row.ai_classification) || {};
    const category = row.category || ai.category || 'Infrastructure';
    const key = `${row.locality_id}|${category}`;
    if (!groups.has(key)) {
      groups.set(key, { key, locality_id: row.locality_id, category, items: [] });
    }
    groups.get(key).items.push(row);
  }

  const problems = [];
  for (const [, group] of groups) {
    const rep = group.items[0];
    const dims = (jsonOrNull(rep.ai_classification) || {}).priority_dimensions || {};
    const score = rep.priority_score ?? round(
      ((dims.severity || 0) * 0.3 +
        (dims.population_impact || 0) * 0.25 +
        (dims.environmental_impact || 0) * 0.2 +
        (dims.urgency || 0) * 0.15 +
        (dims.feasibility || 0) * 0.1), 1);
    problems.push({
      id: `prb-${Buffer.from(group.key).toString('base64url').slice(0, 16)}`,
      category: group.category,
      locality_id: rep.locality_id,
      complaint_count: group.items.length,
      representative_complaint: {
        id: rep.id,
        tracking_id: rep.tracking_id,
        title: rep.title,
        description: rep.description,
        severity_input: rep.severity_input,
      },
      dimensions: dims,
      priority_score: score,
      level: priorityLevel(score),
      linked_tracking_ids: group.items.map((i) => i.tracking_id),
      reason: buildReason(group.items.length, rep, dims, score),
    });
  }

  problems.sort((a, b) => b.priority_score - a.priority_score);
  return problems.slice(0, limit).map((p, i) => ({ ...p, rank: i + 1 }));
}

function buildReason(count, rep, dims, score) {
  const locality = get('SELECT name FROM localities WHERE id = ?', [rep.locality_id]);
  return (
    `${count} open citizen complaint${count > 1 ? 's' : ''} in ${locality ? locality.name : rep.locality_id} under “${rep.category}”. ` +
    `Representative: “${rep.title}” (citizen severity ${rep.severity_input}/10). ` +
    `Priority score ${score} = ${dims.severity || 0} (severity) ×0.30 + ${dims.population_impact || 0} (population) ×0.25 + ` +
    `${dims.environmental_impact || 0} (environment) ×0.20 + ${dims.urgency || 0} (urgency) ×0.15 + ${dims.feasibility || 0} (feasibility) ×0.10.`
  );
}

export function topProblemsAllLocalities({ limit = 3 }) {
  const localities = query('SELECT id FROM localities');
  const all = localities.flatMap((l) => aggregateProblems({ localityId: l.id, limit: 10 }));
  all.sort((a, b) => b.priority_score - a.priority_score);
  return all.slice(0, limit).map((p, i) => ({ ...p, rank: i + 1 }));
}

/**
 * Comprehensive City-Wide Urban Problem Intelligence Engine.
 * Aggregates all citizen complaints into Problem Clusters across Hyderabad.
 */
export function getCityWideIntelligence(params = {}) {
  const {
    filterArea = '',
    filterCategory = '',
    filterPriority = '',
    filterStatus = '',
    search = '',
    assignedPlannerId = '',
  } = params;

  const localities = query('SELECT * FROM localities ORDER BY name');
  const localityMap = new Map(localities.map((l) => [l.id, l]));
  const localityNameMap = new Map(localities.map((l) => [l.name, l]));

  const allComplaints = query('SELECT * FROM citizen_complaints ORDER BY priority_score DESC, created_at DESC');

  // Group complaints by (locality_id, category)
  const groupMap = new Map();
  for (const c of allComplaints) {
    const ai = jsonOrNull(c.ai_classification) || {};
    const category = c.category || ai.category || 'Infrastructure';
    const locId = c.locality_id || 'osm-gachibowli';
    const key = `${locId}|${category}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        locality_id: locId,
        category,
        complaints: [],
      });
    }
    groupMap.get(key).complaints.push(c);
  }

  // Build cluster objects
  const clusters = [];
  const now = new Date();

  for (const [key, group] of groupMap) {
    const complaints = group.complaints;
    const rep = complaints[0]; // Representative (highest priority)
    const loc = localityMap.get(group.locality_id) || { id: group.locality_id, name: group.locality_id, lat: 17.385, lng: 78.4867 };
    const locName = loc.name || group.locality_id;

    const clusterId = `cluster-${Buffer.from(key).toString('base64url').slice(0, 16)}`;

    // Read stored cluster state if available
    const stored = get('SELECT * FROM problem_clusters WHERE cluster_id = ?', [clusterId]);

    const maxScore = complaints.reduce((max, cur) => Math.max(max, cur.priority_score || 0), rep.priority_score || 50);
    const score = round(maxScore, 1);
    const sla = getSLAConfig(score);

    // Compute dates
    const timestamps = complaints.map((c) => new Date(c.created_at).getTime()).filter((t) => !isNaN(t));
    const firstReportedAt = timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : rep.created_at;
    const latestReportedAt = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : rep.created_at;

    const firstDate = new Date(firstReportedAt);
    const elapsedHours = Math.max(0, Math.round((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60)));
    const remainingHours = Math.max(0, sla.hours - elapsedHours);
    const isOverdue = elapsedHours > sla.hours;

    // Determine status
    let status = stored?.status || 'new';
    if (status === 'new' && isOverdue) {
      status = 'overdue';
    }

    const authorityInfo = resolveAuthorityForCategory(group.category);
    const plannerInfo = LOCALITY_PLANNER_MAP[locName] || { id: 'P100', name: 'Planner Office' };

    const photosCount = complaints.filter((c) => c.image_path).length;
    const videosCount = complaints.filter((c) => c.video_path).length;
    const isRecurring = complaints.length >= 3 || (timestamps.length >= 2 && Math.max(...timestamps) - Math.min(...timestamps) > 86400000 * 3);

    // Coordinates: use representative complaint lat/lng if available, else locality lat/lng
    const lat = rep.lat && !isNaN(rep.lat) ? Number(rep.lat) : loc.lat;
    const lng = rep.lng && !isNaN(rep.lng) ? Number(rep.lng) : loc.lng;

    const title = `${group.category} Cluster — ${locName}`;

    const repCls = jsonOrNull(rep.ai_classification) || {};
    const clusterDims = repCls.priority_dimensions || {
      severity: rep.severity_input ? rep.severity_input * 10 : 70,
      population_impact: Math.min(100, 40 + complaints.length * 10),
      environmental_impact: /pollution|waste|air|drain/i.test(group.category) ? 80 : 45,
      urgency: isOverdue ? 90 : 60,
      feasibility: 65,
    };
    const xaiPriority = explainPriority(clusterDims, score);

    clusters.push({
      cluster_id: clusterId,
      title,
      category: group.category,
      locality_id: group.locality_id,
      locality_name: locName,
      lat,
      lng,
      report_count: complaints.length,
      media_summary: { photos: photosCount, videos: videosCount },
      priority_score: score,
      priority_level: priorityLevel(score),
      priority_dimensions: clusterDims,
      xai_priority: xaiPriority,
      sla_hours: sla.hours,
      sla_level: sla.levelName,
      elapsed_hours: elapsedHours,
      remaining_hours: remainingHours,
      is_overdue: isOverdue,
      status: status,
      acknowledged_at: stored?.acknowledged_at || null,
      acknowledged_by: stored?.acknowledged_by || null,
      assigned_planner_id: stored?.assigned_planner_id || plannerInfo.id,
      assigned_planner_name: stored?.assigned_planner_name || plannerInfo.name,
      authority_code: stored?.authority_code || authorityInfo.code,
      authority_name: stored?.authority_name || authorityInfo.name,
      first_reported_at: firstReportedAt,
      latest_reported_at: latestReportedAt,
      is_recurring: isRecurring,
      representative_complaint: {
        id: rep.id,
        tracking_id: rep.tracking_id,
        title: rep.title,
        description: rep.description,
        area: rep.area,
        image_path: rep.image_path,
        video_path: rep.video_path,
        severity_input: rep.severity_input,
      },
      complaints: complaints.map((c) => ({
        id: c.id,
        tracking_id: c.tracking_id,
        title: c.title,
        description: c.description,
        area: c.area,
        lat: c.lat,
        lng: c.lng,
        severity_input: c.severity_input,
        priority_score: c.priority_score,
        image_path: c.image_path,
        video_path: c.video_path,
        created_at: c.created_at,
        status: c.status,
      })),
    });
  }

  // Sort by priority_score DESC
  clusters.sort((a, b) => b.priority_score - a.priority_score);

  // Compute City-Wide Summary Statistics
  const totalActiveProblems = clusters.filter((c) => c.status !== 'resolved').length;
  const totalCitizenReports = allComplaints.length;
  const criticalProblems = clusters.filter((c) => c.priority_score >= 75 && c.status !== 'resolved').length;
  const highPriorityProblems = clusters.filter((c) => c.priority_score >= 60 && c.priority_score < 75 && c.status !== 'resolved').length;
  const unresolvedProblems = clusters.filter((c) => c.status !== 'resolved').length;
  const overdueProblems = clusters.filter((c) => c.is_overdue && c.status !== 'resolved').length;
  const inProgressProblems = clusters.filter((c) => ['in_progress', 'acknowledged', 'under_assessment'].includes(c.status)).length;

  const affectedLocalitySet = new Set(clusters.filter((c) => c.status !== 'resolved').map((c) => c.locality_id));
  const affectedAreasCount = affectedLocalitySet.size;

  // Problems by Area Summary Matrix
  const areaSummaryMap = new Map();
  for (const loc of localities) {
    areaSummaryMap.set(loc.id, {
      locality_id: loc.id,
      locality_name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      population: loc.population,
      active_problems: 0,
      total_reports: 0,
      critical: 0,
      unresolved: 0,
      overdue: 0,
      assigned_planner: LOCALITY_PLANNER_MAP[loc.name]?.name || 'Planner Office',
    });
  }

  for (const c of clusters) {
    const entry = areaSummaryMap.get(c.locality_id);
    if (entry) {
      entry.total_reports += c.report_count;
      if (c.status !== 'resolved') {
        entry.active_problems += 1;
        entry.unresolved += 1;
        if (c.priority_score >= 75) entry.critical += 1;
        if (c.is_overdue) entry.overdue += 1;
      }
    }
  }

  const problemsByArea = Array.from(areaSummaryMap.values()).sort((a, b) => b.active_problems - a.active_problems);

  // Hotspots Ranking
  const hotspots = problemsByArea
    .filter((a) => a.active_problems > 0)
    .slice(0, 5)
    .map((a, i) => ({
      rank: i + 1,
      locality_id: a.locality_id,
      locality_name: a.locality_name,
      active_problems: a.active_problems,
      critical_problems: a.critical,
      total_reports: a.total_reports,
    }));

  // Filtering
  let filtered = clusters;
  if (filterArea) {
    filtered = filtered.filter((c) => c.locality_id === filterArea || c.locality_name.toLowerCase() === filterArea.toLowerCase());
  }
  if (filterCategory) {
    filtered = filtered.filter((c) => c.category === filterCategory);
  }
  if (filterPriority) {
    if (filterPriority === 'Critical') filtered = filtered.filter((c) => c.priority_score >= 75);
    else if (filterPriority === 'High') filtered = filtered.filter((c) => c.priority_score >= 60 && c.priority_score < 75);
    else if (filterPriority === 'Medium') filtered = filtered.filter((c) => c.priority_score >= 40 && c.priority_score < 60);
    else if (filterPriority === 'Low') filtered = filtered.filter((c) => c.priority_score < 40);
  }
  if (filterStatus) {
    filtered = filtered.filter((c) => c.status === filterStatus);
  }
  if (assignedPlannerId) {
    filtered = filtered.filter((c) => c.assigned_planner_id === assignedPlannerId);
  }
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.locality_name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.authority_name.toLowerCase().includes(q) ||
        c.representative_complaint.description.toLowerCase().includes(q),
    );
  }

  return {
    stats: {
      total_active_problems: totalActiveProblems,
      total_citizen_reports: totalCitizenReports,
      critical_problems: criticalProblems,
      high_priority_problems: highPriorityProblems,
      unresolved_problems: unresolvedProblems,
      overdue_problems: overdueProblems,
      in_progress_problems: inProgressProblems,
      affected_areas_count: affectedAreasCount,
    },
    hotspots,
    problems_by_area: problemsByArea,
    clusters: filtered,
    total_clusters_count: clusters.length,
    filtered_clusters_count: filtered.length,
    localities,
  };
}

export function acknowledgeProblemCluster(clusterId, plannerId) {
  const at = nowIso();
  run(
    `INSERT INTO problem_clusters (cluster_id, locality_id, category, title, status, acknowledged_at, acknowledged_by, updated_at)
     VALUES ($clusterId, 'unknown', 'General', 'Cluster', 'acknowledged', $at, $plannerId, $at)
     ON CONFLICT(cluster_id) DO UPDATE SET status='acknowledged', acknowledged_at=$at, acknowledged_by=$plannerId, updated_at=$at`,
    {
      $clusterId: clusterId,
      $at: at,
      $plannerId: plannerId || null,
    },
  );
  return get('SELECT * FROM problem_clusters WHERE cluster_id = ?', [clusterId]);
}

export function updateClusterStatus(clusterId, status, plannerId) {
  const at = nowIso();
  run(
    `INSERT INTO problem_clusters (cluster_id, locality_id, category, title, status, updated_at)
     VALUES ($clusterId, 'unknown', 'General', 'Cluster', $status, $at)
     ON CONFLICT(cluster_id) DO UPDATE SET status=$status, updated_at=$at`,
    {
      $clusterId: clusterId,
      $status: status,
      $at: at,
    },
  );
  return get('SELECT * FROM problem_clusters WHERE cluster_id = ?', [clusterId]);
}