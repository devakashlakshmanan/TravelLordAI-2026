import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Incident } from '../types';
import { InteractiveMap } from '../components/InteractiveMap';
import { RiskBadge } from '../components/RiskBadge';
import {
  AlertTriangle, Search, Filter, ShieldAlert,
  ArrowRight, RefreshCw, MapPin, Clock, ExternalLink,
  Construction, CheckCircle2, ChevronRight, Info
} from 'lucide-react';

export const RoadWatchPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const fetchRoadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch incidents across India
      const data = await api.getIncidents({ limit: 200, include_sample: true });
      // Filter for road, infrastructure, weather road impacts, or social disruptions affecting corridors
      setIncidents(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load road conditions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadIncidents();
  }, []);

  // Filter roadwatch relevant incidents
  const roadIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Must be relevant to roads/transit or general travel hazards
      const isRoadRelevant =
        inc.hazard_category === 'road_infrastructure' ||
        inc.hazard_category === 'landslide' ||
        inc.hazard_category === 'weather' ||
        inc.hazard_category === 'social_disruption' ||
        inc.title.toLowerCase().includes('road') ||
        inc.title.toLowerCase().includes('highway') ||
        inc.title.toLowerCase().includes('nh-') ||
        inc.title.toLowerCase().includes('ghat') ||
        inc.title.toLowerCase().includes('closure');

      if (!isRoadRelevant) return false;

      // Filter by category
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'closures' && !inc.title.toLowerCase().includes('closure') && !inc.description.toLowerCase().includes('closed')) return false;
        if (selectedCategory === 'landslides' && inc.hazard_category !== 'landslide') return false;
        if (selectedCategory === 'weather' && inc.hazard_category !== 'weather') return false;
        if (selectedCategory === 'roadworks' && !inc.title.toLowerCase().includes('work') && !inc.description.toLowerCase().includes('construction') && !inc.description.toLowerCase().includes('maintenance')) return false;
        if (selectedCategory === 'infrastructure' && inc.hazard_category !== 'road_infrastructure') return false;
      }

      // Filter by state
      if (selectedState !== 'all' && (inc.state_province?.toLowerCase() !== selectedState.toLowerCase() && !inc.location_name?.toLowerCase().includes(selectedState.toLowerCase()) && !inc.title.toLowerCase().includes(selectedState.toLowerCase()))) {
        return false;
      }

      // Filter by severity
      if (selectedSeverity !== 'all' && inc.platform_severity !== selectedSeverity) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = inc.title.toLowerCase().includes(q);
        const matchesDesc = inc.description.toLowerCase().includes(q);
        const matchesLoc = (inc.location_name || '').toLowerCase().includes(q);
        const matchesState = (inc.state_province || '').toLowerCase().includes(q);
        const matchesSource = inc.source_name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesState && !matchesSource) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, selectedCategory, selectedState, selectedSeverity, searchQuery]);

  // Unique states
  const states = useMemo(() => {
    const set = new Set<string>();
    incidents.forEach((i) => {
      if (i.state_province) set.add(i.state_province);
    });
    return Array.from(set).sort();
  }, [incidents]);

  const selectedIncident = useMemo(() => {
    return incidents.find((i) => i.id === selectedIncidentId) || null;
  }, [incidents, selectedIncidentId]);

  return (
    <div className="min-h-screen bg-warmWhite pb-16">
      {/* Hero Header */}
      <div className="bg-navy-900 text-white border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-mint font-semibold text-xs tracking-wider uppercase mb-2">
                <Construction className="w-4 h-4 text-mint" />
                National Transit Corridor Intelligence
              </div>
              <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-white">
                RoadWatch
              </h1>
              <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
                Documented highway conditions, pass closures, ghat advisories, roadworks, and waterlogging
                reported by official highway agencies and verified community witnesses across India.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal/50"
              >
                <AlertTriangle className="w-4 h-4" />
                Report an Issue
              </Link>
              <button
                type="button"
                onClick={fetchRoadIncidents}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-navy-800 text-slate-300 text-sm font-medium hover:text-white hover:bg-navy-700 transition-colors border border-navy-700"
                title="Refresh feed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="mt-6 flex items-start gap-3 p-3.5 rounded-xl bg-navy-800/80 border border-navy-700 text-xs text-slate-300">
            <Info className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
            <span>
              <strong>Operational Reality Notice:</strong> RoadWatch records verified observations and official bulletins.
              Unreported routes are not guaranteed hazard-free. For emergency roadside assistance on National Highways, dial{' '}
              <a href="tel:1033" className="text-mint font-bold hover:underline">1033</a> (NHAI).
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search highway (e.g. NH-44, Manali)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all text-navy-900"
              >
                <option value="all">All Road Event Types</option>
                <option value="closures">Pass & Highway Closures</option>
                <option value="landslides">Landslides & Rockfalls</option>
                <option value="weather">Flooding & Weather Blocks</option>
                <option value="roadworks">Roadworks & Maintenance</option>
                <option value="infrastructure">Infrastructure Damage</option>
              </select>
            </div>

            {/* State Filter */}
            <div>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all text-navy-900"
              >
                <option value="all">All Indian States / UTs</option>
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all text-navy-900"
              >
                <option value="all">All Impact Levels</option>
                <option value="critical">Critical (Pass Closed / Severe Block)</option>
                <option value="high">High (Major Delays / Caution)</option>
                <option value="medium">Medium (Moderate Disruptions)</option>
                <option value="low">Low (Minor Advisory)</option>
              </select>
            </div>
          </div>

          {/* Result Count and Active Filters */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong>{roadIncidents.length}</strong> documented road conditions
            </span>
            {(selectedCategory !== 'all' || selectedState !== 'all' || selectedSeverity !== 'all' || searchQuery.trim()) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedState('all');
                  setSelectedSeverity('all');
                  setSearchQuery('');
                }}
                className="text-teal hover:underline font-medium"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Map & List Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Map */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-20">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal" />
                Live Corridor Map
              </span>
              <span>{roadIncidents.length} markers</span>
            </div>
            <div className="h-[460px] sm:h-[540px]">
              <InteractiveMap
                incidents={roadIncidents}
                selectedIncidentId={selectedIncidentId}
                onSelectIncident={(id) => setSelectedIncidentId(id)}
                height="100%"
                center={[23.5, 78.5]}
                zoom={5}
              />
            </div>
          </div>

          {/* Incident Feed List */}
          <div className="lg:col-span-5 space-y-3.5">
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal mb-3" />
                <p className="text-sm font-medium">Retrieving latest road conditions...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800">
                <ShieldAlert className="w-6 h-6 mx-auto text-red-500 mb-2" />
                <p className="text-sm font-semibold">{error}</p>
                <button
                  onClick={fetchRoadIncidents}
                  className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : roadIncidents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-navy-900 mb-1">No Road Conditions Match Query</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Try broadening your search keywords, clearing state filters, or selecting all categories.
                </p>
              </div>
            ) : (
              roadIncidents.map((incident) => {
                const isSelected = incident.id === selectedIncidentId;
                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncidentId(incident.id)}
                    className={`bg-white rounded-2xl border p-4 transition-all cursor-pointer hover:shadow-md ${
                      isSelected
                        ? 'border-teal ring-2 ring-teal/20 bg-teal/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <RiskBadge level={incident.platform_severity} verification={incident.verification_status} />
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {incident.hazard_category.replace('_', ' ').toUpperCase()}
                        </span>
                        {incident.is_sample_data && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            Historical Sample
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(incident.published_time || incident.observed_time).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-sm text-navy-900 mb-1 leading-snug">
                      {incident.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {incident.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 text-teal flex-shrink-0" />
                        {incident.location_name || `${incident.latitude.toFixed(2)}, ${incident.longitude.toFixed(2)}`}
                      </span>
                      <Link
                        to={`/incidents/${incident.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-semibold text-teal hover:text-navy-900 transition-colors"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
