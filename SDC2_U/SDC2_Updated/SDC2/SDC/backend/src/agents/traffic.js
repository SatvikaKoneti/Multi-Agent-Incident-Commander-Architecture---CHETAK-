import { promptSpecialist } from '../ai/prompts.js';
import { specialistSchema } from '../ai/schemas.js';
import { startAgentRun, completeAgentRun, failAgentRun, evItem, pickEvidence, fmtEvidenceList } from './helper.js';

export async function runTrafficAgent({ ai, analysisId, locality, problem, providers }) {
  const osm = providers.osm;
  const runId = startAgentRun({
    analysisId,
    agentName: 'traffic',
    config: { model: ai.model, temperature: ai.temperature },
    input: { locality, problem },
  });
  try {
    const traffic = osm.getTraffic(locality.name);
    const network = osm.getNetworkSummary(locality.name);
    const roadsSummary = (traffic?.roads || [])
      .map(
        (r) =>
          `${r.name}: ${r.lanes} lanes, ${r.traffic_volume_vph} vph vs ${r.capacity_vph} capacity (v/c ${r.v_c_ratio}), ${r.avg_speed_kmh} km/h, congestion ${r.congestion_index}.`,
      )
      .join('\n');
    const intSummary = (traffic?.intersections || [])
      .map((i) => `${i.name}: ${i.type}, ${i.approaches} approaches, congestion ${i.congestion_rating}, delay ${i.average_delay_s}s (${i.note})`)
      .join('\n');

    const evidenceMap = {
      'osm-roads': evItem('osm-roads', osm.meta.sourceLabel, 'OSM', osm.isDemo(), `Road segments:\n${roadsSummary || 'no road data'}`),
      'osm-intersections': evItem('osm-intersections', osm.meta.sourceLabel, 'OSM', osm.isDemo(), `Intersections:\n${intSummary || 'no intersection data'}`),
      'osm-network': evItem('osm-network', osm.meta.sourceLabel, 'OSM', osm.isDemo(), `Network summary: peak volume ${network?.peak_volume_vph} vph, avg speed ${network?.avg_speed_kmh} km/h, congestion ${network?.congestion_level}, bottlenecks ${(network?.bottleneck_segments || []).join(', ')}`),
    };

    const user = promptSpecialist({
      domain: 'traffic',
      role: 'You are the Traffic Agent of the Hyderabad Urban Intelligence Platform.',
      objective: 'Analyse the traffic and transportation dimension of the urban problem using the OSM road-network evidence.',
      inputData: `LOCALITY: ${locality.name}\nPROBLEM: ${problem.title}\n${problem.description}\nPLANNER REQUEST: assess congestion, capacity, intersections, bottlenecks, delay, mobility, public transport and pedestrian implications.`,
      evidenceText: fmtEvidenceList(Object.values(evidenceMap)),
    });

    const { data } = await ai.generateStructured({
      system: '',
      user,
      schema: specialistSchema,
      metadata: { agent: 'traffic' },
    });

    const evidence = pickEvidence(data.evidence_refs, evidenceMap);
    completeAgentRun(runId, 'traffic', data, evidence);
    return { result: data, evidence };
  } catch (err) {
    failAgentRun(runId, err.message);
    throw err;
  }
}