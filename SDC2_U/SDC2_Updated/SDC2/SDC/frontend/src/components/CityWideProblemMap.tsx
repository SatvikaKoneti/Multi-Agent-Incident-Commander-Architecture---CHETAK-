import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ProblemCluster } from '../lib/types';

interface CityWideProblemMapProps {
  clusters: ProblemCluster[];
  selectedClusterId?: string | null;
  onSelectCluster?: (cluster: ProblemCluster) => void;
  height?: number | string;
}

const DEFAULT_HYDERABAD_CENTER: [number, number] = [17.4200, 78.4500]; // Hyderabad Center
const DEFAULT_ZOOM = 11;

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.0 });
  }, [center, zoom, map]);
  return null;
}

function getClusterMarkerIcon(cluster: ProblemCluster, isSelected: boolean) {
  const score = cluster.priority_score;
  let color = '#06b6d4'; // Low - Cyan
  let bgGlow = 'rgba(6, 182, 212, 0.6)';
  if (score >= 75) {
    color = '#ef4444'; // Critical - Red
    bgGlow = 'rgba(239, 68, 68, 0.8)';
  } else if (score >= 60) {
    color = '#f97316'; // High - Orange
    bgGlow = 'rgba(249, 115, 22, 0.8)';
  } else if (score >= 40) {
    color = '#eab308'; // Medium - Yellow
    bgGlow = 'rgba(234, 179, 8, 0.7)';
  }

  const pulseAnimation = score >= 75 ? 'animate-pulse' : '';
  const scale = isSelected ? 'transform: scale(1.25);' : '';

  const html = `
    <div style="position: relative; cursor: pointer; ${scale}">
      <div style="
        width: 34px;
        height: 34px;
        background: radial-gradient(circle at 35% 35%, ${color} 0%, #090d16 100%);
        border: 2px solid ${isSelected ? '#ffffff' : color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 0 16px ${bgGlow}, 0 4px 12px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          font-weight: 800;
          font-size: 11px;
          color: #ffffff;
          font-family: monospace;
        ">
          ${Math.round(score)}
        </div>
      </div>
      <div class="${pulseAnimation}" style="
        position: absolute;
        top: -6px;
        right: -6px;
        background: #0f172a;
        color: ${color};
        border: 1.5px solid ${color};
        border-radius: 9999px;
        padding: 1px 5px;
        font-size: 10px;
        font-weight: 700;
        box-shadow: 0 2px 6px rgba(0,0,0,0.8);
      ">
        ${cluster.report_count}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'city-wide-cluster-pin',
    html,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

export default function CityWideProblemMap({
  clusters,
  selectedClusterId,
  onSelectCluster,
  height = 420,
}: CityWideProblemMapProps) {
  const selectedCluster = clusters.find((c) => c.cluster_id === selectedClusterId);
  const center: [number, number] = selectedCluster
    ? [selectedCluster.lat, selectedCluster.lng]
    : DEFAULT_HYDERABAD_CENTER;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-950 shadow-panel backdrop-blur"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <MapContainer
        center={center}
        zoom={selectedCluster ? 14 : DEFAULT_ZOOM}
        scrollWheelZoom={true}
        wheelPxPerZoomLevel={140}
        wheelDebounceTime={100}
        zoomDelta={0.5}
        zoomSnap={0.5}
        inertia={true}
        inertiaDeceleration={3500}
        inertiaMaxSpeed={1000}
        style={{ height: '100%', width: '100%', background: '#030712' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapRecenter center={center} zoom={selectedCluster ? 14 : DEFAULT_ZOOM} />

        {clusters.map((cluster) => {
          const isSelected = cluster.cluster_id === selectedClusterId;
          const icon = getClusterMarkerIcon(cluster, isSelected);

          return (
            <Marker
              key={cluster.cluster_id}
              position={[cluster.lat, cluster.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectCluster?.(cluster),
              }}
            >
              <Popup className="dark-popup">
                <div className="p-1 space-y-2 max-w-xs text-slate-100">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5">
                    <span className="font-bold text-xs text-cyan-400 font-mono">
                      {cluster.locality_name}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: `${cluster.priority_level.color}20`,
                        color: cluster.priority_level.color,
                        border: `1px solid ${cluster.priority_level.color}40`,
                      }}
                    >
                      Score: {cluster.priority_score.toFixed(0)} ({cluster.priority_level.level})
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-100 leading-snug">
                      {cluster.category} — {cluster.locality_name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {cluster.representative_complaint.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-400 block">Reports</span>
                      <span className="font-semibold text-slate-200">{cluster.report_count} citizen complaints</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">SLA Target</span>
                      <span className={`font-semibold ${cluster.is_overdue ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {cluster.is_overdue ? `OVERDUE (+${cluster.elapsed_hours - cluster.sla_hours}h)` : `${cluster.remaining_hours}h left`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Authority</span>
                      <span className="font-semibold text-amber-300">{cluster.authority_code}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Status</span>
                      <span className="font-semibold uppercase text-slate-300 text-[10px]">{cluster.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectCluster?.(cluster)}
                    className="w-full mt-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-1.5 px-3 rounded-lg text-xs transition shadow-glow flex items-center justify-center gap-1"
                  >
                    View Cluster & Action →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Overlay Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-950/90 border border-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-xs font-bold text-slate-200">
          City-Wide Leaflet Map · {clusters.length} Active Problem Clusters
        </span>
      </div>
    </div>
  );
}
