import { readCsv, demoMeta } from './loader.js';

/**
 * ConstraintDataProvider - planning constraints applied during recommendation filtering.
 */
export class ConstraintDataProvider {
  constructor() {
    this._rows = null;
    this.meta = demoMeta(
      'Planning Constraints Registry',
      'Budget, spatial, timeline, utility, land and environmental constraints for Hyderabad planning.',
    );
  }

  rows() {
    if (!this._rows) this._rows = readCsv('constraints_demo.csv');
    return this._rows;
  }

  isDemo() {
    return true;
  }

  get sourceLabel() {
    return this.meta.sourceLabel;
  }

  all() {
    return this.rows().map((r) => ({
      authority_code: r.authority_code,
      type: r.type,
      description: r.description,
      value: r.value,
      is_demo: r.is_demo === 'true',
    }));
  }

  byAuthority(code) {
    return this.all().filter((c) => c.authority_code === code);
  }

  byType(type) {
    return this.all().filter((c) => c.type === type);
  }

  budgetConstraint(authorityCode) {
    const c = this.rows().find((r) => r.authority_code === authorityCode && r.type === 'budget');
    return c ? Number(c.value) : null;
  }
}

export class LiveConstraintDataProvider extends ConstraintDataProvider {
  isDemo() {
    return false;
  }
}