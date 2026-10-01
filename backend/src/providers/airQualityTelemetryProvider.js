import { readCsv, demoMeta } from './telemetryDataLoaderProvider.js';

/**
 * AirQualityDataProvider - CPCB Real-Time Air Quality Index.
 */
export class AirQualityDataProvider {
  constructor() {
    this._rows = null;
    this.meta = demoMeta(
      'CPCB Real-Time Air Quality Index',
      'Readings follow CPCB station naming for Hyderabad; values are demo placeholders.',
    );
  }

  rows() {
    if (!this._rows) this._rows = readCsv('cpcb_air_quality_demo.csv');
    return this._rows;
  }

  isDemo() {
    return true;
  }

  get sourceLabel() {
    return this.meta.sourceLabel;
  }

  byLocality(name) {
    const row = this.rows().find(
      (r) => r.locality.toLowerCase() === String(name || '').toLowerCase(),
    );
    return row || null;
  }

  getReading(localityName) {
    const r = this.byLocality(localityName);
    if (!r) return null;
    return {
      sourceLabel: this.sourceLabel,
      isDemo: true,
      station_id: r.station_id,
      aqi: Number(r.aqi),
      pm25: Number(r.pm25),
      pm10: Number(r.pm10),
      no2: Number(r.no2),
      so2: Number(r.so2),
      co: Number(r.co),
      o3: Number(r.o3),
      category: r.category,
      recorded_at: r.recorded_datetime,
      AQI_BANDS: 'Good(0-50) Satisfactory(51-100) Moderate(101-200) Poor(201-300) VeryPoor(301-400) Severe(401+)',
    };
  }

  listAll() {
    return this.rows().map((r) => ({ locality: r.locality, aqi: Number(r.aqi), category: r.category }));
  }

  getAQIThresholds() {
    return {
      Good: [0, 50],
      Satisfactory: [51, 100],
      Moderate: [101, 200],
      Poor: [201, 300],
      VeryPoor: [301, 400],
      Severe: [401, Infinity],
    };
  }
}

export class LiveAirQualityDataProvider extends AirQualityDataProvider {
  isDemo() {
    return false;
  }
}
