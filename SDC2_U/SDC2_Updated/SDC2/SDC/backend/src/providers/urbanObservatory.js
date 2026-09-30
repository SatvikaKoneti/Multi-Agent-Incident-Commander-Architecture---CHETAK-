import { readJson, demoMeta } from './loader.js';

/**
 * UrbanObservatoryDataProvider - GIS layers, infrastructure and amenities
 * matching the Hyderabad Urban Observatory platform (GHMC).
 */
export class UrbanObservatoryDataProvider {
  constructor() {
    this._data = null;
    this.meta = demoMeta(
      'Hyderabad Urban Observatory',
      'Synthetic representation of the Urban Observatory GIS/amenity schema.',
    );
  }

  data() {
    if (!this._data) this._data = readJson('urban_observatory_demo.json');
    return this._data;
  }

  isDemo() {
    return true;
  }

  get sourceLabel() {
    return this.meta.sourceLabel;
  }

  findLocality(name) {
    return (
      this.data().localities.find((l) => l.name.toLowerCase() === String(name || '').toLowerCase()) ||
      null
    );
  }

  getLocalityInfo(name) {
    const l = this.findLocality(name);
    if (!l) return null;
    return {
      sourceLabel: this.sourceLabel,
      isDemo: true,
      name: l.name,
      population: l.population,
      area_sqkm: l.area_sqkm,
      land_use: l.land_use,
    };
  }

  getAmenities(name) {
    const l = this.findLocality(name);
    return l ? l.amenities : [];
  }

  getInfrastructure(name) {
    const l = this.findLocality(name);
    return l ? l.infrastructure : [];
  }

  getSpatialConstraints(name) {
    const infra = this.getInfrastructure(name);
    if (!infra) return [];
    return infra
      .filter((i) => i.status === 'restricted' || i.status === 'heritage')
      .map((i) => ({ asset: i.asset_type, note: i.details }));
  }
}

export class LiveUrbanObservatoryDataProvider extends UrbanObservatoryDataProvider {
  isDemo() {
    return false;
  }
}