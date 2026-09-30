import { readCsv, demoMeta } from './loader.js';

/**
 * CitizenComplaintDataProvider - the project's own citizen complaint dataset.
 */
export class CitizenComplaintDataProvider {
  constructor() {
    this._rows = null;
    this.meta = demoMeta(
      'Citizen Complaint Dataset (project dataset)',
      'Seed complaints used for local demonstration; live submissions are stored in the database.',
    );
  }

  rows() {
    if (!this._rows) this._rows = readCsv('citizen_complaints_demo.csv');
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
      tracking_id: r.tracking_id,
      title: r.title,
      description: r.description,
      locality: r.locality,
      area: r.area,
      lat: r.lat ? Number(r.lat) : null,
      lng: r.lng ? Number(r.lng) : null,
      category: r.category,
      severity_input: Number(r.severity_input || 0),
      submitted_date: r.submitted_date,
      status: r.status,
      resolution: r.resolution || null,
      image_ref: r.image_ref || null,
      video_ref: r.video_ref || null,
      citizen_name: r.citizen_name,
    }));
  }

  byLocality(localityName) {
    return this.all().filter(
      (c) => c.locality.toLowerCase() === String(localityName || '').toLowerCase(),
    );
  }

  relatedTo(keyword, localityName) {
    const k = String(keyword || '').toLowerCase();
    const base = localityName ? this.byLocality(localityName) : this.all();
    if (!k) return base;
    return base.filter(
      (c) =>
        (c.title || '').toLowerCase().includes(k) ||
        (c.description || '').toLowerCase().includes(k) ||
        (c.category || '').toLowerCase().includes(k),
    );
  }
}

export class LiveCitizenComplaintDataProvider extends CitizenComplaintDataProvider {
  isDemo() {
    return false;
  }
}