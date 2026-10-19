import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, Filter, Search, Layers, Shield, RefreshCw,
  ExternalLink, ChevronRight, Info, MapPin, Clock, Database,
  CheckCircle2, X, Compass
} from 'lucide-react';
import { api } from '../services/api';
import { Incident, ThreatSummary, SourceStatus } from '../types';
import { InteractiveMap } from '../components/InteractiveMap';
import { RiskBadge } from '../components/RiskBadge';
import { Link, useSearchParams } from 'react-router-dom';

const INDIAN_REGIONS = [
  { id: 'all', name: 'Pan-India (All Regions)', center: [22.5, 79.5] as [number, number], zoom: 5 },
  { id: 'north', name: 'North (Himalayas & Arterials)', center: [31.5, 77.0] as [number, number], zoom: 7 },
  { id: 'west', name: 'West (Konkan & Sahyadri)', center: [19.0, 74.0] as [number, number], zoom: 7 },
  { id: 'south', name: 'South (Western Ghats & Coasts)', center: [11.5, 77.5] as [number, number], zoom: 7 },
  { id: 'east', name: 'East & Northeast (Basins & Hills)', center: [25.5, 91.5] as [number, number], zoom: 7 },
  { id: 'central', name: 'Central (Plateaus & Forests)', center: [22.5, 78.5] as [number, number], zoom: 7 },
];

const INDIAN_STATES = [
  'All States & UTs',
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman and Nicobar Islands'
];

