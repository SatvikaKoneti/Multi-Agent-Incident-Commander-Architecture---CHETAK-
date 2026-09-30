import { readCsv, demoMeta } from './loader.js';

const REQUEST_TYPES = [
  'INFORMATION_REQUEST',
  'CLARIFICATION_REQUEST',
  'SUPPORT_REQUEST',
  'ACTION_REQUEST',
  'COORDINATION_REQUEST',
  'FEASIBILITY_REQUEST',
  'APPROVAL_REQUEST',
];

/**
 * AuthorityContactProvider - contact records for external stakeholders.
 *
 * All records in the demo dataset are explicitly labelled as DEMO CONTACTS
 * (demo_contact=true). Official public contact data is not used in the demo;
 * the UI MUST show "Demo Contact -- Project Demonstration Only" for every
 * contact sourced from this provider.
 */
export class AuthorityContactDataProvider {
  constructor() {
    this._rows = null;
    this.meta = demoMeta(
      'Hyderabad Authority Contact Dataset (demo)',
      'All contacts are demo placeholders for project demonstration only.',
    );
  }

  rows() {
    if (!this._rows) this._rows = readCsv('authority_contacts_demo.csv');
    return this._rows;
  }

  isDemo() {
    return true;
  }

  get sourceLabel() {
    return this.meta.sourceLabel;
  }

  all() {
    return this.rows().map((r) => this._view(r));
  }

  byAuthorityId(authorityId) {
    const r = this.rows().find((x) => x.authority_id === authorityId);
    return r ? this._view(r) : null;
  }

  byNameOrDomain(keyword) {
    const k = String(keyword || '').toLowerCase();
    return this.all().find(
      (c) =>
        c.authority_id.toLowerCase() === k ||
        c.name.toLowerCase().includes(k) ||
        c.domain.toLowerCase().includes(k),
    );
  }

  supportsRequestType(contact, requestType) {
    if (!contact) return false;
    const types = String(contact.supported_request_types || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return types.length === 0 || types.includes(requestType);
  }

  /** Prefer a contact matching the authority id, else resolve by name/domain keyword. */
  suggest(authorityIdOrName) {
    return this.byAuthorityId(authorityIdOrName) || this.byNameOrDomain(authorityIdOrName) || this.all()[0] || null;
  }

  _view(r) {
    return {
      authority_id: r.authority_id,
      name: r.authority_name,
      domain: r.domain,
      jurisdiction: r.jurisdiction,
      contact_name: r.contact_name,
      contact_role: r.contact_role,
      phone: r.phone,
      email: r.email,
      preferred_channel: r.preferred_channel,
      supported_request_types: String(r.supported_request_types || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      demo_contact: r.demo_contact === 'true',
      active: r.active === 'true',
    };
  }
}

export const AUTHORITY_REQUEST_TYPES = REQUEST_TYPES;