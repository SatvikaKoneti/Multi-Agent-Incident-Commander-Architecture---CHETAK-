import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Locality } from '../lib/types';
import { formatNum } from '../lib/format';

interface MapViewProps {
  localities: Locality[];
  selected?: string | null;
  onSelect?: (id: string) => void;
  height?: number | string;
}

const DEFAULT_CENTER: [number, number] = [17.4200, 78.4700]; // Hyderabad Center
const DEFAULT_ZOOM = 11;

function MapBoundsController({ localities, selected }: { localities: Locality[]; selected?: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!localities || localities.length === 0) return;

    if (selected) {
      const target = localities.find((l) => l.id === selected);
      if (target && target.lat && target.lng) {
        map.flyTo([target.lat, target.lng], 14, { duration: 1.2 });
        return;
      }
    }

    const validCoords = localities
      .filter((l) => typeof l.lat === 'number' && typeof l.lng === 'number' && !isNaN(l.lat) && !isNaN(l.lng))
      .map((l) => [l.lat, l.lng] as [number, number]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [localities, selected, map]);

  return null;
}

function createLocalityMarkerIcon(isSelected: boolean) {
  const color = isSelected ? '#38bdf8' : '#22d3ee';
  const size = isSelected ? 24 : 18;
  const pulse = isSelected
    ? `<span style="position: absolute; inset: -6px; border-radius: 9999px; background: rgba(56, 189, 248, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
    : '';

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
      ${pulse}
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 9999px;
        background: radial-gradient(circle at 35% 35%, ${color} 0%, #061224 100%);
        border: 2px solid ${isSelected ? '#ffffff' : color};
        box-shadow: 0 0 ${isSelected ? '14px' : '8px'} ${color}, 0 2px 6px rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 5px; height: 5px; border-radius: 9999px; background: #ffffff;"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'locality-marker-pin',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function MapView({
  localities,
  selected,
  onSelect,
  height = 420,
}: MapViewProps) {
  const defaultIcon = useMemo(() => createLocalityMarkerIcon(false), []);
  const selectedIcon = useMemo(() => createLocalityMarkerIcon(true), []);

  const validLocalities = useMemo(() => {
    return (localities || []).filter(
      (l) => typeof l.lat === 'number' && typeof l.lng === 'number' && !isNaN(l.lat) && !isNaN(l.lng)
    );
  }, [localities]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-950 shadow-panel"
      style={{ height: typeof height === 'number' ? `${height}px` : height, minHeight: 360 }}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        wheelPxPerZoomLevel={140}
        wheelDebounceTime={100}
        zoomDelta={0.5}
        zoomSnap={0.5}
        inertia={true}
        inertiaDeceleration={3500}
        inertiaMaxSpeed={1000}
        style={{ height: '100%', width: '100%', background: '#0a101f' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        <MapBoundsController localities={validLocalities} selected={selected} />

        {validLocalities.map((loc) => {
          const isSelected = loc.id === selected;
          return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={isSelected ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: () => onSelect?.(loc.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95} className="locality-tooltip">
                <span className="font-semibold text-xs text-slate-900">{loc.name}</span>
                <span className="block text-[10px] text-slate-500 font-mono">
                  {formatNum(loc.population)} ppl
                </span>
              </Tooltip>

              <Popup className="dark-popup">
                <div className="p-1 space-y-2 text-slate-100 max-w-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5 gap-2">
                    <h4 className="font-bold text-sm text-cyan-300">{loc.name}</h4>
                    <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                      {loc.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-ink-900/80 p-2 border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Population</p>
                      <p className="text-sm font-bold text-slate-100 mt-0.5 font-mono">{formatNum(loc.population)}</p>
                    </div>
                    <div className="rounded-lg bg-ink-900/80 p-2 border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Area</p>
                      <p className="text-sm font-bold text-slate-100 mt-0.5 font-mono">{loc.area_sqkm} km²</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Coordinates: <span className="font-mono text-cyan-400">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
                  </div>

                  <button
                    onClick={() => onSelect?.(loc.id)}
                    className="w-full mt-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-ink-950 font-bold text-xs py-2 px-3 transition shadow-glow flex items-center justify-center gap-1.5"
                  >
                    Open Locality Intelligence &rarr;
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}