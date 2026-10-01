import { providerRegistry } from '../providers/index.js';

/**
 * Deterministic cost engine. Maps intervention components (catalog item keys)
 * to the Telangana material price rates and sums them with a short engineering
 * overhead. The AI proposes components; this engine does the arithmetic.
 */
const OVERHEAD_PCT = 0.08;

export function estimateCost(components, { providers = providerRegistry } = {}) {
  const cost = providers.cost;
  const lines = [];
  let base = 0;
  let unitsBreakdown = [];

  const unitOf = (key) => {
    const item = cost.getItem(key);
    return item ? Number(item.base_rate_inr) : null;
  };

  for (const component of components || []) {
    let key = component;
    let qty = 1;
    let label = component;
    if (typeof component === 'object') {
      key = component.item_key;
      qty = Number(component.quantity) || 1;
      label = component.label || key;
    }
    const rate = unitOf(key);
    if (rate === null) {
      lines.push({ component: label, status: 'unpriced', note: `No demo rate listed for "${key}".` });
      continue;
    }
    const subtotal = Math.round(rate * qty);
    base += subtotal;
    unitsBreakdown.push({
      item_key: key,
      component: label,
      rate_inr: rate,
      quantity: qty,
      subtotal_inr: subtotal,
      source: cost.meta.sourceLabel,
      is_demo: cost.isDemo(),
    });
  }

  const overhead = Math.round(base * OVERHEAD_PCT);
  const total = base + overhead;
  return {
    estimated_cost_inr: total,
    base_cost_inr: base,
    overhead_inr: overhead,
    overhead_pct: OVERHEAD_PCT * 100,
    breakdown: unitsBreakdown,
    unpriced: lines.filter((l) => l.status === 'unpriced').map((l) => l.note),
    currency: 'INR',
    source_label: cost.meta.sourceLabel,
    is_demo: cost.isDemo(),
    disclaimer: 'Demo prices are approximate placeholders. Replace with live tendering rates before budgeting.',
  };
}

export function formatCostInr(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Not estimated';
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}