export const ThreatCentrePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<ThreatSummary | null>(null);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>(searchParams.get('severity') || 'all');
  const [selectedVerification, setSelectedVerification] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('All States & UTs');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('all');
  const [includeSampleData, setIncludeSampleData] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Map view controller
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.5, 79.5]);
  const [mapZoom, setMapZoom] = useState<number>(5);

  // Coverage Transparency Modal
  const [showCoverageModal, setShowCoverageModal] = useState<boolean>(false);

  useEffect(() => {
    fetchIncidents();
  }, [selectedCategory, selectedSeverity, selectedVerification, selectedState, includeSampleData]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const stateParam = selectedState === 'All States & UTs' ? undefined : selectedState;
      const [list, sum] = await Promise.all([
        api.getIncidents({
          category: selectedCategory,
          severity: selectedSeverity,
          verification: selectedVerification,
          state: stateParam,
          include_sample: includeSampleData
        }),
        api.getThreatSummary(),
      ]);
      setIncidents(list);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load threats', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCoverageModal = async () => {
    setShowCoverageModal(true);
    try {
      const srcList = await api.getSourcesStatus();
      setSources(srcList);
    } catch (e) {
      console.error('Failed to load sources status', e);
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      await api.syncSources();
      await fetchIncidents();
      const updatedSources = await api.getSourcesStatus();
      setSources(updatedSources);
    } catch (e) {
      console.error('Failed to sync feeds', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectRegion = (r: typeof INDIAN_REGIONS[0]) => {
    setSelectedRegionId(r.id);
    setMapCenter(r.center);
    setMapZoom(r.zoom);
    if (r.id === 'all') {
      setSelectedState('All States & UTs');
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = inc.title.toLowerCase().includes(q);
        const matchDesc = inc.description.toLowerCase().includes(q);
        const matchSource = inc.source_name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSource) return false;
      }
      return true;
    });
  }, [incidents, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4 text-alertRed" />
            National Hazard Radar & Situational Center
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-navy-900">
            India Threat Centre
          </h1>
          <p className="text-xs text-slateText mt-1 max-w-2xl">
            Live pan-India multi-threat monitoring across national highways, mountain passes, and rural corridors.
            Integrates verified feeds from IMD, GSI NLSM, CWC, Forest Departments, and NHAI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {summary && (
            <div className="flex gap-2 text-xs">
              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 font-medium">Active Incidents:</span>
                <span className="font-extrabold text-navy-900 ml-1.5 text-sm">{summary.total_active}</span>
              </div>
              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 font-medium">Official Feeds:</span>
                <span className="font-extrabold text-emerald-700 ml-1.5 text-sm">{summary.verified_count}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleOpenCoverageModal}
            className="px-3.5 py-2 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-mint" />
            <span>Coverage & Source Transparency</span>
          </button>
        </div>
      </div>

      {/* Regional Quick-Jump Pills */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Regional Focus Area:
        </span>
        <div className="flex flex-wrap gap-2">
          {INDIAN_REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelectRegion(r)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all shadow-sm ${
                selectedRegionId === r.id
                  ? 'bg-teal text-white border-teal shadow-md'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-center">
        {/* Search Input */}
        <div className="relative lg:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search keyword or highway..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal"
          />
        </div>

        {/* State Filter */}
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-navy-900 font-semibold focus:outline-none focus:ring-1 focus:ring-teal"
        >
          {INDIAN_STATES.map((s, idx) => (
            <option key={idx} value={s}>{s}</option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-navy-900 font-semibold focus:outline-none focus:ring-1 focus:ring-teal"
        >
          <option value="all">All Hazard Categories</option>
          <option value="weather">Meteorological (IMD / CWC)</option>
          <option value="landslide">Geological / Landslide (GSI)</option>
          <option value="wildlife">Wildlife Corridors (Forest Dept)</option>
          <option value="social_disruption">Social / Highway Blockades</option>
          <option value="road_infrastructure">Road & Infrastructure (NHAI)</option>
        </select>

        {/* Severity Filter */}
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-navy-900 font-semibold focus:outline-none focus:ring-1 focus:ring-teal"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="moderate">Moderate</option>
          <option value="low">Low / Elevated</option>
        </select>

        {/* Verification Status */}
        <select
          value={selectedVerification}
          onChange={(e) => setSelectedVerification(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-navy-900 font-semibold focus:outline-none focus:ring-1 focus:ring-teal"
        >
          <option value="all">All Verification Tiers</option>
          <option value="official">Official Authority Alerts</option>
          <option value="verified_community">Verified Community</option>
          <option value="historical_susceptibility">Historical Susceptibility</option>
          <option value="unverified">Unverified Submissions</option>
        </select>

        {/* Sample Data Toggle */}
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={includeSampleData}
            onChange={(e) => setIncludeSampleData(e.target.checked)}
            className="rounded accent-purple-600"
          />
          <span>Include QA Sample Data</span>
        </label>
      </div>

      {/* Main Threat Workspace: Map + Grid of Incidents */}
      <div className="space-y-6">
        <InteractiveMap
          incidents={filteredIncidents}
          center={mapCenter}
          zoom={mapZoom}
          selectedIncidentId={selectedIncidentId}
          onSelectIncident={(id) => setSelectedIncidentId(id)}
          height="520px"
        />

        {/* Results List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg text-navy-900">
              Active Hazard Dossiers ({filteredIncidents.length})
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleTriggerSync}
                disabled={syncing}
                className="text-xs text-teal font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing Feeds...' : 'Sync Live Feeds'}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500 font-medium">Refreshing radar feeds across India...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-navy-900 text-sm">No incidents match current filter criteria in {selectedState}.</p>
              <p className="text-xs text-slate-500 mt-1">
                Zero matching reports indicates no active hazards ingested in this specific filter.
                Always exercise caution on unmonitored roads.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`bg-white rounded-2xl p-5 border shadow-card hover:shadow-hover transition-all flex flex-col justify-between ${
                    selectedIncidentId === inc.id ? 'border-teal ring-2 ring-teal' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <RiskBadge level={inc.platform_severity} />
                      <RiskBadge verification={inc.verification_status} isSample={inc.is_sample_data} />
                    </div>

                    <h3 className="font-heading font-bold text-base text-navy-900 leading-snug mb-2">
                      {inc.title}
                    </h3>

                    <p className="text-slateText text-xs line-clamp-3 leading-relaxed mb-4">
                      {inc.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="truncate max-w-[170px]" title={inc.source_name}>
                        {inc.source_name}
                      </span>
                      <span>
                        {new Date(inc.published_time).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {inc.fuzzed_coordinates && (
                      <div className="text-[10px] text-amber-700 font-semibold">
                        🛡️ Anti-poaching coordinate fuzzing active (WPA 1972)
                      </div>
                    )}

                    <Link
                      to={`/incidents/${inc.id}`}
                      className="w-full py-2 bg-slate-50 hover:bg-teal hover:text-white text-navy-900 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all"
                    >
                      <span>View Full Incident Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coverage & Source Transparency Modal (Phase 11) */}
      {showCoverageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-teal" />
                <h3 className="font-heading font-extrabold text-xl text-navy-900">
                  National Data Coverage & Feed Transparency
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCoverageModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Zero-Incident Disclaimer */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>Transparent Zero-Incident Safety Disclosure</span>
              </div>
              <p className="leading-relaxed">
                The absence of reported alerts along an Indian highway or rural road does not prove an area is verified safe.
                TravelLord AI publishes verified observations and model assessments without fabricating missing information.
              </p>
            </div>

            {/* Sources Table */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm text-navy-900">
                Configured Official Data Feeds
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Source Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Coverage Tier</th>
                      <th className="p-3">Refresh Policy</th>
                      <th className="p-3">Health Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sources.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-semibold text-navy-900">
                          <a href={s.official_url} target="_blank" rel="noreferrer" className="hover:text-teal underline">
                            {s.name}
                          </a>
                        </td>
                        <td className="p-3 capitalize">{s.category.replace('_', ' ')}</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-teal/10 text-teal">
                            Official Authority
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{s.refresh_policy}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{s.health_status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>National Ingestion Pipeline: Active</span>
              <button
                type="button"
                onClick={() => setShowCoverageModal(false)}
                className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl"
              >
                Close Transparency Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
