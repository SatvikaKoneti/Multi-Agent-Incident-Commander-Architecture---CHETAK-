import { test } from 'node:test';
import assert from 'node:assert/strict';

import '../test-helpers/init-env.js';

const { providerRegistry } = await import('../src/providers/index.js');

test('OSM provider exposes road networks, intersections and lanes for localities', () => {
  const osm = providerRegistry.osm;
  assert.equal(osm.isDemo(), true);
  assert.ok(osm.sourceLabel.includes('OpenStreetMap'));
  const traffic = osm.getTraffic('HITEC City / Madhapur');
  assert.ok(traffic.roads.length >= 3);
  assert.ok(traffic.intersections.length >= 1);
  assert.ok(traffic.roads.every((r) => typeof r.lanes === 'number'));
  const network = osm.getNetworkSummary('Gachibowli');
  assert.ok(network.peak_volume_vph > 0);
  assert.equal(network.isDemo, true);
});

test('urban observatory provider exposes population, amenities and infrastructure', () => {
  const obs = providerRegistry.urbanObservatory;
  const info = obs.getLocalityInfo('HITEC City / Madhapur');
  assert.ok(info.population > 0);
  assert.ok(obs.getAmenities('HITEC City / Madhapur').length > 0);
  assert.ok(obs.getInfrastructure('Gachibowli').length > 0);
});

test('CPCB air-quality provider returns readings with AQI bands', () => {
  const air = providerRegistry.airQuality;
  const r = air.getReading('HITEC City / Madhapur');
  assert.ok(r.aqi > 0 && r.pm25 > 0 && r.pm10 > 0);
  assert.ok(r.AQI_BANDS.includes('Moderate'));
  assert.equal(r.isDemo, true);
});

test('cost provider lists material rates and source labels demo data', () => {
  const cost = providerRegistry.cost;
  assert.ok(cost.rate('signal_head') > 0);
  assert.ok(cost.rate('cement_concrete') > 0);
  assert.equal(cost.isDemo(), true);
  assert.ok(cost.meta.sourceLabel.includes('Telangana'));
});

test('energy provider computes utilization deterministically (48.5/52 = 93.27%)', () => {
  const energy = providerRegistry.energy;
  const gachi = energy.getData('Gachibowli');
  const feeder = gachi.find((f) => f.feeder_id === 'GB-1101');
  assert.equal(feeder.peak_demand_mw, 48.5);
  assert.equal(feeder.installed_capacity_mw, 52);
  assert.equal(feeder.utilization_pct, 93.27);
  assert.ok(feeder.interruption_hours_30d > 0);
});

test('citizen complaint provider exposes the complaint schema fields', () => {
  const cmp = providerRegistry.citizenComplaint;
  const c = cmp.relatedTo('gridlock', 'HITEC City / Madhapur')[0];
  assert.ok(c.tracking_id);
  assert.ok(c.description);
  assert.ok(c.locality);
  assert.ok(c.category);
  assert.ok(Number(c.severity_input) > 0);
});

test('authority registry contains the project stakeholders', () => {
  const auth = providerRegistry.authority;
  const codes = auth.all().map((a) => a.code);
  for (const expected of ['HTP', 'GHMC', 'HMDA', 'TSPCB', 'HMWSSB', 'TSSPDCL', 'TSRTC', 'GHMC-SWM']) {
    assert.ok(codes.includes(expected), `missing ${expected}`);
  }
  const tsspdcl = auth.byCode('TSSPDCL');
  assert.ok(tsspdcl.responsibility.includes('Power distribution'));
  assert.ok(tsspdcl.simulated_endpoint.includes('/api/sim/authority/tsspdcl'));
});

test('constraint registry exposes budget, spatial, timeline constraints', () => {
  const cons = providerRegistry.constraint;
  assert.ok(cons.budgetConstraint('GHMC') > 0);
  const types = new Set(cons.all().map((c) => c.type));
  for (const t of ['budget', 'spatial', 'timeline', 'utility', 'land', 'environmental']) {
    assert.ok(types.has(t), `missing constraint type ${t}`);
  }
});