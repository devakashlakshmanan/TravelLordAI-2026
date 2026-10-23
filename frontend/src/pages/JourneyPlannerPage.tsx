import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Navigation, Compass, Calendar, Clock, Car, Bike, AlertTriangle,
  ArrowRight, Shield, CheckCircle2, AlertCircle, RefreshCw, Layers,
  ArrowUpDown, MapPin, Locate
} from 'lucide-react';
import { api } from '../services/api';
import { GeocodeItem, RouteAnalysis } from '../types';
import { InteractiveMap } from '../components/InteractiveMap';
import { RiskBadge } from '../components/RiskBadge';

const POPULAR_CORRIDORS = [
  { name: 'Mumbai → Pune (Western Corridor)', origin: 'Mumbai, Maharashtra, India', dest: 'Pune, Maharashtra, India' },
  { name: 'Bengaluru → Chennai (Southern Corridor)', origin: 'Bengaluru, Karnataka, India', dest: 'Chennai, Tamil Nadu, India' },
  { name: 'Delhi → Jaipur (NH-48 Golden Quadrilateral)', origin: 'New Delhi, Delhi, India', dest: 'Jaipur, Rajasthan, India' },
  { name: 'Kolkata → Darjeeling (Eastern Hill Corridor)', origin: 'Kolkata, West Bengal, India', dest: 'Darjeeling, West Bengal, India' },
  { name: 'Guwahati → Shillong (Northeast Highway)', origin: 'Guwahati, Assam, India', dest: 'Shillong, Meghalaya, India' },
  { name: 'Kochi → Munnar (Ghat Road Corridor)', origin: 'Kochi, Kerala, India', dest: 'Munnar, Kerala, India' },
];

