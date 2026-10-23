import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Incident, SegmentRisk } from '../types';
import { RiskBadge } from './RiskBadge';
import { ExternalLink, Layers, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fix Leaflet default icon issues in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Category-specific SVG marker generator
const createCategoryIcon = (category: string, isSample: boolean, severity: string) => {
  let bgColor = '#147D75'; // default teal
  let symbol = '⚠️';

  if (isSample) {
    bgColor = '#7C3AED'; // purple for sample
    symbol = '🧪';
  } else if (category === 'weather') {
    bgColor = '#0284C7'; // sky blue
    symbol = '🌧️';
  } else if (category === 'landslide') {
    bgColor = '#D97706'; // amber
    symbol = '⛰️';
  } else if (category === 'wildlife') {
    bgColor = '#059669'; // forest green
    symbol = '🐾';
  } else if (category === 'social_disruption' || category === 'road_infrastructure') {
    bgColor = '#DC2626'; // red
    symbol = '🛑';
  }

  const html = `
    <div style="
      background-color: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">
      <span style="transform: rotate(45deg); font-size: 14px;">${symbol}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-hazard-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to dynamically fit map bounds to route or selected points
const MapBoundsAdjuster: React.FC<{
  polyline?: [number, number][];
  center?: [number, number];
  zoom?: number;
}> = ({ polyline, center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (polyline && polyline.length > 1) {
      const latLngs = polyline.map(([lon, lat]) => [lat, lon] as [number, number]);
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (center) {
      map.setView(center, zoom || 6);
    }
  }, [map, polyline, center, zoom]);

  return null;
};

interface InteractiveMapProps {
  incidents?: Incident[];
  routePolyline?: [number, number][]; // [[lon, lat], ...]
  alternativePolylines?: { name: string; geometry: [number, number][] }[];
  segments?: SegmentRisk[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  selectedIncidentId?: string | null;
  onSelectIncident?: (id: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  incidents = [],
  routePolyline,
  alternativePolylines = [],
  segments = [],
  center = [22.5, 79.5],
  zoom = 5,
  height = '500px',
  selectedIncidentId,
  onSelectIncident,
}) => {
  // Layer visibility toggles
  const [showWeather, setShowWeather] = useState(true);
  const [showLandslide, setShowLandslide] = useState(true);
  const [showWildlife, setShowWildlife] = useState(true);
  const [showRoadDisruptions, setShowRoadDisruptions] = useState(true);
  const [showBuffers, setShowBuffers] = useState(false);
  const [layersExpandedMobile, setLayersExpandedMobile] = useState(false);

  // Filtered incidents by layer toggle
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (inc.hazard_category === 'weather' && !showWeather) return false;
      if (inc.hazard_category === 'landslide' && !showLandslide) return false;
      if (inc.hazard_category === 'wildlife' && !showWildlife) return false;
      if (
        (inc.hazard_category === 'social_disruption' || inc.hazard_category === 'road_infrastructure') &&
        !showRoadDisruptions
      ) {
        return false;
      }
      return true;
    });
  }, [incidents, showWeather, showLandslide, showWildlife, showRoadDisruptions]);

  // Convert GeoJSON route polyline [lon, lat] to Leaflet [lat, lon]
  const primaryLatLngs = useMemo(() => {
    if (!routePolyline) return [];
    return routePolyline.map(([lon, lat]) => [lat, lon] as [number, number]);
  }, [routePolyline]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-card border border-slate-200" style={{ height }}>
      {/* Layer Controls Pill */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl shadow-card border border-slate-200 text-xs text-navy-900 max-w-[calc(100vw-3rem)]">
        <button
          type="button"
          onClick={() => setLayersExpandedMobile((prev) => !prev)}
          className="w-full flex items-center justify-between gap-2 font-bold text-slate-800 sm:cursor-default"
          aria-expanded={layersExpandedMobile}
          aria-label="Toggle threat layers filter"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal" />
            <span>Threat Layers</span>
          </div>
          <span className="text-[10px] sm:hidden text-teal font-semibold">
            {layersExpandedMobile ? 'Hide' : 'Show'}
          </span>
        </button>
        <div className={`mt-2 flex-col gap-1.5 font-medium ${layersExpandedMobile ? 'flex' : 'hidden sm:flex'}`}>
          <label className="flex items-center gap-2 cursor-pointer hover:text-teal text-[11px] sm:text-xs">
            <input
              type="checkbox"
              checked={showWeather}
              onChange={(e) => setShowWeather(e.target.checked)}
              className="accent-teal rounded"
            />
            <span>Meteorological (IMD)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-teal text-[11px] sm:text-xs">
            <input
              type="checkbox"
              checked={showLandslide}
              onChange={(e) => setShowLandslide(e.target.checked)}
              className="accent-teal rounded"
            />
            <span>Landslides & Slopes (GSI)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-teal text-[11px] sm:text-xs">
            <input
              type="checkbox"
              checked={showWildlife}
              onChange={(e) => setShowWildlife(e.target.checked)}
              className="accent-teal rounded"
            />
            <span>Wildlife Corridors</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-teal text-[11px] sm:text-xs">
            <input
              type="checkbox"
              checked={showRoadDisruptions}
              onChange={(e) => setShowRoadDisruptions(e.target.checked)}
              className="accent-teal rounded"
            />
            <span>Roadblocks & Disruptions</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-teal pt-1 border-t border-slate-100 text-[10px] sm:text-[11px] text-slateText">
            <input
              type="checkbox"
              checked={showBuffers}
              onChange={(e) => setShowBuffers(e.target.checked)}
              className="accent-teal rounded"
            />
            <span>Show Hazard Buffer Radii</span>
          </label>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-card border border-slate-200 text-[11px] text-navy-900 hidden sm:block">
        <div className="font-bold text-slate-700 mb-1">Map Legend</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span>Weather</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Landslide</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Wildlife</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Disruption</span>
          </div>
        </div>
      </div>

      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsAdjuster polyline={routePolyline} center={center} zoom={zoom} />

        {/* Alternative Routes Polylines (Dashed Slate) */}
        {alternativePolylines.map((alt, idx) => {
          const altLatLngs = alt.geometry.map(([lon, lat]) => [lat, lon] as [number, number]);
          return (
            <Polyline
              key={`alt-${idx}`}
              positions={altLatLngs}
              pathOptions={{
                color: '#64748B',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.7,
              }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold text-slate-800">{alt.name}</div>
                  <div className="text-slate-500">Alternative Corridor</div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Primary Route Polyline (Travel Teal) */}
        {primaryLatLngs.length > 0 && (
          <Polyline
            positions={primaryLatLngs}
            pathOptions={{
              color: '#147D75',
              weight: 5,
              opacity: 0.9,
            }}
          />
        )}

        {/* Route Segment Colors if available */}
        {segments.map((seg) => {
          let segColor = '#16794B'; // green for low
          if (seg.risk_level === 'moderate') segColor = '#B45309'; // amber
          if (seg.risk_level === 'high' || seg.risk_level === 'critical') segColor = '#B42318'; // red

          return (
            <Polyline
              key={`seg-${seg.segment_index}`}
              positions={[
                [seg.start_lat, seg.start_lon],
                [seg.end_lat, seg.end_lon],
              ]}
              pathOptions={{
                color: segColor,
                weight: 7,
                opacity: 0.85,
              }}
            >
              <Popup>
                <div className="text-xs p-1">
                  <div className="font-bold">Segment #{seg.segment_index + 1}</div>
                  <RiskBadge level={seg.risk_level} score={seg.risk_index} />
                  <div className="mt-1 text-slate-600">Threats in corridor: {seg.threats.length}</div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Hazard Markers */}
        {filteredIncidents.map((inc) => {
          const icon = createCategoryIcon(inc.hazard_category, inc.is_sample_data, inc.platform_severity);
          return (
            <React.Fragment key={inc.id}>
              {/* Optional Buffer Circle */}
              {showBuffers && (
                <Circle
                  center={[inc.latitude, inc.longitude]}
                  radius={inc.affected_radius_meters}
                  pathOptions={{
                    color: inc.hazard_category === 'landslide' ? '#D97706' : '#147D75',
                    fillColor: inc.hazard_category === 'landslide' ? '#F59E0B' : '#147D75',
                    fillOpacity: 0.15,
                    weight: 1,
                  }}
                />
              )}

              <Marker
                position={[inc.latitude, inc.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onSelectIncident) onSelectIncident(inc.id);
                  },
                }}
              >
                <Popup>
                  <div className="text-xs p-1 max-w-[240px]">
                    <div className="font-bold text-navy-900 leading-snug mb-1">{inc.title}</div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <RiskBadge level={inc.platform_severity} />
                      <RiskBadge verification={inc.verification_status} isSample={inc.is_sample_data} />
                    </div>
                    <p className="text-slateText text-[11px] line-clamp-3 mb-2">{inc.description}</p>
                    <div className="text-[10px] text-slate-500 mb-2">
                      Source: <span className="font-semibold text-slate-700">{inc.source_name}</span>
                    </div>
                    {inc.fuzzed_coordinates && (
                      <div className="text-[10px] text-amber-700 font-semibold mb-2">
                        🛡️ Fuzzed coordinates for anti-poaching compliance
                      </div>
                    )}
                    <Link
                      to={`/incidents/${inc.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal hover:underline"
                    >
                      Inspect Evidence Dossier <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
