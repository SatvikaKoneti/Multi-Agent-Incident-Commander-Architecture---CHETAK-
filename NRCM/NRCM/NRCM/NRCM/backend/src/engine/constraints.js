import { estimateCost } from './costs.js';
import { clamp, round } from '../utils/index.js';
import { providerRegistry } from '../providers/index.js';

const CONSTRUCTION_KEYS_HINT = /cement|asphalt|reconduct|transformer|signal|footpath|drain|shelter|charging|solar|storage|road|junction/;

function envScore(envEffect) {
  const t = String(envEffect || '').toLowerCase();
  if (/positive|reduce|lower|improve|green|cleaner|tree|electric/i.test(t)) return 90;
  if (/negative|increase|emission|noise|dust|disrupt/i.test(t)) return 40;
  return 70;
}

/**
 * Constraint Filter (deterministic). Each option is checked against the
 * planning-constraints registry. Budget overruns block an option; spatial,
 * utility, land and timeline constraints are flagged for approval as warnings.
 */
export function applyConstraints({ options, locality, providers = providerRegistry }) {
  const constraintProvider = providers.constraint;
  const observatory = providers.urbanObservatory;

  const allConstraints = constraintProvider.all();
  const localitySpatial = observatory.getSpatialConstraints(locality.name) || [];

  return options.map((option) => {
    const costEstimate = estimateCost(option.components, { providers });
    const authorityCode = normalizeAuthorityCode(option.target_authority, providers);

    const constraintsApplied = [];
    let blocked = false;

    // Budget (hard)
    const budget = constraintProvider.budgetConstraint(authorityCode);
    if (budget !== null && costEstimate.estimated_cost_inr > 0) {
      const within = costEstimate.estimated_cost_inr <= budget;
      if (!within) {
        blocked = true;
        constraintsApplied.push({
          type: 'budget',
          authority: authorityCode,
          description: `Estimated cost ₹${costEstimate.estimated_cost_inr.toLocaleString('en-IN')} exceeds ${authorityCode} budget of ₹${budget.toLocaleString('en-IN')}`,
          impact: 'block',
          value: budget,
        });
      } else {
        constraintsApplied.push({
          type: 'budget',
          authority: authorityCode,
          description: `Estimated cost ₹${costEstimate.estimated_cost_inr.toLocaleString('en-IN')} is within the ${budget.toLocaleString('en-IN')} budget cap`,
          impact: 'pass',
          value: budget,
        });
      }
    }

    // Spatial / heritage (warn)
    for (const s of localitySpatial) {
      if (CONSTRUCTION_KEYS_HINT.test((option.components || []).join(' '))) {
        constraintsApplied.push({
          type: 'spatial',
          authority: 'HMDA',
          description: `${s.asset} in ${locality.name}: ${s.note}`,
          impact: 'approval_required',
        });
      }
    }

    // Utility coordination (note/warn)
    if (authorityCode === 'TSSPDCL') {
      const window = allConstraints.find((c) => c.type === 'utility' && c.authority_code === 'TSSPDCL');
      if (window) {
        constraintsApplied.push({
          type: 'utility',
          authority: 'TSSPDCL',
          description: `Feeder work requires a shutdown window: ${window.value}`,
          impact: 'approval_required',
        });
      }
    }

    // Land availability (warn when the option may need new land)
    if (/substation|depot|charging|storage|terminal/i.test((option.components || []).join(' '))) {
      const land = allConstraints.find((c) => c.type === 'land');
      if (land) {
        constraintsApplied.push({
          type: 'land',
          authority: 'HMDA',
          description: `${land.description} (${land.value})`,
          impact: 'approval_required',
        });
      }
    }

    // Timeline (warn)
    const timelineMonths = Number(option.timeline_months) || 12;
    const timeline = allConstraints.find((c) => c.type === 'timeline');
    if (timeline && timelineMonths > 12) {
      constraintsApplied.push({
        type: 'timeline',
        authority: 'GHMC',
        description: `Implementation horizon ${timelineMonths} months exceeds the single financial year guidance (${timeline.value}); requires phasing approval`,
        impact: 'approval_required',
      });
    }

    const env_score = envScore(option.environmental_effect);
    const timelineScore = clamp(100 - timelineMonths * 5, 0, 100);
    const feasibility = Number(option.feasibility_score) || 0;
    const impact = Number(option.impact_score) || 0;
    const viability = round(
      0.4 * impact + 0.3 * feasibility + 0.2 * timelineScore + 0.1 * env_score,
    );

    const constraintStatus = blocked
      ? 'blocked'
      : constraintsApplied.some((c) => c.impact === 'approval_required')
        ? 'approval_required'
        : 'clear';

    return {
      option,
      authority_code: authorityCode,
      cost_estimate: costEstimate,
      constraints_applied: constraintsApplied,
      blocked,
      status: blocked ? 'blocked' : 'eligible',
      constraint_status: constraintStatus,
      env_score,
      timeline_score: timelineScore,
      feasibility,
      impact,
      viability,
    };
  });
}

function normalizeAuthorityCode(target, providers) {
  if (!target) return 'GHMC';
  const a = providers.authority.byCode(target.toUpperCase().slice(0, 10));
  if (a) return a.code;
  const found = providers.authority.byDomain(target);
  return found ? found.code : 'GHMC';
}