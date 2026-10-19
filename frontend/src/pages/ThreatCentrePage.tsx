import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, Filter, Search, Layers, Shield, RefreshCw,
  ExternalLink, ChevronRight, Info, MapPin, Clock
} from 'lucide-react';
import { api } from '../services/api';
import { Incident, ThreatSummary } from '../types';
import { InteractiveMap } from '../components/InteractiveMap';
import { RiskBadge } from '../components/RiskBadge';
import { Link } from 'react-router-dom';

export const ThreatCentrePage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<ThreatSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<string>('all');
  const [includeSampleData, setIncludeSampleData] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  useEffect(() => {
    fetchIncidents();
  }, [includeSampleData]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const [list, sum] = await Promise.all([
        api.getIncidents({ include_sample: includeSampleData }),
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

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (selectedCategory !== 'all' && inc.hazard_category !== selectedCategory) return false;
      if (selectedSeverity !== 'all' && inc.platform_severity !== selectedSeverity) return false;
      if (selectedVerification !== 'all' && inc.verification_status !== selectedVerification) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = inc.title.toLowerCase().includes(q);
        const matchDesc = inc.description.toLowerCase().includes(q);
        const matchSource = inc.source_name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSource) return false;
      }
      return true;
    });
  }, [incidents, selectedCategory, selectedSeverity, selectedVerification, searchQuery]);

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
            Live pan-India multi-threat monitoring across national highways, mountain passes, and rural corridors. Filter by category, official authority, or verification state.
          </p>
        </div>

        {summary && (
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 font-medium">Active Incidents:</span>
              <span className="font-extrabold text-navy-900 ml-1.5 text-sm">{summary.total_active}</span>
            </div>
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 font-medium">Official Feeds:</span>
              <span className="font-extrabold text-emerald-700 ml-1.5 text-sm">{summary.verified_count}</span>
            </div>
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 font-medium">Community Reports:</span>
              <span className="font-extrabold text-teal ml-1.5 text-sm">{summary.community_count}</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search highway, hazard, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-navy-900 font-semibold focus:outline-none focus:ring-1 focus:ring-teal"
        >
          <option value="all">All Hazard Categories</option>
          <option value="weather">Meteorological (IMD)</option>
          <option value="landslide">Geological / Landslide (GSI)</option>
          <option value="wildlife">Wildlife Corridors</option>
          <option value="social_disruption">Social / Highway Blockades</option>
          <option value="road_infrastructure">Road & Infrastructure Damage</option>
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
            <button
              onClick={fetchIncidents}
              className="text-xs text-teal font-bold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Data Feeds
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500 font-medium">Refreshing radar feeds...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-navy-900 text-sm">No incidents match current filter criteria.</p>
              <p className="text-xs text-slate-500 mt-1">
                Try selecting "All Hazard Categories" or clearing the search keyword.
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
                        🛡️ Anti-poaching coordinate fuzzing active
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
    </div>
  );
};
