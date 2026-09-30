/**
 * TEST-ONLY FakeAIProvider.
 *
 * This provider is used ONLY by the automated test-suite via dependency
 * injection (di.ai). It is a deterministic test double: it produces valid
 * JSON matching each schema while deriving its answers from the ACTUAL data
 * embedded in the prompt text (metric values, locality names, authority
 * codes). It is NOT used by the running application and is NOT a substitute
 * for the real LLM in Demo Mode.
 */
function grabNumber(text, pattern, fallback = 0) {
  const m = String(text || '').match(pattern);
  if (m && m[1] !== undefined && Number.isFinite(Number(m[1]))) return Number(m[1]);
  return fallback;
}

function grabAll(text, pattern) {
  const out = [];
  const re = new RegExp(pattern, 'gi');
  let m;
  while ((m = re.exec(String(text || ''))) !== null) {
    out.push(m[1] || m[0]);
  }
  return out;
}

function lines(text) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export class FakeAIProvider {
  constructor() {
    this.isConfigured = true;
    this.model = 'fake-test-double';
    this.temperature = 0.7;
  }

  async generateStructured({ system, user, schema, image, metadata }) {
    const agent = metadata?.agent || 'unknown';
    const data = this._answer(agent, user || '');
    return { data, raw: JSON.stringify(data), attempts: 1, requestId: 'test_request', fake: true };
  }

  async generateText({ system, user, metadata }) {
    return { text: `[${metadata?.agent || 'unknown'}] summary`, requestId: 'test_request', usage: null };
  }

  _answer(agent, text) {
    switch (agent) {
      case 'classify':
        return this._classify(text);
      case 'coordinator':
        return this._coordinator(text);
      case 'traffic':
        return this._traffic(text);
      case 'pollution':
        return this._pollution(text);
      case 'energy':
        return this._energy(text);
      case 'fusion':
        return {
          summary: 'Specialist analyses point to a shared root issue with cross-domain trade-offs.',
          common_findings: ['The retrieved evidence is internally consistent.', 'A single dominant driver is identifiable from the data.'],
          conflicting_findings: [],
          cross_domain_impacts: ['Interventions aimed at one domain may shift load to another.'],
          tradeoffs: ['Quick operational fixes trade long-term structural improvements for speed.'],
          dependencies: ['Cost estimation depends on confirmed material rates.'],
          uncertainties: ['Demo provider values carry estimation error.'],
          missing_information: [],
          verdict: 'Context-specific intervention warranted; trade-offs manageable with constraints.',
        };
      case 'recommend':
        return this._recommend(text);
      case 'clarify':
        return this._clarify(text);
      case 'authorityRequest':
        return this._authorityRequest(text);
      case 'authorityResponse':
        return {
          acknowledgement: 'The authority acknowledged the request.',
          status_update: 'No change in status was reported.',
          provides_clarification: /additional infrastructure information/i.test(text),
          new_information_summary: 'The authority confirmed that supplementary technical data will be considered for the recommendation.',
          constraints_or_conditions: ['Further assessment is advised before finalising loading thresholds.'],
          requested_changes: [],
          interpretation_notes: 'The clarification materially affects how confident we can be in the energy recommendation.',
        };
      case 'refine':
        return {
          analysis_of_response: 'The authority response tightened the available loading context.',
          adjustments: ['Loading thresholds now reflect the authority clarification.'],
          adjusted_options: this._recommend(text).options,
          revised_recommendation: 'Refined option set after incorporating authority input.',
          confidence: 0.7,
          notes: 'Options were adjusted in response to the authority clarification.',
        };
      case 'memorySummary':
        return {
          summary: 'Case stored with the chosen intervention and observed outcome.',
          outcome: 'Intervention tracked and KPI recorded.',
          recommendation: (text.match(/RECOMMENDATION:\s*([^\n]+)/) || [])[1] || 'urban intervention',
          planner_decision: (text.match(/PLANNER DECISION:\s*([^\n]+)/) || [])[1] || 'approved',
          authority_response: (text.match(/AUTHORITY RESPONSE:\s*([^\n]+)/) || [])[1] || 'none',
          implementation_result: (text.match(/IMPLEMENTATION RESULT:\s*([^\n]+)/) || [])[1] || 'tracked',
          kpi_summary: 'predicted vs observed recorded',
          feedback_note: 'planner feedback stored',
          tags: grabAll(text, /LOCALITY:\s*([^\n]+)/),
        };
      default:
        return { summary: 'structured result', key_findings: [], tradeoffs: [], missing_information: [], confidence: 0.5 };
    }
  }

  _classify(text) {
    // Classify from the citizen complaint text only, never from prompt
    // boilerplate (e.g. the allowed-categories list containing "Water Supply").
    const raw = String(text || '');
    const complaintText = (raw.match(/CITIZEN COMPLAINT TEXT:([\s\S]*?)(?=\n(?:CITIZEN-SELECTED LOCATION|KNOWN LOCALITIES|ALLOWED CATEGORIES|EVIDENCE|INPUT))/) || [])[1] || raw;
    const lower = complaintText.toLowerCase();
    let category = 'Infrastructure';
    if (/gridlock|congestion|traffic|signal|lane|road|junction|vehicle/.test(lower)) category = 'Road Traffic';
    if (/power|electricity|transformer|feeder|outage|fuse|energy|trip|supply/.test(lower)) category = 'Energy / Power Supply';
    if (/air|dust|smoke|smog|pollution|emission|aqi/.test(lower)) category = 'Air Pollution';
    if (/waste|garbage|bin|overflow/.test(lower)) category = 'Waste Management';
    if (/bus|metro|commut/.test(lower)) category = 'Public Transport';
    if (/drain|waterlog|leak|water/.test(lower)) category = 'Drainage';
    const severity = grabNumber(text, /severity[_ ]*input[^\d]*(\d+)/i, 6);
    const localityMatch = text.match(/CITIZEN-SELECTED LOCATION:\s*([^\n]+)/) || text.match(/LOCATION:\s*([^\n]+)/);
    return {
      category,
      domain: category.split(' ')[0].toLowerCase(),
      severity,
      locality: localityMatch ? localityMatch[1].trim() : 'HITEC City / Madhapur',
      confidence: 0.82,
      summary: `Classified as ${category} with severity ${severity}.`,
      key_indicators: lines(text).slice(0, 2),
      visible_conditions: imageEl(text),
      missing_information: [],
      likely_assistance: 'planner review',
      priority_dimensions: {
        severity: Math.min(100, severity * 10),
        population_impact: 62,
        environmental_impact: 45,
        urgency: 55,
        feasibility: 72,
      },
    };
  }

  _coordinator(text) {
    const lower = String(text).toLowerCase();
    const header = (label) => {
      const m = text.match(new RegExp(`${label}:\\\\n([^\\\\n]+)`)) || text.match(new RegExp(`${label}: ([^\\n]+)`));
      return m ? m[1].trim() : '';
    };
    // Detect the domain from the problem statement (title + description), not from
    // the noisy related-complaints JSON embedded elsewhere in the prompt.
    const title = header('PROBLEM') || '';
    const problemBlock = (text.match(/PROBLEM DESCRIPTION:([\s\S]*?)(?=\n\n(?:REMEMBERED|RELATED|PRIORITY))/) || [])[1] || '';
    const categoryMatch = text.match(/CATEGORY:\s*([^\n]+)/i);
    const category = categoryMatch ? categoryMatch[1].trim() : '';
    const probe = `${title} ${problemBlock} ${category}`.toLowerCase();

    const energyRelated = /electricity|power|transformer|feeder|energy|outage|blackout|voltage|street.?light|lamp/.test(probe);
    const trafficRelated = !energyRelated && /traffic|congestion|signal|gridlock|transport|pothole|road.?damage|vehicle\s+queue|bottleneck/.test(probe);
    const pollutionOnly = /pollution|air.?quality|aqi|smog|smoke|dust|emission|pm2\.5/.test(probe) && !trafficRelated && !energyRelated;
    const wasteRelated = /waste|garbage|bin|overflow|sanitation|litter|dump/.test(probe) && !trafficRelated && !energyRelated;
    const waterRelated = /water.?supply|pipeline|water.?leak|no.?water|sewerage|drainage|waterlog|flood|water.?shortage/.test(probe) && !trafficRelated && !energyRelated;
    const transitRelated = /\bbus\b|metro|tsrtc|commut|public.?transport|bus.?stop/.test(probe) && !trafficRelated && !energyRelated;

    // Domains that have no specialist agent yet
    if (wasteRelated) {
      return {
        understanding: title || 'Waste management / sanitation problem detected.',
        required_agents: [],
        clarification_required: false,
        clarification_reason: '',
        missing_information: ['waste collection schedule', 'bin capacity data', 'GHMC-SWM route plan'],
        new_specialist_required: true,
        new_specialist_reason: 'Waste management has no dedicated specialist agent. A Solid Waste Management Agent (GHMC-SWM) should be added to the roster.',
        notes: 'Provisional recommendation will be generated from available evidence; dedicated waste specialist needed for higher accuracy.',
      };
    }

    if (waterRelated) {
      return {
        understanding: title || 'Water supply or drainage problem detected.',
        required_agents: [],
        clarification_required: true,
        clarification_reason: 'Water/drainage analysis requires HMWSSB infrastructure data not in the current knowledge base.',
        missing_information: ['pipeline pressure data', 'HMWSSB maintenance schedule', 'sewerage network capacity'],
        new_specialist_required: true,
        new_specialist_reason: 'Water supply and drainage has no specialist agent. An HMWSSB Water/Drainage Agent should be added.',
        notes: 'Clarification from HMWSSB required before a responsible recommendation.',
      };
    }

    const agents = [];
    if (energyRelated) {
      agents.push({
        agent: 'energy',
        objective: 'Assess demand, capacity and infrastructure strain on electricity distribution.',
        needs_information: ['energy provider records'],
      });
    } else if (trafficRelated) {
      agents.push({
        agent: 'traffic',
        objective: 'Assess congestion, capacity, intersections and mobility implications.',
        needs_information: ['OSM road network', 'traffic metrics'],
      });
      agents.push({
        agent: 'pollution',
        objective: 'Assess air quality impacts commonly associated with congested corridors.',
        needs_information: ['CPCB AQI readings'],
      });
    } else if (pollutionOnly) {
      agents.push({
        agent: 'pollution',
        objective: 'Assess air quality conditions, emission sources and health impacts.',
        needs_information: ['CPCB AQI readings'],
      });
    } else if (transitRelated) {
      agents.push({
        agent: 'traffic',
        objective: 'Assess road network conditions affecting bus routes and transit connectivity.',
        needs_information: ['OSM road network', 'traffic metrics'],
      });
    }
    if (agents.length === 0) {
      // Generic fallback for any novel problem type: run traffic as infrastructure baseline
      agents.push({ agent: 'traffic', objective: 'Baseline infrastructure and transport conditions assessment.', needs_information: [] });
    }

    const clarify = energyRelated && /Gachibowli/i.test(text);
    const newDomain = transitRelated && !trafficRelated;
    return {
      understanding: title || 'Problem understood from planner context.',
      required_agents: agents,
      clarification_required: clarify,
      clarification_reason: clarify
        ? 'Energy evidence shows loading near the capacity limit but distribution planning data needed for a responsible recommendation.'
        : '',
      missing_information: clarify ? ['planned feeder load transfers', 'maintenance schedule'] : [],
      new_specialist_required: newDomain,
      new_specialist_reason: newDomain ? 'Public transport analysis would benefit from a dedicated TSRTC/Transit Agent not yet in the roster.' : '',
      notes: 'Agent set selected dynamically based on domain detection.',
    };
  }

  _traffic(text) {
    const speed = grabNumber(text, /avg speed (\d+(?:\.\d+)?)/, grabNumber(text, /avg_speed_kmh[^\d]*(\d+(?:\.\d+)?)/, 15));
    const volume = grabNumber(text, /peak volume (\d+)/, grabNumber(text, /peak_volume_vph[^\d]*(\d+)/, 4000));
    const worstJunction = (text.match(/worst_intersection[^\n]*"name":\s*"([^"]+)"/) || text.match(/([^\n:]+): [^,]*, \d+ approaches/) || text.match(/Inorbit Mall Junction/))[1] || 'Inorbit Mall Junction';
    return {
      summary: `Traffic analysis: average network speed ${speed} km/h with peak volume ${volume} vph.`,
      conclusion: 'Congestion is concentrated at the junction and primary corridor levels; capacity-led intervention candidates are identified.',
      key_findings: [
        `Average network speed reduced to ${speed} km/h during peak hours.`,
        `A dominant bottleneck is evident at ${worstJunction}.`,
        'Vehicle-to-capacity ratios exceed 1.0 on the principal corridor.',
      ],
      evidence_refs: ['osm-roads', 'osm-intersections', 'osm-network'],
      tradeoffs: ['Throughput improvements may encourage mode shift from public transport.'],
      missing_information: ['Recent on-street vehicle counts beyond the demo dataset.'],
      risks: ['Construction-phase traffic disruption.'],
      confidence: 0.75,
      interpretation: { avg_speed_kmh: speed, peak_volume_vph: volume, bottleneck: worstJunction },
    };
  }

  _pollution(text) {
    const aqi = grabNumber(text, /aqi[^\d]*(\d+)/i, 160);
    const pm25 = grabNumber(text, /pm2\.5[^\d]*(\d+)/i, grabNumber(text, /pm25[^\d]*(\d+)/, 60));
    return {
      summary: `Air quality analysis: AQI ${aqi}, PM2.5 ${pm25} ug/m3 at the locality station.`,
      conclusion: 'Air quality is elevated above satisfactory thresholds; transport emissions are a plausible contributor along the congested corridor.',
      key_findings: [`Station AQI ${aqi} falls in the Moderate/Poor band.`, `PM2.5 ${pm25} ug/m3 exceeds the national annual standard.`],
      evidence_refs: ['cpcb-aqi'],
      tradeoffs: ['Clean air interventions may require separate jurisdiction - TSPCB.'],
      missing_information: ['Source apportionment study for the exact corridor.'],
      risks: ['Short-term construction emissions during interventions.'],
      confidence: 0.72,
      interpretation: { aqi, pm25 },
    };
  }

  _energy(text) {
    const peak = grabNumber(text, /peak (\d+(?:\.\d+)?) MW/, grabNumber(text, /peak_demand_mw[^\d]*(\d+(?:\.\d+)?)/, 48.5));
    const capacity = grabNumber(text, /capacity (\d+(?:\.\d+)?) MW/, grabNumber(text, /installed_capacity_mw[^\d]*(\d+(?:\.\d+)?)/, 52));
    const util = capacity > 0 ? (peak / capacity) * 100 : 0;
    const inter = grabNumber(text, /outages (\d+(?:\.\d+)?) h\/30d/, grabNumber(text, /interruption_hours_30d[^\d]*(\d+(?:\.\d+)?)/, 0));
    return {
      summary: `Energy analysis: peak demand ${peak} MW against ${capacity} MW installed capacity (${util.toFixed(1)}% utilisation), ${inter} interruption hours in the window.`,
      conclusion:
        util >= 100
          ? 'Loading is at or above installed capacity; the distributor must clarify headroom and planned works before a responsible intervention is confirmed.'
          : 'Loading is within installed capacity but elevated; condition warrants monitoring and demand-side measures.',
      key_findings: [`Peak utilisation computed at ${util.toFixed(1)}%.`, `Recorded interruption hours: ${inter} in the 30 day window.`],
      evidence_refs: ['energy-feeder'],
      tradeoffs: ['Capacity upgrades are costly; demand-side measures are faster but lower impact.'],
      missing_information: util >= 100 ? ['planned load transfers', 'maintenance schedules'] : [],
      risks: ['Transformers loaded beyond capacity carry failure risk.'],
      confidence: 0.77,
      interpretation: { peak_demand_mw: peak, installed_capacity_mw: capacity, utilization_pct: util },
    };
  }

  _recommend(text) {
    const raw = String(text || '');
    const probMatch = raw.match(/PROBLEM:\s*([\s\S]*?)(?=\n\n[A-Z_ ]+:|\n\nTASK|\n\nAVAILABLE EVIDENCE|$)/i);
    const lower = (probMatch ? probMatch[1] : raw).toLowerCase();
    const opt = (name, desc, comps, target, impactScore = 72, feasScore = 68, timeline = 9) => ({
      name,
      description: desc || `${name} intervention generated for the diagnosed problem.`,
      components: comps,
      expected_impact: 'Reduces the dominant dimension severity within one implementation cycle.',
      impact_score: impactScore,
      feasibility_score: feasScore,
      timeline_months: timeline,
      environmental_effect: 'Positive but minor; construction phase has transient dust/noise.',
      energy_effect: 'Negligible for operation; modest during construction.',
      population_benefit: 'Directly benefits the affected population in the locality.',
      risks: ['Execution delays', 'Dependency on authority approvals'],
      dependencies: [target],
      why_generated: 'Addresses the leading evidence-based driver identified by the specialists.',
      target_authority: target,
    });

    // Domain-aware option sets
    if (/waste|garbage|sanitation|solid.?waste/.test(lower)) {
      return {
        context_diagnosis: 'Waste management deficiency: insufficient collection frequency and overflow at community bins causing sanitation risk.',
        options: [
          opt('Increased waste collection frequency', 'Deploy additional collection vehicles on high-density routes to reduce bin overflow and street litter.', ['waste_collection_vehicle', 'bin_replacement', 'gps_tracker'], 'GHMC-SWM', 80, 75, 3),
          opt('Community micro-composting centres', 'Install decentralised composting units at ward level to reduce organic waste volume at source.', ['compost_bin_large', 'shed_structure', 'awareness_campaign'], 'GHMC-SWM', 65, 60, 6),
          opt('Smart bin monitoring system', 'Deploy IoT-enabled bin sensors and dynamic routing for collection vehicles.', ['iot_sensor_bin', 'dashboard_software', 'vehicle_gps'], 'GHMC-SWM', 70, 55, 12),
        ],
      };
    }

    if (/water.?supply|pipeline|water.?shortage|no.?water|hmwssb/.test(lower)) {
      return {
        context_diagnosis: 'Water supply disruption: pipeline pressure loss or supply schedule mismatch causing intermittent or no water availability.',
        options: [
          opt('Emergency pipeline pressure restoration', 'Identify and repair pipeline leaks; restore supply pressure to affected zones.', ['pipe_repair_kit', 'plumber_crew', 'pressure_gauge'], 'HMWSSB', 85, 70, 2),
          opt('Supplementary tanker supply', 'Deploy HMWSSB tanker trucks for immediate water access while permanent fix is carried out.', ['tanker_truck', 'water_storage_tank', 'distribution_pump'], 'HMWSSB', 70, 80, 1),
          opt('Pipeline network upgrade', 'Replace ageing distribution mains with modern HDPE pipes in the affected zone.', ['hdpe_pipe_100mm', 'trench_excavation', 'joint_coupling'], 'HMWSSB', 78, 55, 18),
        ],
      };
    }

    if (/street.?light|streetlight|lamp|illumination|dark.?road/.test(lower)) {
      return {
        context_diagnosis: 'Street lighting failure: multiple lights non-functional due to electrical faults or maintenance backlog, creating road safety hazard at night.',
        options: [
          opt('Emergency lamp replacement', 'Replace faulty LED lamps along the affected corridor on a priority basis.', ['led_lamp_40w', 'electrician_crew', 'control_panel_repair'], 'TSSPDCL', 80, 85, 1),
          opt('Feeder cable rehabilitation', 'Inspect and replace corroded feeder cables feeding the street lighting circuit.', ['armoured_cable', 'cable_trench', 'junction_box'], 'TSSPDCL', 75, 65, 3),
          opt('Solar street light installation', 'Install solar-powered LED street lights at high-risk dark spots for energy-independent illumination.', ['solar_street_light', 'battery_storage', 'foundation_pole'], 'GHMC', 70, 60, 6),
        ],
      };
    }

    if (/drainage|waterlog|flood|sewerage|storm.?water/.test(lower)) {
      return {
        context_diagnosis: 'Drainage system failure: blocked or insufficient storm drains causing waterlogging during rainfall, posing health and traffic risks.',
        options: [
          opt('Storm drain desilting and cleaning', 'Emergency desilting of blocked storm water drains in the locality to restore drainage capacity.', ['jetting_machine', 'labour_crew', 'disposal_vehicle'], 'GHMC', 85, 80, 1),
          opt('Drain capacity upgrade', 'Widen and reline critical storm drains with concrete to handle peak rainfall runoff.', ['rcc_drain_0.5m', 'excavation', 'cement_concrete'], 'GHMC', 78, 60, 9),
          opt('Percolation pit network', 'Install percolation pits at low-lying areas to absorb excess storm water.', ['percolation_pit', 'gravel_fill', 'geotextile'], 'GHMC', 65, 65, 6),
        ],
      };
    }

    if (/\bbus\b|metro|tsrtc|public.?transport|commut/.test(lower) && !/traffic|road/.test(lower)) {
      return {
        context_diagnosis: 'Public transport inadequacy: insufficient bus frequency or missing route coverage reducing mobility options for residents.',
        options: [
          opt('Route frequency enhancement', 'Increase bus frequency on high-demand routes during peak hours.', ['bus_deployment', 'route_scheduling', 'driver_crew'], 'TSRTC', 78, 70, 3),
          opt('New bus stop infrastructure', 'Install sheltered bus stops with passenger information displays at key demand points.', ['bus_shelter', 'route_board', 'foundation'], 'GHMC', 65, 75, 4),
          opt('Electric feeder bus service', 'Introduce short-range electric feeder buses connecting residential areas to metro/trunk routes.', ['electric_mini_bus', 'charging_station', 'depot_space'], 'TSRTC', 72, 55, 18),
        ],
      };
    }

    if (/pollution|air.?quality|aqi|smog|emission/.test(lower) && !/traffic/.test(lower)) {
      return {
        context_diagnosis: 'Air quality deterioration: pollutant levels exceeding CPCB standards, posing respiratory health risk to residents.',
        options: [
          opt('Industrial emission monitoring & enforcement', 'Deploy real-time emission monitoring at point sources and issue TSPCB compliance notices.', ['air_monitor_sensor', 'data_dashboard', 'enforcement_team'], 'TSPCB', 75, 65, 3),
          opt('Green buffer and tree planting', 'Plant roadside trees and establish green buffer strips to reduce particulate matter concentration.', ['tree_sapling', 'soil_preparation', 'irrigation_system'], 'GHMC', 60, 70, 12),
          opt('Dust suppression operations', 'Deploy water-spraying vehicles and install mist cannons at major dust hotspots.', ['water_sprinkler_truck', 'mist_cannon', 'dust_suppressant'], 'GHMC', 65, 80, 2),
        ],
      };
    }

    // Default: traffic-centric (existing known domains — traffic/energy/mixed)
    const isEnergy = /electricity|power|transformer|feeder|energy|outage/.test(lower);
    const authCode = isEnergy ? 'TSSPDCL' : (String(text).includes('HTP') ? 'HTP' : 'GHMC');
    return {
      context_diagnosis: 'Validated diagnosis using the fused specialist evidence.',
      options: [
        opt('Adaptive signal coordination', 'Optimise signal timing using adaptive control to reduce intersection delay and peak hour congestion.', ['signal_controller', 'cctv_traffic', 'signal_head'], 'HTP', 75, 70, 6),
        opt('Junction geometric retrofit', 'Reconfigure junction geometry with channelisation islands and improved road markings to improve throughput.', ['cement_concrete', 'paint_thermoplastic', 'footpath_repair'], 'GHMC', 70, 65, 9),
        opt('Feeder load balancing with demand management', 'Redistribute feeder loads and introduce demand-side measures to reduce peak utilisation below safe thresholds.', ['feeder_reconduction', 'transformer_11kv', 'battery_storage'], 'TSSPDCL', 68, 60, 12),
      ],
    };
  }

  _authorityRequest(text) {
    const target =
      (String(text).match(/"target_authority":\s*"([^"]+)"/) || [])[1] ||
      (String(text).match(/"id":\s*"([^"]+)"/) || [])[1] ||
      'GHMC';
    const optionName =
      (String(text).match(/"name":\s*"([^"]+)"/) || [])[1] || 'Recommended intervention';
    const isTraffic = /signal|traffic|junction|intersection|congestion/i.test(`${optionName} ${target}`);
    const requestType =
      isTraffic && target.toUpperCase().startsWith('HTP') ? 'COORDINATION_REQUEST' : 'SUPPORT_REQUEST';
    return {
      authority_involvement_required: true,
      request_type: requestType,
      responsible_authority_id: target,
      responsible_authority_name: target,
      reason: `The recommended intervention (${optionName}) requires the authority to coordinate and support implementation.`,
      requested_action: `Evaluate and coordinate the intervention; confirm feasibility and scheduling.`,
      suggested_channel: 'email',
      message: `Dear ${target}, as part of the approved planning workflow we request your support in coordinating and evaluating the proposed intervention "${optionName}". Please confirm feasibility, scheduling and any operational constraints.`,
      justification: 'Authority involvement is required to implement the recommendation responsibly.',
    };
  }

  _clarify(text) {
    const candidates = [];
    const re = /"authority_code":\s*"([^"]+)"[\s\S]{0,500}?"name":\s*"([^"]+)"[\s\S]{0,500}?"domain":\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(String(text))) !== null) candidates.push({ code: m[1], name: m[2], domain: m[3] });
    const lower = `${text} ${candidates.map((c) => c.domain).join(' ')}`.toLowerCase();
    const energy = /electric|energy|power|distribution|feeder|transformer/.test(lower);
    const traffic = /traffic|signal|congestion|junction|road|vehicle/.test(lower);
    const selected = (energy && candidates.find((c) => /electric|energy|power|distribution/.test(c.domain)))
      || (traffic && candidates.find((c) => /traffic|transport/.test(c.domain)))
      || candidates[0]
      || { code: 'TSSPDCL', name: 'TSSPDCL', domain: 'Electricity distribution' };
    return {
      clarification_required: true,
      responsible_authority_code: selected.code,
      responsible_authority_name: selected.name,
      why_information_required: 'Current loading conditions require further assessment before a responsible recommendation can be made.',
      missing_information: ['planned feeder load transfers', 'maintenance schedules'],
      requested_data: ['feeder load profiles', 'reinforcement plans'],
      message: `Dear ${selected.name}, we request the planned feeder load profiles and reinforcement schedules for the locality so the planning recommendation can be finalised.`,
    };
  }
}

function imageEl(text) {
  return /image/i.test(text) ? ['Image provided; visible congestion and dense vehicle queues observed.'] : [];
}