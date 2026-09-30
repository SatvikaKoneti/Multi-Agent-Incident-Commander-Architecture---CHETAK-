import { providerRegistry } from '../providers/index.js';

const HYDERABAD_KNOWLEDGE = [
  {
    id: 'know-city-overview',
    title: 'Hyderabad urban context',
    body: 'Hyderabad is the capital of Telangana. The Hyderabad Metropolitan Region (HMR) is governed across multiple agencies: GHMC (Greater Hyderabad Municipal Corporation) for civic services and urban infrastructure, HMDA (Hyderabad Metropolitan Development Authority) for metropolitan planning and development control, Hyderabad Traffic Police for traffic management, and utility boards such as HMWSSB (water/sewerage) and TSSPDCL/TGSPDCL (electricity distribution). Integrated decision support must respect the jurisdictional split between these authorities.',
  },
  {
    id: 'know-ghmc',
    title: 'GHMC responsibilities',
    body: 'GHMC is responsible for urban infrastructure, roads (non-allotted), drainage, sanitation, solid waste, street lighting and public works within Greater Hyderabad. Interventions like footpaths, storm drains, roadway maintenance, LED street lighting and solid waste management fall under GHMC jurisdiction.',
  },
  {
    id: 'know-hmda',
    title: 'HMDA planning constraints',
    body: 'HMDA administers the Regional Development Plan and Development Control Regulations. Land-use conversion, heritage protection (e.g. the Charminar Herititage precinct), Floor Area Ratio limits and major transport corridor planning require HMDA coordination. Heritage zones impose construction restrictions.',
  },
  {
    id: 'know-htp',
    title: 'Hyderabad Traffic Police responsibilities',
    body: 'Hyderabad Traffic Police manage signals, enforcement, incident response and traffic regulation. Signal timing modifications, adaptive signal systems and road-use restrictions are coordinated with the Traffic Police and cannot be deployed unilaterally.',
  },
  {
    id: 'know-cpcb',
    title: 'Air quality regulation',
    body: 'CPCB (Central Pollution Control Board) defines national ambient air quality standards. Telangana State Pollution Control Board (TSPCB) regulates local emissions. AQI categories: Good (0-50), Satisfactory (51-100), Moderate (101-200), Poor (201-300), Very Poor (301-400), Severe (401+).',
  },
  {
    id: 'know-energy',
    title: 'Electricity distribution context',
    body: 'TSSPDCL (Telangana State Southern Power Distribution Company Limited) distributes power across Hyderabad. Key operational indicators are feeder peak demand vs installed capacity, utilization percentage, interruption hours and average outage duration. Utilization above ~100% indicates loading beyond installed capacity and elevated failure risk.',
  },
  {
    id: 'know-costing',
    title: 'Cost estimation principle',
    body: 'Intervention cost estimates should be assembled from component-based rates (materials, equipment, labour) drawn from the Telangana building material price dataset. Demo rates are placeholders; live tendering rates must replace them for real budgeting.',
  },
  {
    id: 'know-dss',
    title: 'Decision support principles',
    body: 'The platform is a Decision Support System. AI recommends, the planner decides, and the authority acts. No irreversible real-world action is taken autonomously. Planner approval is required for authority communication and final recommendations.',
  },
  {
    id: 'know-swm',
    title: 'Solid Waste Management — GHMC-SWM',
    body: 'GHMC Solid Waste Management (GHMC-SWM) is responsible for door-to-door collection, secondary storage (bins and transfer stations), transportation and disposal of municipal solid waste in Hyderabad. Key indicators: bin overflow frequency, collection vehicle counts, route density, daily waste tonnage per ward. Common interventions: increased collection frequency, bin replacement, bulk waste vehicles, composting centres, and segregation campaigns. No dedicated AI specialist agent exists yet for this domain.',
  },
  {
    id: 'know-water',
    title: 'Water Supply and Drainage — HMWSSB',
    body: 'HMWSSB (Hyderabad Metropolitan Water Supply and Sewerage Board) is responsible for drinking water supply, sewerage collection, treatment and drainage infrastructure in Greater Hyderabad. Key issues: pipeline pressure loss, burst mains, intermittent supply schedules, sewerage overflows, storm drain blockages and waterlogging. Common interventions: pipeline repair, new distribution mains, pumping station upgrades, drain desilting and capacity expansion. No dedicated AI specialist agent exists yet for this domain.',
  },
  {
    id: 'know-transit',
    title: 'Public Transport — TSRTC',
    body: 'TSRTC (Telangana State Road Transport Corporation) operates bus services across Hyderabad and Telangana. The Hyderabad Metro Rail (L&T Metro) operates metro corridors. Key issues: low frequency, route coverage gaps, overcrowding, poor last-mile connectivity, bus stop infrastructure deficiency and inter-modal gaps. Common interventions: route frequency enhancement, new stops, feeder bus services, electric bus induction and integrated ticketing. No dedicated AI specialist agent exists yet for TSRTC-domain analysis.',
  },
  {
    id: 'know-street-lights',
    title: 'Street Lighting — GHMC & TSSPDCL',
    body: 'Street lighting in Hyderabad is a shared responsibility: GHMC manages street light infrastructure (poles, fittings, LED fixtures) while TSSPDCL provides the electrical supply. Failures may be due to lamp burnout, feeder faults, cable damage or control panel faults. Common interventions: lamp replacement, cable rehabilitation, metering upgrades and solar street light installation. The Energy Agent can assess the supply-side (feeder) dimension.',
  },
  {
    id: 'know-noise',
    title: 'Noise Pollution — TSPCB',
    body: 'Noise pollution in urban areas is regulated by TSPCB under the Noise Pollution (Regulation and Control) Rules. Sources include construction activity, traffic, generators and industrial activity. GHMC may coordinate enforcement in residential zones. Interventions include noise barriers, construction hour restrictions, equipment standards compliance and green buffers.',
  },
  {
    id: 'know-drainage',
    title: 'Storm Water Drainage — GHMC',
    body: 'Storm water drainage in Hyderabad is managed by GHMC. Recurring waterlogging is caused by drain blockages, insufficient drain capacity, encroachments over drains and poor gradient design. Common interventions: drain desilting, drain widening and relining, percolation pits, retention ponds and storm drain network capacity studies. Seasonal flooding often compounds infrastructure failures.',
  },
];

