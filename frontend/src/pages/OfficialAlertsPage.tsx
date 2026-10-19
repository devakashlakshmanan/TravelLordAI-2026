import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Incident } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import {
  ShieldAlert, Radio, Search, Filter, ExternalLink,
  Clock, MapPin, RefreshCw, AlertTriangle, Building,
  Info, CheckCircle
} from 'lucide-react';

export const OfficialAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch incidents filtered to verified or high impact
      const data = await api.getIncidents({ limit: 150, include_sample: true });
      // Keep official alerts or government sources
      const officialItems = data.filter(
        (i) =>
          i.source_name.toLowerCase().includes('imd') ||
          i.source_name.toLowerCase().includes('cwc') ||
          i.source_name.toLowerCase().includes('police') ||
          i.source_name.toLowerCase().includes('disaster') ||
          i.source_name.toLowerCase().includes('ministry') ||
          i.source_name.toLowerCase().includes('nhai') ||
          i.source_name.toLowerCase().includes('official') ||
          i.verification_status === 'official'
      );
      setAlerts(officialItems.length > 0 ? officialItems : data);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve official alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (selectedSeverity !== 'all' && alert.platform_severity !== selectedSeverity) {
        return false;
      }
      if (selectedSource !== 'all') {
        const src = alert.source_name.toLowerCase();
        if (selectedSource === 'imd' && !src.includes('imd') && !src.includes('meteorological')) return false;
        if (selectedSource === 'cwc' && !src.includes('cwc') && !src.includes('water')) return false;
        if (selectedSource === 'police' && !src.includes('police') && !src.includes('traffic')) return false;
        if (selectedSource === 'nhai' && !src.includes('nhai') && !src.includes('highway')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = alert.title.toLowerCase().includes(q);
        const matchesDesc = alert.description.toLowerCase().includes(q);
        const matchesLoc = (alert.location_name || '').toLowerCase().includes(q);
        const matchesState = (alert.state_province || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesState) {
          return false;
        }
      }
      return true;
    });
  }, [alerts, selectedSeverity, selectedSource, searchQuery]);

  return (
    <div className="min-h-screen bg-warmWhite pb-16">
      {/* Header */}
      <div className="bg-navy-900 text-white border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-mint font-semibold text-xs tracking-wider uppercase mb-2">
                <Radio className="w-4 h-4 text-mint animate-pulse" />
                Verified Government Advisories & Civil Alerts
              </div>
              <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-white">
                Official Alerts
              </h1>
              <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
                Direct statutory warnings and official bulletins issued by the India Meteorological Department (IMD),
                Central Water Commission (CWC), State Disaster Management Authorities (SDMA), and Highway Police.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={fetchAlerts}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 text-slate-300 text-sm font-medium hover:text-white hover:bg-navy-700 transition-colors border border-navy-700"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Bulletins</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Filter Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search official bulletins (e.g. Cyclone, Red Alert)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
              />
            </div>

            <div>
              <select
                aria-label="Filter by Agency"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all text-navy-900"
              >
                <option value="all">All Issuing Authorities</option>
                <option value="imd">India Meteorological Dept (IMD)</option>
                <option value="cwc">Central Water Commission (CWC)</option>
                <option value="nhai">NHAI / Highway Authorities</option>
                <option value="police">State / Traffic Police</option>
              </select>
            </div>

            <div>
              <select
                aria-label="Filter by Severity"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all text-navy-900"
              >
                <option value="all">All Warning Tiers</option>
                <option value="critical">Critical / Red Warning</option>
                <option value="high">High / Orange Warning</option>
                <option value="medium">Moderate / Yellow Watch</option>
                <option value="low">Green / Low Advisory</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal mb-3" />
            <p className="text-sm font-medium">Syncing official government alert bulletins...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800">
            <ShieldAlert className="w-6 h-6 mx-auto text-red-500 mb-2" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <CheckCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-navy-900 mb-1">No Active Official Bulletins Match Filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching government warnings were found for the selected agency and severity level.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <RiskBadge level={alert.platform_severity} verification={alert.verification_status} />
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-navy-50 text-navy-900 border border-navy-100 flex items-center gap-1">
                        <Building className="w-3 h-3 text-teal" />
                        {alert.source_name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.published_time || alert.observed_time).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-navy-900 mb-2 leading-snug">
                    {alert.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {alert.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 truncate max-w-[240px]">
                    <MapPin className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                    {alert.location_name || `${alert.latitude.toFixed(2)}, ${alert.longitude.toFixed(2)}`}
                  </span>
                  <a
                    href={`/incidents/${alert.id}`}
                    className="font-bold text-teal hover:underline flex items-center gap-1"
                  >
                    View Dossier
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-3">
          <Info className="w-4 h-4 text-teal flex-shrink-0" />
          <span>
            Official bulletins are ingested from open government data channels and meteorological agency feeds.
            In acute disaster conditions, follow instructions issued by local District Magistrates, Disaster Control Rooms, and NDRF responders.
          </span>
        </div>
      </div>
    </div>
  );
};
