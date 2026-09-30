import { promptSpecialist } from '../ai/prompts.js';
import { specialistSchema } from '../ai/schemas.js';
import { startAgentRun, completeAgentRun, failAgentRun, evItem, pickEvidence, fmtEvidenceList } from './helper.js';

/**
 * Energy Agent.
 * Pipeline: DATABASE -> METRIC CALCULATION -> EVIDENCE -> LLM INTERPRETATION -> STRUCTURED RESULT.
 * The utilisation figure is calculated deterministically; its interpretation is the LLM's.
 */
export async function runEnergyAgent({ ai, analysisId, locality, problem, providers }) {
  const energy = providers.energy;
  const runId = startAgentRun({
    analysisId,
    agentName: 'energy',
    config: { model: ai.model, temperature: ai.temperature },
    input: { locality, problem },
  });
  try {
    const feeders = energy.getData(locality.name) || [];
    const metrics = feeders
      .map((f) => {
        const ratio = f.installed_capacity_mw > 0 ? f.peak_demand_mw / f.installed_capacity_mw : 0;
        const headroom = f.installed_capacity_mw - f.peak_demand_mw;
        const status = ratio >= 1 ? 'ABOVE_CAPACITY' : ratio >= 0.9 ? 'HIGH_LOADING' : ratio >= 0.7 ? 'ELEVATED' : 'NORMAL';
        return { ...f, demand_capacity_ratio: Math.round(ratio * 1000) / 1000, headroom_mw: Math.round(headroom * 100) / 100, status };
      })
      .map(
        (f) =>
          `Feeder ${f.feeder_name} (${f.feeder_id}): peak ${f.peak_demand_mw} MW / capacity ${f.installed_capacity_mw} MW = utilisation ${f.utilization_pct}% (ratio ${f.demand_capacity_ratio}, headroom ${f.headroom_mw} MW, status ${f.status}); outages ${f.interruption_hours_30d} h/30d; ${f.consumers_count} consumers.`,
      )
      .join('\n');

    const evidenceMap = {
      'energy-feeder': evItem('energy-feeder', energy.meta.sourceLabel, 'Energy Provider', energy.isDemo(), `Feeder records:\n${metrics || 'no energy data'}`),
    };

    const user = promptSpecialist({
      domain: 'energy',
      role: 'You are the Energy Agent of the Hyderabad Urban Intelligence Platform.',
      objective:
        'Analyse the electricity demand, capacity and distribution-infrastructure dimension of the problem. Interpret computed utilisation relative to capacity and interruption records; do not emit a fixed verdict - reason from the retrieved records.',
      inputData: `LOCALITY: ${locality.name}\nPROBLEM: ${problem.title}\n${problem.description}\nPLANNER REQUEST: assess demand, capacity, feeder loading, transformer situation, interruptions, peak demand and infrastructure implications.`,
      evidenceText: fmtEvidenceList(Object.values(evidenceMap)),
    });

    const { data } = await ai.generateStructured({
      system: '',
      user,
      schema: specialistSchema,
      metadata: { agent: 'energy' },
    });

    const evidence = pickEvidence(data.evidence_refs, evidenceMap);
    completeAgentRun(runId, 'energy', data, evidence);
    return { result: data, evidence };
  } catch (err) {
    failAgentRun(runId, err.message);
    throw err;
  }
}