export const JourneyPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Inputs
  const [originQuery, setOriginQuery] = useState(searchParams.get('origin') || '');
  const [destQuery, setDestQuery] = useState(searchParams.get('destination') || '');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [travelMode, setTravelMode] = useState('driving');
  const [departureTime, setDepartureTime] = useState(new Date().toISOString().slice(0, 16));
  const [avoidClosures, setAvoidClosures] = useState(true);

  // Suggestions state
  const [originSuggestions, setOriginSuggestions] = useState<GeocodeItem[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<GeocodeItem[]>([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState<'origin' | 'dest' | null>(null);

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        originRef.current && !originRef.current.contains(target) &&
        destRef.current && !destRef.current.contains(target)
      ) {
        setActiveSuggestionField(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveSuggestionField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // State
  const [loading, setLoading] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RouteAnalysis | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Pre-resolve initial coordinates if passed via URL parameters
  useEffect(() => {
    const initFromParams = async () => {
      const origParam = searchParams.get('origin');
      const destParam = searchParams.get('destination');

      if (origParam && !originCoords) {
        try {
          const res = await api.geocode(origParam);
          if (res && res.length > 0) {
            setOriginCoords({ lat: res[0].lat, lon: res[0].lon });
          }
        } catch (e) {
          console.error('Failed to geocode initial origin', e);
        }
      }

      if (destParam && !destCoords) {
        try {
          const res = await api.geocode(destParam);
          if (res && res.length > 0) {
            setDestCoords({ lat: res[0].lat, lon: res[0].lon });
          }
        } catch (e) {
          console.error('Failed to geocode initial destination', e);
        }
      }
    };
    initFromParams();
  }, [searchParams]);

  // Autocomplete fetcher with debounce
  useEffect(() => {
    if (activeSuggestionField !== 'origin' || originQuery.trim().length < 2) {
      setOriginSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.geocode(originQuery);
        setOriginSuggestions(res);
      } catch (err) {
        setOriginSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [originQuery, activeSuggestionField]);

  useEffect(() => {
    if (activeSuggestionField !== 'dest' || destQuery.trim().length < 2) {
      setDestSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.geocode(destQuery);
        setDestSuggestions(res);
      } catch (err) {
        setDestSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [destQuery, activeSuggestionField]);

  // Coordinate Regex Parser
  const parseDirectCoordinates = (query: string): { lat: number; lon: number } | null => {
    const match = query.match(/^\s*\(?\s*([+-]?\d+(?:\.\d+)?)\s*[,;\s]\s*([+-]?\d+(?:\.\d+)?)\s*\)?\s*$/);
    if (!match) return null;
    const v1 = parseFloat(match[1]);
    const v2 = parseFloat(match[2]);
    if (v1 >= 6.0 && v1 <= 38.0 && v2 >= 68.0 && v2 <= 98.0) {
      return { lat: v1, lon: v2 };
    }
    if (v2 >= 6.0 && v2 <= 38.0 && v1 >= 68.0 && v1 <= 98.0) {
      return { lat: v2, lon: v1 };
    }
    if (v1 >= -90.0 && v1 <= 90.0 && v2 >= -180.0 && v2 <= 180.0) {
      return { lat: v1, lon: v2 };
    }
    return null;
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let activeOriginCoords = originCoords;
    let activeDestCoords = destCoords;

    // Check direct coordinate parse for origin
    if (!activeOriginCoords && originQuery.trim()) {
      const parsed = parseDirectCoordinates(originQuery);
      if (parsed) {
        activeOriginCoords = parsed;
        setOriginCoords(parsed);
      } else {
        // Attempt quick resolution from geocode
        try {
          const res = await api.geocode(originQuery);
          if (res && res.length > 0) {
            activeOriginCoords = { lat: res[0].lat, lon: res[0].lon };
            setOriginCoords(activeOriginCoords);
          }
        } catch {
          // ignore
        }
      }
    }

    // Check direct coordinate parse for destination
    if (!activeDestCoords && destQuery.trim()) {
      const parsed = parseDirectCoordinates(destQuery);
      if (parsed) {
        activeDestCoords = parsed;
        setDestCoords(parsed);
      } else {
        // Attempt quick resolution from geocode
        try {
          const res = await api.geocode(destQuery);
          if (res && res.length > 0) {
            activeDestCoords = { lat: res[0].lat, lon: res[0].lon };
            setDestCoords(activeDestCoords);
          }
        } catch {
          // ignore
        }
      }
    }

    if (!activeOriginCoords) {
      setError('Please select or specify a valid origin location or coordinates.');
      return;
    }
    if (!activeDestCoords) {
      setError('Please select or specify a valid destination location or coordinates.');
      return;
    }

    // Check if origin and destination are identical
    if (
      Math.abs(activeOriginCoords.lat - activeDestCoords.lat) < 0.0001 &&
      Math.abs(activeOriginCoords.lon - activeDestCoords.lon) < 0.0001
    ) {
      setError('Origin and destination cannot be at the exact same location. Please select distinct locations.');
      return;
    }

    setLoading(true);
    setAnalysisResult(null);

    try {
      const res = await api.analyzeRoute({
        origin_label: originQuery || `${activeOriginCoords.lat.toFixed(4)}, ${activeOriginCoords.lon.toFixed(4)}`,
        origin_lat: activeOriginCoords.lat,
        origin_lon: activeOriginCoords.lon,
        destination_label: destQuery || `${activeDestCoords.lat.toFixed(4)}, ${activeDestCoords.lon.toFixed(4)}`,
        destination_lat: activeDestCoords.lat,
        destination_lon: activeDestCoords.lon,
        travel_mode: travelMode,
      });
      setAnalysisResult(res);
      setSelectedRouteIndex(0);
    } catch (err: any) {
      setError(err.message || 'Route analysis failed. Please verify that both locations are accessible by road network.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrigin = (item: GeocodeItem) => {
    setOriginQuery(item.display_name);
    setOriginCoords({ lat: item.lat, lon: item.lon });
    setOriginSuggestions([]);
    setActiveSuggestionField(null);
  };

  const handleSelectDest = (item: GeocodeItem) => {
    setDestQuery(item.display_name);
    setDestCoords({ lat: item.lat, lon: item.lon });
    setDestSuggestions([]);
    setActiveSuggestionField(null);
  };

  const handleSwap = () => {
    const prevOriginQuery = originQuery;
    const prevOriginCoords = originCoords;
    setOriginQuery(destQuery);
    setOriginCoords(destCoords);
    setDestQuery(prevOriginQuery);
    setDestCoords(prevOriginCoords);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setOriginCoords({ lat: latitude, lon: longitude });
        try {
          const rev = await api.reverseGeocode(latitude, longitude);
          if (rev) {
            setOriginQuery(rev.display_name);
          } else {
            setOriginQuery(`Coordinates: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
          }
        } catch {
          setOriginQuery(`Coordinates: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
        } finally {
          setLocatingUser(false);
        }
      },
      (err) => {
        setLocatingUser(false);
        setError(`Unable to retrieve GPS location: ${err.message}. Please enter starting location manually.`);
      },
      { timeout: 8000 }
    );
  };

  const handleApplyPopularCorridor = async (corridor: typeof POPULAR_CORRIDORS[0]) => {
    setOriginQuery(corridor.origin);
    setDestQuery(corridor.dest);
    setError(null);
    try {
      const [resOrig, resDest] = await Promise.all([
        api.geocode(corridor.origin),
        api.geocode(corridor.dest),
      ]);
      if (resOrig.length > 0) setOriginCoords({ lat: resOrig[0].lat, lon: resOrig[0].lon });
      if (resDest.length > 0) setDestCoords({ lat: resDest[0].lat, lon: resDest[0].lon });
    } catch (e) {
      console.error('Failed to load popular corridor', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal uppercase tracking-wider mb-1">
          <Navigation className="w-4 h-4" />
          Nationwide Route Risk Intelligence
        </div>
        <h1 className="font-heading font-extrabold text-3xl text-navy-900">
          Pan-India Journey Risk Planner
        </h1>
        <p className="text-sm text-slateText max-w-3xl mt-1">
          Plan journeys across any supported Indian state, city, town, hill pass, or interstate highway corridor.
          Analyzes real-time IMD meteorology, CWC river flood warnings, GSI landslide susceptibility, and official road closures.
        </p>
      </div>

      {/* Popular Corridor Quick-Select Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Quick-Explore Indian Corridors:
        </span>
        <div className="flex flex-wrap gap-2">
          {POPULAR_CORRIDORS.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyPopularCorridor(c)}
              className="text-xs px-3 py-1.5 bg-white hover:bg-teal/10 hover:text-teal hover:border-teal text-slate-700 font-semibold rounded-lg border border-slate-200 transition-all shadow-sm"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form + Results/Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-card border border-slate-200 space-y-5">
          <form onSubmit={handleAnalyze} className="space-y-4">
            {/* Origin */}
            <div ref={originRef} className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Origin (Starting Point)
                </label>
                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={locatingUser}
                  className="text-[11px] text-teal hover:underline font-bold flex items-center gap-1"
                >
                  <Locate className={`w-3.5 h-3.5 ${locatingUser ? 'animate-spin' : ''}`} />
                  <span>{locatingUser ? 'Locating...' : 'Use My GPS'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal focus-within:bg-white transition-all">
                <Navigation className="w-4 h-4 text-teal flex-shrink-0" />
                <input
                  type="text"
                  required
                  value={originQuery}
                  onFocus={() => setActiveSuggestionField('origin')}
                  onChange={(e) => {
                    setOriginQuery(e.target.value);
                    setOriginCoords(null);
                    setActiveSuggestionField('origin');
                  }}
                  placeholder="City, town, landmark, or lat, lon..."
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none text-navy-900 placeholder:text-slate-400"
                />
              </div>

              {/* Suggestions Dropdown */}
              {activeSuggestionField === 'origin' && originSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                  {originSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOrigin(item)}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-navy-900 hover:bg-teal/10 hover:text-teal font-medium border-b border-slate-100 last:border-0"
                    >
                      {item.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap Origin and Destination"
                className="p-1.5 rounded-full bg-slate-100 hover:bg-teal/15 hover:text-teal text-slate-500 border border-slate-200 transition-all shadow-sm"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* Destination */}
            <div ref={destRef} className="relative">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Destination
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal focus-within:bg-white transition-all">
                <Compass className="w-4 h-4 text-mint-dark flex-shrink-0" />
                <input
                  type="text"
                  required
                  value={destQuery}
                  onFocus={() => setActiveSuggestionField('dest')}
                  onChange={(e) => {
                    setDestQuery(e.target.value);
                    setDestCoords(null);
                    setActiveSuggestionField('dest');
                  }}
                  placeholder="Destination city, town, or coordinates..."
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none text-navy-900 placeholder:text-slate-400"
                />
              </div>

              {/* Suggestions Dropdown */}
              {activeSuggestionField === 'dest' && destSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                  {destSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDest(item)}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-navy-900 hover:bg-teal/10 hover:text-teal font-medium border-b border-slate-100 last:border-0"
                    >
                      {item.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mode & Departure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Travel Mode
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTravelMode('driving')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                      travelMode === 'driving' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    Car / 4W
                  </button>
                  <button
                    type="button"
                    onClick={() => setTravelMode('motorcycle')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                      travelMode === 'motorcycle' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5" />
                    2-Wheeler
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Departure Time
                </label>
                <input
                  type="datetime-local"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-medium text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal"
                />
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={avoidClosures}
                  onChange={(e) => setAvoidClosures(e.target.checked)}
                  className="rounded accent-teal"
                />
                <span>Penalize known official highway closures & alerts</span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-alertRed flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-teal hover:bg-teal-dark disabled:opacity-75 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Nationwide Corridor Hazards...</span>
                </>
              ) : (
                <>
                  <span>Analyze Route Threats</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Route Summary if analyzed */}
          {analysisResult && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Corridor Risk Index
                </span>
                <RiskBadge
                  level={analysisResult.overall_risk_level}
                  score={analysisResult.overall_risk_index}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Driving Distance:</span>
                  <div className="font-bold text-navy-900 text-sm">
                    {roundKm(analysisResult.distance_meters)} km
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Estimated Duration:</span>
                  <div className="font-bold text-navy-900 text-sm">
                    {formatDuration(analysisResult.duration_seconds)}
                  </div>
                </div>
              </div>

              {/* Strict Disclaimer Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-950 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <span>
                  {analysisResult.disclaimer}
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/dashboard/${analysisResult.analysis_id}`)}
                className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Full Split-Screen Risk Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Map & Alternative Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <InteractiveMap
            routePolyline={
              analysisResult
                ? selectedRouteIndex === 0
                  ? analysisResult.geometry
                  : analysisResult.alternatives[selectedRouteIndex - 1]?.geometry
                : undefined
            }
            alternativePolylines={
              analysisResult
                ? analysisResult.alternatives.map((alt) => ({
                    name: alt.name,
                    geometry: alt.geometry,
                  }))
                : []
            }
            segments={selectedRouteIndex === 0 && analysisResult ? analysisResult.segments : []}
            height="520px"
          />

          {/* Alternatives Trade-off Comparison Bar */}
          {analysisResult && analysisResult.alternatives.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-3">
              <div className="flex items-center gap-1.5 font-heading font-bold text-sm text-navy-900">
                <Layers className="w-4 h-4 text-teal" />
                <span>Alternative Route Comparison & Trade-Offs</span>
              </div>

              <div className="space-y-2">
                {/* Primary Route Tab */}
                <div
                  onClick={() => setSelectedRouteIndex(0)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRouteIndex === 0
                      ? 'border-teal bg-teal/5 ring-1 ring-teal'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-navy-900">Primary Highway Route (Recommended)</span>
                    <RiskBadge level={analysisResult.overall_risk_level} score={analysisResult.overall_risk_index} />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {roundKm(analysisResult.distance_meters)} km • {formatDuration(analysisResult.duration_seconds)} • {analysisResult.intersecting_incidents.length} known threats within buffer
                  </div>
                </div>

                {/* Alternative Routes */}
                {analysisResult.alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedRouteIndex(idx + 1)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRouteIndex === idx + 1
                        ? 'border-teal bg-teal/5 ring-1 ring-teal'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-navy-900">{alt.name}</span>
                      <RiskBadge level={alt.risk_level as any} score={alt.risk_index} />
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 leading-normal">
                      {alt.trade_off_explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function roundKm(meters: number): number {
  return Math.round(meters / 1000);
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs === 0) return `${mins} mins`;
  return `${hrs}h ${mins}m`;
}