function multiple(fields) {
  return '[n]'.repeat(Math.max(0, (fields?.length || 1) - 1));
}

export function buildKnowledgeChunks() {
  const chunks = [];
  const label = (p) => `${p.meta.sourceLabel}${p.isDemo() ? ' (SYNTHETIC DEMO DATA)' : ''}`;

  const osm = providerRegistry.osm;
  const obs = providerRegistry.urbanObservatory;
  const air = providerRegistry.airQuality;
  const energy = providerRegistry.energy;
  const cost = providerRegistry.cost;
  const auth = providerRegistry.authority;
  const cons = providerRegistry.constraint;
  const cmp = providerRegistry.citizenComplaint;

  for (const locality of osm.listLocalities()) {
    const info = obs.getLocalityInfo(locality.name) || {};
    const traffic = osm.getNetworkSummary(locality.name);
    const reading = air.getReading(locality.name);
    const feeders = energy.getData(locality.name);
    const infra = obs.getInfrastructure(locality.name);
    const complaints = cmp.byLocality(locality.name);

    chunks.push({
      id: `loc-profile-${locality.id}`,
      source: label(obs),
      source_label: 'Urban Observatory',
      is_demo: true,
      title: `${locality.name} profile`,
      body:
        `${locality.name} has a population of ${info.population || 'unknown'} and ${info.area_sqkm || 'unknown'} sq km. ` +
        `Land use: ${info.land_use ? JSON.stringify(info.land_use) : 'not available'}. ` +
        `${(infra || []).map((i) => `${i.name}: ${i.status} (${i.details})`).join('. ')}`,
    });

    if (traffic) {
      chunks.push({
        id: `loc-traffic-${locality.id}`,
        source: label(osm),
        source_label: 'OSM',
        is_demo: true,
        title: `${locality.name} traffic conditions`,
        body:
          `${locality.name} road network has ${traffic.road_count} roads and ${traffic.total_lanes} lanes. ` +
          `Peak volume ${traffic.peak_volume_vph ?? 'n/a'} vph, average speed ${traffic.avg_speed_kmh ?? 'n/a'} km/h, congestion ${traffic.congestion_level ?? 'n/a'}. ` +
          `Bottleneck segments: ${(traffic.bottleneck_segments || []).join(', ') || 'none'}. Bottleneck intersections: ${(traffic.bottleneck_intersections || []).join(', ') || 'none'}. ` +
          `Worst intersection: ${traffic.worst_intersection?.name || 'n/a'}.`,
      });
    }

    if (reading) {
      chunks.push({
        id: `loc-air-${locality.id}`,
        source: label(air),
        source_label: 'CPCB',
        is_demo: true,
        title: `${locality.name} air quality`,
        body:
          `${locality.name} AQI ${reading.aqi} (${reading.category}), PM2.5 ${reading.pm25} ug/m3, PM10 ${reading.pm10} ug/m3, ` +
          `NO2 ${reading.no2} ug/m3, CO ${reading.co} mg/m3.`,
      });
    }

    if (feeders && feeders.length) {
      for (const f of feeders) {
        chunks.push({
          id: `loc-energy-${f.feeder_id}`,
          source: label(energy),
          source_label: 'Energy Provider',
          is_demo: true,
          title: `${f.feeder_name} feeder`,
          body:
            `Feeder ${f.feeder_name} (${f.feeder_id}): peak demand ${f.peak_demand_mw} MW, installed capacity ${f.installed_capacity_mw} MW, ` +
            `utilisation ${f.utilization_pct}%, interruption hours ${f.interruption_hours_30d} (30 days), ${f.consumers_count} consumers.`,
        });
      }
    }
  }

  for (const item of cost.rows()) {
    chunks.push({
      id: `cost-${item.item_key}`,
      source: label(cost),
      source_label: 'Cost Provider',
      is_demo: true,
      title: `${item.item_name} rate`,
      body: `${item.item_name} (${item.unit}): Rs. ${item.base_rate_inr}. Category: ${item.category}.`,
    });
  }

  for (const a of auth.all()) {
    chunks.push({
      id: `auth-${a.code}`,
      source: label(auth),
      source_label: 'Stakeholder Registry',
      is_demo: true,
      title: `${a.name} responsibility`,
      body: `${a.name} (${a.code}) covers ${a.domain} within ${a.jurisdiction}. Responsibility: ${a.responsibility}. Contact: ${a.contact_method}.`,
    });
  }

  for (const c of cons.all()) {
    chunks.push({
      id: `cons-${c.authority_code}-${c.type}`,
      source: cons.sourceLabel,
      source_label: 'Constraints Registry',
      is_demo: true,
      title: `${c.authority_code} ${c.type} constraint`,
      body: `${c.description} (value: ${c.value}).`,
    });
  }

  for (const c of cmp.all()) {
    chunks.push({
      id: `cmp-${c.tracking_id}`,
      source: label(cmp),
      source_label: 'Citizen Complaints',
      is_demo: true,
      title: c.title,
      body: `${c.title} - ${c.description} Locality: ${c.locality}. Category: ${c.category}. Severity input: ${c.severity_input}.`,
    });
  }

  for (const k of HYDERABAD_KNOWLEDGE) {
    chunks.push({
      id: k.id,
      source: 'Project knowledge base (authoritative reference)',
      source_label: 'KB',
      is_demo: false,
      title: k.title,
      body: k.body,
    });
  }

  return chunks;
}