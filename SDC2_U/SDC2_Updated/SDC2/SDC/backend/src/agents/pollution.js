import { promptSpecialist } from '../ai/prompts.js';
import { specialistSchema } from '../ai/schemas.js';
import { startAgentRun, completeAgentRun, failAgentRun, evItem, pickEvidence, fmtEvidenceList } from './helper.js';

export async function runPollutionAgent({ ai, analysisId, locality, problem, providers }) {
  const air = providers.airQuality;
  const runId = startAgentRun({
    analysisId,
    agentName: 'pollution',
    config: { model: ai.model, temperature: ai.temperature },
    input: { locality, problem },
  });
  try {
    const reading = air.getReading(locality.name);
    const evidenceMap = {
      'cpcb-aqi': evItem(
        'cpcb-aqi',
        air.meta.sourceLabel,
        'CPCB',
        air.isDemo(),
        `Station ${reading?.station_id}: AQI ${reading?.aqi} (${reading?.category}), PM2.5 ${reading?.pm25} ug/m3, PM10 ${reading?.pm10} ug/m3, NO2 ${reading?.no2}, CO ${reading?.co} mg/m3, recorded ${reading?.recorded_at}.`,
      ),
    };

    const user = promptSpecialist({
      domain: 'pollution',
      role: 'You are the Pollution Agent of the Hyderabad Urban Intelligence Platform.',
      objective:
        'Analyse the air-quality and environmental dimension of the urban problem. Interpret the retrieved CPCB-style readings rather than assuming pollution levels from the complaint text alone.',
      inputData: `LOCALITY: ${locality.name}\nPROBLEM: ${problem.title}\n${problem.description}\nPLANNER REQUEST: assess AQI, PM2.5, PM10, relevant pollutants and possible traffic-related pollution consequences. Note that the reading is demo data if flagged.`,
      evidenceText: fmtEvidenceList(Object.values(evidenceMap)),
    });

    const { data } = await ai.generateStructured({
      system: '',
      user,
      schema: specialistSchema,
      metadata: { agent: 'pollution' },
    });

    const evidence = pickEvidence(data.evidence_refs, evidenceMap);
    completeAgentRun(runId, 'pollution', data, evidence);
    return { result: data, evidence };
  } catch (err) {
    failAgentRun(runId, err.message);
    throw err;
  }
}