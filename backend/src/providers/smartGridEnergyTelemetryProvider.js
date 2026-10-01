import { readCsv, demoMeta } from './telemetryDataLoaderProvider.js';

/**
 * EnergyDataProvider - TGSPDCL / TSSPDCL electricity distribution data.
 */
export class EnergyDataProvider {
  constructor() {
    this._rows = null;
    this.meta = demoMeta(
      'TGSPDCL / TSSPDCL electricity data',
      'Feeder level demand/capacity records in demo form for Hyderabad localities.',
    );
  }

  rows() {
    if (!this._rows) this._rows = readCsv('energy_demo.csv');
    return this._rows;
  }

  isDemo() {
    return true;
  }

  get sourceLabel() {
    return this.meta.sourceLabel;
  }

  byLocality(name) {
    const rows = this.rows().filter(
      (r) => r.locality.toLowerCase() === String(name || '').toLowerCase(),
    );
    return rows.length ? rows : null;
  }

  getData(localityName) {
    const rows = this.byLocality(localityName);
    if (!rows) return null;
    return rows.map((r) => {
      const peak = Number(r.peak_demand_mw);
      const capacity = Number(r.installed_capacity_mw);
      const util = capacity > 0 ? (peak / capacity) * 100 : 0;
      return {
        sourceLabel: this.sourceLabel,
        isDemo: true,
        feeder_id: r.feeder_id,
        feeder_name: r.feeder_name,
        peak_demand_mw: peak,
        installed_capacity_mw: capacity,
        utilization_pct: Math.round(util * 100) / 100,
        interruption_hours_30d: Number(r.interruption_hours_30d),
        consumers_count: Number(r.consumers_count),
        avg_outage_min: Number(r.avg_outage_min),
        recorded_month: r.recorded_month,
      };
    });
  }
}

export class LiveEnergyDataProvider extends EnergyDataProvider {
  isDemo() {
    return false;
  }
}
