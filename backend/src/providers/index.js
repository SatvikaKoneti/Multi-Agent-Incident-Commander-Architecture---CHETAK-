import { OSMDataProvider, LiveOSMDataProvider } from './openStreetMapTopologyProvider.js';
import { UrbanObservatoryDataProvider, LiveUrbanObservatoryDataProvider } from './urbanObservatoryTelemetryProvider.js';
import { AirQualityDataProvider, LiveAirQualityDataProvider } from './airQualityTelemetryProvider.js';
import { CostDataProvider, LiveCostDataProvider } from './financialCostEstimatorProvider.js';
import { EnergyDataProvider, LiveEnergyDataProvider } from './smartGridEnergyTelemetryProvider.js';
import { CitizenComplaintDataProvider, LiveCitizenComplaintDataProvider } from './citizenComplaintTelemetryProvider.js';
import { AuthorityDataProvider, LiveAuthorityDataProvider } from './municipalAuthorityTelemetryProvider.js';
import { ConstraintDataProvider, LiveConstraintDataProvider } from './systemConstraintsTelemetryProvider.js';
import { AuthorityContactDataProvider } from './authorityContactRegistryProvider.js';

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
