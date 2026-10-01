import { useCallback, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

export interface LocationMapProps {
  lat?: number | null;
  lng?: number | null;
  onLocationSelect?: (lat: number, lng: number, localityName?: string) => void;
  readOnly?: boolean;
  height?: number | string;
  zoom?: number;
}

// Comprehensive Hyderabad localities with center coordinates
export const HYDERABAD_LOCALITIES = [
  { id: 'osm-hitec-madhapur', name: 'HITEC City / Madhapur', lat: 17.4465, lng: 78.3852 },
  { id: 'osm-gachibowli', name: 'Gachibowli', lat: 17.4401, lng: 78.3489 },
  { id: 'osm-kondapur', name: 'Kondapur', lat: 17.4650, lng: 78.3539 },
  { id: 'osm-kukatpally', name: 'Kukatpally', lat: 17.4948, lng: 78.4126 },
  { id: 'osm-kphb', name: 'KPHB Colony', lat: 17.4938, lng: 78.3995 },
  { id: 'osm-miyapur', name: 'Miyapur', lat: 17.4884, lng: 78.3570 },
  { id: 'osm-nizampet', name: 'Nizampet', lat: 17.5186, lng: 78.3846 },
  { id: 'osm-chandanagar', name: 'Chandanagar', lat: 17.4925, lng: 78.3268 },
  { id: 'osm-hafeezpet', name: 'Hafeezpet', lat: 17.4831, lng: 78.3444 },
  { id: 'osm-nanakramguda', name: 'Financial District / Nanakramguda', lat: 17.4156, lng: 78.3445 },
  { id: 'osm-raidurg', name: 'Raidurg', lat: 17.4299, lng: 78.3789 },
  { id: 'osm-manikonda', name: 'Manikonda', lat: 17.3993, lng: 78.3794 },
  { id: 'osm-jubileehills', name: 'Jubilee Hills', lat: 17.4319, lng: 78.4073 },
  { id: 'osm-banjarahills', name: 'Banjara Hills', lat: 17.4156, lng: 78.4357 },
  { id: 'osm-kokapet', name: 'Kokapet', lat: 17.3888, lng: 78.3297 },
  { id: 'osm-tellapur', name: 'Tellapur', lat: 17.4632, lng: 78.2917 },
  { id: 'osm-lingampally', name: 'Lingampally', lat: 17.4851, lng: 78.3180 },
  { id: 'osm-bachupally', name: 'Bachupally', lat: 17.5372, lng: 78.3683 },
  { id: 'osm-pragathinagar', name: 'Pragathi Nagar', lat: 17.5085, lng: 78.3905 },
  { id: 'osm-begumpet', name: 'Begumpet', lat: 17.4408, lng: 78.4743 },
  { id: 'osm-somajiguda', name: 'Somajiguda', lat: 17.4260, lng: 78.4578 },
  { id: 'osm-panjagutta', name: 'Panjagutta', lat: 17.4265, lng: 78.4516 },
  { id: 'osm-ameerpet', name: 'Ameerpet', lat: 17.4375, lng: 78.4483 },
  { id: 'osm-khairatabad', name: 'Khairatabad', lat: 17.4116, lng: 78.4611 },
  { id: 'osm-lakdikapul', name: 'Lakdikapul', lat: 17.4042, lng: 78.4647 },
  { id: 'osm-abids-koti', name: 'Abids / Koti', lat: 17.3912, lng: 78.4754 },
  { id: 'osm-himayatnagar', name: 'Himayatnagar', lat: 17.4027, lng: 78.4842 },
  { id: 'osm-narayanguda', name: 'Narayanguda', lat: 17.3986, lng: 78.4908 },
  { id: 'osm-domalguda', name: 'Domalguda', lat: 17.4089, lng: 78.4878 },
  { id: 'osm-basheerbagh', name: 'Basheerbagh', lat: 17.4019, lng: 78.4747 },
  { id: 'osm-nampally', name: 'Nampally', lat: 17.3871, lng: 78.4678 },
  { id: 'osm-srnagar', name: 'SR Nagar', lat: 17.4431, lng: 78.4428 },
  { id: 'osm-sanathnagar', name: 'Sanathnagar', lat: 17.4566, lng: 78.4418 },
  { id: 'osm-secunderabad', name: 'Secunderabad', lat: 17.4399, lng: 78.4983 },
  { id: 'osm-marredpally', name: 'Marredpally', lat: 17.4487, lng: 78.5137 },
  { id: 'osm-malkajgiri', name: 'Malkajgiri', lat: 17.4526, lng: 78.5327 },
  { id: 'osm-alwal', name: 'Alwal', lat: 17.5029, lng: 78.5034 },
  { id: 'osm-bowenpally', name: 'Bowenpally', lat: 17.4721, lng: 78.4820 },
  { id: 'osm-trimulgherry', name: 'Trimulgherry', lat: 17.4646, lng: 78.5042 },
  { id: 'osm-sainikpuri', name: 'Sainikpuri', lat: 17.4909, lng: 78.5447 },
  { id: 'osm-bolarum', name: 'Bolarum', lat: 17.5255, lng: 78.5135 },
  { id: 'osm-ecil', name: 'ECIL', lat: 17.4705, lng: 78.5685 },
  { id: 'osm-kompally', name: 'Kompally', lat: 17.5413, lng: 78.4872 },
  { id: 'osm-medchal', name: 'Medchal', lat: 17.6297, lng: 78.4814 },
  { id: 'osm-charminar', name: 'Charminar', lat: 17.3616, lng: 78.4747 },
  { id: 'osm-falaknuma', name: 'Falaknuma', lat: 17.3323, lng: 78.4674 },
  { id: 'osm-bahadurpura', name: 'Bahadurpura', lat: 17.3541, lng: 78.4513 },
  { id: 'osm-chandrayangutta', name: 'Chandrayangutta', lat: 17.3197, lng: 78.4772 },
  { id: 'osm-santoshnagar', name: 'Santosh Nagar', lat: 17.3494, lng: 78.5074 },
  { id: 'osm-malakpet', name: 'Malakpet', lat: 17.3752, lng: 78.4975 },
  { id: 'osm-mehdipatnam', name: 'Mehdipatnam', lat: 17.3917, lng: 78.4398 },
  { id: 'osm-tolichowki', name: 'Tolichowki', lat: 17.4011, lng: 78.4093 },
  { id: 'osm-attapur', name: 'Attapur', lat: 17.3688, lng: 78.4348 },
  { id: 'osm-rajendranagar', name: 'Rajendranagar', lat: 17.3195, lng: 78.4035 },
  { id: 'osm-shamshabad', name: 'Shamshabad', lat: 17.2497, lng: 78.4299 },
  { id: 'osm-amberpet', name: 'Amberpet', lat: 17.3908, lng: 78.5173 },
  { id: 'osm-uppal', name: 'Uppal', lat: 17.4057, lng: 78.5591 },
  { id: 'osm-lbnagar', name: 'LB Nagar', lat: 17.3356, lng: 78.5459 },
  { id: 'osm-dilsukhnagar', name: 'Dilsukhnagar', lat: 17.3697, lng: 78.5499 },
  { id: 'osm-tarnaka', name: 'Tarnaka', lat: 17.4353, lng: 78.5036 },
  { id: 'osm-kothapet', name: 'Kothapet', lat: 17.3703, lng: 78.5367 },
  { id: 'osm-nagole', name: 'Nagole', lat: 17.3758, lng: 78.5619 },
  { id: 'osm-hayathnagar', name: 'Hayathnagar', lat: 17.3235, lng: 78.6046 },
  { id: 'osm-vanasthalipuram', name: 'Vanasthalipuram', lat: 17.3308, lng: 78.5701 },
  { id: 'osm-habsiguda', name: 'Habsiguda', lat: 17.4149, lng: 78.5435 },
  { id: 'osm-nacharam', name: 'Nacharam', lat: 17.4326, lng: 78.5653 },
  { id: 'osm-boduppal', name: 'Boduppal', lat: 17.4173, lng: 78.5839 },
  { id: 'osm-peerzadiguda', name: 'Peerzadiguda', lat: 17.4092, lng: 78.5878 },
  { id: 'osm-ghatkesar', name: 'Ghatkesar', lat: 17.4513, lng: 78.6811 },
];

export function findNearestLocality(lat: number, lng: number): string {
  let nearest = HYDERABAD_LOCALITIES[0];
  let minDistanceSq = Infinity;

  for (const loc of HYDERABAD_LOCALITIES) {
    const dLat = loc.lat - lat;
    const dLng = loc.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      nearest = loc;
    }
  }

  return nearest.name;
}

