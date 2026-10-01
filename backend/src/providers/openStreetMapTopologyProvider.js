import { readJson, demoMeta } from './telemetryDataLoaderProvider.js';

/**
 * OSMDataProvider - roads, intersections, lanes and road network for Hyderabad.
 * The demo implementation reads a local OSM-compatible representation.
 * A live implementation would consume an OSM export/Overpass API for the city.
 */
export class OSMDataProvider {
  constructor() {
    this._data = null;
    this.meta = demoMeta(
      'OpenStreetMap (Hyderabad)',
      'Road/intersection topology follows the real Hyderabad OSM network; traffic attributes are demo estimates.',
    );
  }

  data() {
    if (!this._data) this._data = readJson('osm_hyderabad_demo.json');
    return this._data;
  }

  isDemo() {
    return true;
  }

  get sourceLabel() {
    return this.meta.sourceLabel;
  }

  listLocalities() {
    return this.data().localities.map((l) => ({ id: l.id, name: l.name, lat: l.lat, lng: l.lng }));
  }

  findLocality(name) {
    const l = this.data().localities.find(
      (x) => x.name.toLowerCase() === String(name || '').toLowerCase(),
    );
    return l || null;
  }

  getRoads(localityName) {
    const l = this.findLocality(localityName);
    return l ? l.roads : [];
  }

  getIntersections(localityName) {
    const l = this.findLocality(localityName);
    return l ? l.intersections : [];
  }

  getTraffic(localityName) {
    const l = this.findLocality(localityName);
    if (!l) return null;
    return {
      roads: l.roads,
      intersections: l.intersections,
      metrics: l.traffic_metrics,
      lanes: l.roads.map((r) => ({ segment_id: r.segment_id, name: r.name, lanes: r.lanes })),
    };
  }

  getNetworkSummary(localityName) {
    const traffic = this.getTraffic(localityName);
    if (!traffic) return null;
    const roads = traffic.roads || [];
    const congestionRatings = (traffic.intersections || []).map((i) => i.congestion_rating || 0);
    return {
      sourceLabel: this.sourceLabel,
      isDemo: true,
      road_count: roads.length,
      total_lanes: roads.reduce((s, r) => s + (r.lanes || 0), 0),
      peak_volume_vph: traffic.metrics?.peak_volume_vph || null,
      avg_speed_kmh: traffic.metrics?.avg_network_speed_kmh || null,
      congestion_level: traffic.metrics?.congestion_level || null,
      bottleneck_segments: traffic.metrics?.bottleneck_segments || [],
      bottleneck_intersections: traffic.metrics?.bottleneck_intersections || [],
      worst_intersection: congestionRatings.length
        ? traffic.intersections.reduce((a, b) => (a.congestion_rating >= b.congestion_rating ? a : b))
        : null,
    };
  }
}

export class LiveOSMDataProvider extends OSMDataProvider {
  isDemo() {
    return false;
  }
}
