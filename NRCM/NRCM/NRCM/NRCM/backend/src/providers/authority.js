import { readCsv, demoMeta } from './loader.js';
import { query, get } from '../db/index.js';
import { jsonOrNull } from '../utils/index.js';

/**
 * AuthorityDataProvider - registry of responsible stakeholders for Hyderabad.
 */
export class AuthorityDataProvider {
  constructor() {
    this._rows = null;
    this.meta = demoMeta(
      'Hyderabad Stakeholder Registry',
      'Based on the key stakeholders identified in the project presentation.',
    );
  }

  rows() {
    try {
      const dbRows = query('SELECT * FROM authorities WHERE active = 1');
      if (dbRows && dbRows.length > 0) {
        return dbRows.map((r) => ({
          authority_code: r.code,
          name: r.name,
          short_name: r.short_name || r.code,
          domain: r.domain,
          responsibility: r.description || r.domain,
          jurisdiction: 'Hyderabad City & Metropolitan Area',
          contact_method: `${r.code} HQ Portal`,
          simulated_endpoint: `/api/sim/authority/${r.code.toLowerCase()}`,
          assigned_categories: jsonOrNull(r.assigned_categories) || [],
          sla_hours: r.sla_hours || 48,
          active: r.active === 1 || r.active === 'true' || r.active === true,
        }));
      }
    } catch {
      // Fall back to CSV if DB is initializing
    }

    if (!this._rows) this._rows = readCsv('authorities_demo.csv');
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
      code: r.authority_code || r.code,
      name: r.name,
      short_name: r.short_name || r.authority_code || r.code,
      domain: r.domain,
      responsibility: r.responsibility || r.description,
      jurisdiction: r.jurisdiction || 'Hyderabad City',
      contact_method: r.contact_method || `${r.code} Portal`,
      simulated_endpoint: r.simulated_endpoint || `/api/sim/authority/${(r.code || r.authority_code).toLowerCase()}`,
      assigned_categories: r.assigned_categories || [],
      sla_hours: r.sla_hours || 48,
      active: r.active === true || r.active === 'true' || r.active === 1,
    }));
  }

  byCode(code) {
    if (!code) return null;
    const a = this.all().find((r) => r.code.toUpperCase() === code.toUpperCase());
    return a || null;
  }

  byDomain(keyword) {
    const k = String(keyword || '').toLowerCase();
    return this.all().filter(
      (a) =>
        a.domain.toLowerCase().includes(k) ||
        a.responsibility.toLowerCase().includes(k) ||
        a.name.toLowerCase().includes(k),
    );
  }

  suggest(codeOrDomain) {
    if (!codeOrDomain) return this.all()[0] || null;
    return this.byCode(codeOrDomain) || this.byDomain(codeOrDomain)[0] || null;
  }
}

export class LiveAuthorityDataProvider extends AuthorityDataProvider {
  isDemo() {
    return false;
  }
}