// Custom dark futuristic pin marker for Hyderabad map
const customMarkerIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `<div style="
    width: 30px;
    height: 30px;
    background: radial-gradient(circle at 35% 35%, #38bdf8 0%, #0284c7 70%, #0369a1 100%);
    border: 2px solid #ffffff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.8), 0 4px 10px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      width: 10px;
      height: 10px;
      background: #030712;
      border-radius: 50%;
      box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.8);
    "></div>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

const DEFAULT_CENTER: [number, number] = [17.385, 78.4867]; // Hyderabad Center
const DEFAULT_ZOOM = 12;

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

function MapEventsHandler({ onSelect, readOnly }: { onSelect?: (lat: number, lng: number) => void; readOnly?: boolean }) {
  useMapEvents({
    click(e) {
      if (readOnly || !onSelect) return;
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function ComplaintLocationMap({
  lat,
  lng,
  onLocationSelect,
  readOnly = false,
  height = 320,
  zoom = DEFAULT_ZOOM,
}: LocationMapProps) {
  const markerRef = useRef<L.Marker | null>(null);

  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  const position: [number, number] = hasCoords ? [lat, lng] : DEFAULT_CENTER;

  const handleSelect = useCallback(
    (newLat: number, newLng: number) => {
      if (readOnly || !onLocationSelect) return;
      const roundedLat = Number(newLat.toFixed(6));
      const roundedLng = Number(newLng.toFixed(6));
      const locality = findNearestLocality(roundedLat, roundedLng);
      onLocationSelect(roundedLat, roundedLng, locality);
    },
    [readOnly, onLocationSelect],
  );

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          handleSelect(newPos.lat, newPos.lng);
        }
      },
    }),
    [handleSelect],
  );

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-cyan-400/20 shadow-panel backdrop-blur"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <MapContainer
        center={position}
        zoom={hasCoords ? 14 : zoom}
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

        <MapRecenter center={position} zoom={hasCoords ? 14 : zoom} />
        <MapEventsHandler onSelect={handleSelect} readOnly={readOnly} />

        {hasCoords ? (
          <Marker
            position={position}
            icon={customMarkerIcon}
            draggable={!readOnly}
            eventHandlers={eventHandlers}
            ref={markerRef}
          >
            <Popup className="dark-popup">
              <div className="text-xs font-semibold text-slate-900">
                <p className="font-bold text-cyan-700">{findNearestLocality(lat!, lng!)}</p>
                <p className="font-mono text-[11px] text-slate-600">
                  {lat!.toFixed(6)}, {lng!.toFixed(6)}
                </p>
                {!readOnly ? <p className="mt-1 text-[10px] text-slate-500">Drag pin to refine location</p> : null}
              </div>
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>

      {!readOnly && !hasCoords ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[1000] flex justify-center">
          <span className="rounded-xl border border-cyan-400/30 bg-ink-950/90 px-3 py-1.5 text-xs font-semibold text-cyan-300 shadow-glow backdrop-blur">
            📍 Click map to set complaint location
          </span>
        </div>
      ) : null}
    </div>
  );
}
