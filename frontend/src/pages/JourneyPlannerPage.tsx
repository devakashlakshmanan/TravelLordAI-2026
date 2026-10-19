import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Navigation, Compass, Calendar, Clock, Car, Bike, AlertTriangle,
  ArrowRight, Shield, CheckCircle2, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { GeocodeItem, RouteAnalysis } from '../types';
import { InteractiveMap } from '../components/InteractiveMap';
import { RiskBadge } from '../components/RiskBadge';

export const JourneyPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Inputs
  const [originQuery, setOriginQuery] = useState(searchParams.get('origin') || 'New Delhi, Delhi, India');
  const [destQuery, setDestQuery] = useState(searchParams.get('destination') || 'Manali, Himachal Pradesh, India');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lon: number } | null>({ lat: 28.6139, lon: 77.2090 });
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number } | null>({ lat: 32.2396, lon: 77.1887 });
  const [travelMode, setTravelMode] = useState('driving');
  const [departureTime, setDepartureTime] = useState(new Date().toISOString().slice(0, 16));
  const [avoidClosures, setAvoidClosures] = useState(true);

  // Suggestions state
  const [originSuggestions, setOriginSuggestions] = useState<GeocodeItem[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<GeocodeItem[]>([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState<'origin' | 'dest' | null>(null);

  // State
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RouteAnalysis | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Autocomplete fetcher with debounce
  useEffect(() => {
    if (activeSuggestionField !== 'origin' || originQuery.length < 3) {
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
    }, 300);
    return () => clearTimeout(timer);
  }, [originQuery, activeSuggestionField]);

  useEffect(() => {
    if (activeSuggestionField !== 'dest' || destQuery.length < 3) {
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
    }, 300);
    return () => clearTimeout(timer);
  }, [destQuery, activeSuggestionField]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originCoords || !destCoords) {
      setError('Please select valid origin and destination locations from suggestions.');
      return;
    }

    setError(null);
    setLoading(true);
    setAnalysisResult(null);

    try {
      const res = await api.analyzeRoute({
        origin_label: originQuery,
        origin_lat: originCoords.lat,
        origin_lon: originCoords.lon,
        destination_label: destQuery,
        destination_lat: destCoords.lat,
        destination_lon: destCoords.lon,
        travel_mode: travelMode,
      });
      setAnalysisResult(res);
      setSelectedRouteIndex(0);
    } catch (err: any) {
      setError(err.message || 'Route analysis failed. Please verify coordinates and try again.');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal uppercase tracking-wider mb-1">
          <Navigation className="w-4 h-4" />
          Journey Hazard Assessment Engine
        </div>
        <h1 className="font-heading font-extrabold text-3xl text-navy-900">
          Route Risk Planner
        </h1>
        <p className="text-sm text-slateText max-w-2xl mt-1">
          Calculate multi-threat exposure along highway corridors. Intersects meteorological alerts, active landslides, wildlife crossings, and confirmed road blockages.
        </p>
      </div>

      {/* Main Grid: Form + Results/Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (4 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-card border border-slate-200 space-y-5">
          <form onSubmit={handleAnalyze} className="space-y-4">
            {/* Origin */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Origin (Starting Point)
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal focus-within:bg-white transition-all">
                <Navigation className="w-4 h-4 text-teal flex-shrink-0" />
                <input
                  type="text"
                  required
                  value={originQuery}
                  onFocus={() => setActiveSuggestionField('origin')}
                  onChange={(e) => {
                    setOriginQuery(e.target.value);
                    setActiveSuggestionField('origin');
                  }}
                  placeholder="e.g. New Delhi, Delhi"
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none text-navy-900"
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

            {/* Destination */}
            <div className="relative">
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
                    setActiveSuggestionField('dest');
                  }}
                  placeholder="e.g. Manali, Himachal Pradesh"
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none text-navy-900"
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
                <span>Penalize known official highway closures</span>
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
                  <span>Evaluating Corridor Hazards...</span>
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
