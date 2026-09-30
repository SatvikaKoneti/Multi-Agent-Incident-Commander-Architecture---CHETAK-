import { OSMDataProvider, LiveOSMDataProvider } from './osm.js';
import { UrbanObservatoryDataProvider, LiveUrbanObservatoryDataProvider } from './urbanObservatory.js';
import { AirQualityDataProvider, LiveAirQualityDataProvider } from './airQuality.js';
import { CostDataProvider, LiveCostDataProvider } from './cost.js';
import { EnergyDataProvider, LiveEnergyDataProvider } from './energy.js';
import { CitizenComplaintDataProvider, LiveCitizenComplaintDataProvider } from './citizenComplaint.js';
import { AuthorityDataProvider, LiveAuthorityDataProvider } from './authority.js';
import { ConstraintDataProvider, LiveConstraintDataProvider } from './constraints.js';
import { AuthorityContactDataProvider } from './authorityContact.js';

/**
 * Provider registry. Demo implementations are used by default so the system
 * runs fully offline. Swap in the Live* implementations (or your own classes
 * implementing the same interface) to use real sources.
 */
function buildDemoRegistry() {
  return {
    osm: new OSMDataProvider(),
    urbanObservatory: new UrbanObservatoryDataProvider(),
    airQuality: new AirQualityDataProvider(),
    cost: new CostDataProvider(),
    energy: new EnergyDataProvider(),
    citizenComplaint: new CitizenComplaintDataProvider(),
    authority: new AuthorityDataProvider(),
    authorityContact: new AuthorityContactDataProvider(),
    constraint: new ConstraintDataProvider(),
  };
}

function buildLiveRegistry() {
  return {
    osm: new LiveOSMDataProvider(),
    urbanObservatory: new LiveUrbanObservatoryDataProvider(),
    airQuality: new LiveAirQualityDataProvider(),
    cost: new LiveCostDataProvider(),
    energy: new LiveEnergyDataProvider(),
    citizenComplaint: new LiveCitizenComplaintDataProvider(),
    authority: new LiveAuthorityDataProvider(),
    authorityContact: new AuthorityContactDataProvider(),
    constraint: new LiveConstraintDataProvider(),
  };
}

export const providerRegistry = buildDemoRegistry();

export const PROVIDER_NAMES = [
  'osm',
  'urbanObservatory',
  'airQuality',
  'cost',
  'energy',
  'citizenComplaint',
  'authority',
  'authorityContact',
  'constraint',
];

export function resetProviders() {
  Object.assign(providerRegistry, buildDemoRegistry());
}

export function providerStatus() {
  return Object.fromEntries(
    Object.entries(providerRegistry).map(([k, p]) => [
      k,
      { name: p.meta?.sourceLabel || k, isDemo: typeof p.isDemo === 'function' ? p.isDemo() : true },
    ]),
  );
}