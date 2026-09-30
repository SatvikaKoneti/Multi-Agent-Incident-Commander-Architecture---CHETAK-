/**
 * Builds the structured context block attached to an authority communication
 * (request). Includes locality, problem and recommendation context so the
 * request can be audited and the AI can use it when reading responses.
 */
export function requestContextFrom({ locality, problem, recommendation }) {
  return {
    kind: 'recommendation-support',
    locality: locality ? { id: locality.id, name: locality.name } : null,
    problem: {
      title: problem?.title || '',
      description: problem?.description || '',
      category: problem?.category || null,
    },
    recommendation: recommendation
      ? {
          recommendation_id: recommendation.recommendation_id,
          option_id: recommendation.id,
          name: recommendation.name,
          summary: recommendation.summary || '',
          target_authority: recommendation.target_authority || null,
          estimated_cost_inr: recommendation.est_cost_inr ?? null,
          timeline_months: recommendation.timeline_months ?? null,
          expected_impact: recommendation.expected_impact || '',
        }
      : null,
  };
}