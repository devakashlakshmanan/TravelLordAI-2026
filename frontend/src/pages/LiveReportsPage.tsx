import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { CommunityReport, Incident } from '../types';
import { useAuth } from '../context/AuthContext';
import { InteractiveMap } from '../components/InteractiveMap';
import {
  Users, AlertTriangle, ThumbsUp, ShieldAlert,
  Search, Filter, MapPin, Clock, PlusCircle, CheckCircle2,
  XCircle, RefreshCw, MessageSquare, AlertOctagon, Info
} from 'lucide-react';

export const LiveReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dispute modal state
  const [disputeReportId, setDisputeReportId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>('hazard_cleared');
  const [disputeNotes, setDisputeNotes] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && disputeReportId) {
        setDisputeReportId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disputeReportId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCommunityFeed({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchQuery.trim() || undefined,
        limit: 100,
      });
      setReports(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch community reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleCorroborate = async (reportId: string) => {
    try {
      setSubmittingAction(true);
      setActionError(null);
      setActionSuccess(null);
      const res = await api.corroborateReport(reportId);
      setActionSuccess(`Corroborated successfully! Total corroborations: ${res.corroborations_count}`);
      fetchReports();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to corroborate report.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReportId) return;

    try {
      setSubmittingAction(true);
      setActionError(null);
      setActionSuccess(null);
      await api.disputeReport(disputeReportId, disputeReason, disputeNotes);
      setActionSuccess('Report disputed. Our moderation queue has flagged this incident.');
      setDisputeReportId(null);
      setDisputeNotes('');
      fetchReports();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit dispute.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleResolve = async (reportId: string) => {
    try {
      setSubmittingAction(true);
      setActionError(null);
      setActionSuccess(null);
      await api.resolveReport(reportId);
      setActionSuccess('Report marked as resolved/cleared.');
      fetchReports();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to resolve report.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Convert CommunityReports into Incident format for InteractiveMap
  const mapIncidents: Incident[] = useMemo(() => {
    return reports.map((rep) => ({
      id: rep.id,
      title: rep.title || `${rep.category.replace('_', ' ').toUpperCase()} Observation`,
      hazard_category: (rep.category as any) || 'road_infrastructure',
      platform_severity: rep.moderation_state === 'corroborated' || rep.moderation_state === 'officially_confirmed' ? 'high' : 'moderate',
      source_severity: 'Community Witness',
      latitude: rep.latitude,
      longitude: rep.longitude,
      affected_radius_meters: 1500,
      observed_time: rep.observation_time || rep.created_at,
      published_time: rep.created_at,
      location_name: rep.location_name || 'Community observation point',
      description: rep.description,
      source_name: 'TravelLord Community',
      status: rep.moderation_state === 'resolved' ? 'resolved' : 'active',
      is_sample_data: false,
      evidence_quality: rep.moderation_state === 'corroborated' ? 'high' : 'moderate',
      fuzzed_coordinates: false,
      verification_status: rep.moderation_state === 'officially_confirmed' ? 'official' : rep.moderation_state === 'corroborated' ? 'verified_community' : 'unverified',
    }));
  }, [reports]);

  return (
    <div className="min-h-screen bg-warmWhite pb-16">
      {/* Header */}
      <div className="bg-navy-900 text-white border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-mint font-semibold text-xs tracking-wider uppercase mb-2">
                <Users className="w-4 h-4 text-mint" />
                Crowdsourced Citizen Observational Intelligence
              </div>
              <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-white">
                Live Community Reports
              </h1>
              <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
                Real-time on-ground road observations, waterlogging, fallen trees, and local diversions
                submitted by verified travellers. Corroborate witness reports to elevate platform reliability.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal/50"
              >
                <PlusCircle className="w-4 h-4" />
                Report an Issue
              </Link>
              <button
                type="button"
                onClick={fetchReports}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-navy-800 text-slate-300 text-sm font-medium hover:text-white hover:bg-navy-700 transition-colors border border-navy-700"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Banner Alert Feedback */}
        {actionSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {actionSuccess}
            </span>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {actionError && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              {actionError}
            </span>
            <button onClick={() => setActionError(null)} className="text-red-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search community observations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
              />
            </div>

            <div>
              <select
                aria-label="Filter by Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all text-navy-900"
              >
                <option value="all">All Incident Categories</option>
                <option value="weather">Weather & Flooding</option>
                <option value="landslide">Landslide & Rockfall</option>
                <option value="wildlife">Wildlife Crossing</option>
                <option value="road_infrastructure">Road Damage & Works</option>
                <option value="social_disruption">Traffic & Blockades</option>
              </select>
            </div>

            <div>
              <select
                aria-label="Filter by Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all text-navy-900"
              >
                <option value="all">All Verification States</option>
                <option value="unverified">Unverified (1 Witness)</option>
                <option value="corroborated">Corroborated (Multi-Witness)</option>
                <option value="officially_confirmed">Officially Confirmed</option>
                <option value="disputed">Under Dispute</option>
                <option value="resolved">Resolved / Cleared</option>
              </select>
            </div>
          </form>
        </div>

        {/* Map & Feed Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Column */}
          <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-20">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal" />
                Live Community Incident Map
              </span>
              <span>{reports.length} observations</span>
            </div>
            <div className="h-[460px] sm:h-[540px]">
              <InteractiveMap
                incidents={mapIncidents}
                height="100%"
                center={[22.5, 79.5]}
                zoom={5}
              />
            </div>
          </div>

          {/* Feed Column */}
          <div className="lg:col-span-6 space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal mb-3" />
                <p className="text-sm font-medium">Loading community feed...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800">
                <ShieldAlert className="w-6 h-6 mx-auto text-red-500 mb-2" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-navy-900 mb-1">No Community Reports Match Filter</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                  Be the first to share an on-ground road condition report to alert fellow travellers.
                </p>
                <Link
                  to="/report"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal text-white text-xs font-bold"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Submit Report
                </Link>
              </div>
            ) : (
              reports.map((report) => {
                const statusBadge = {
                  unverified: { label: 'Unverified Citizen Witness', color: 'bg-amber-50 text-amber-800 border-amber-200' },
                  corroborated: { label: 'Corroborated by Observers', color: 'bg-teal/10 text-teal border-teal/20' },
                  officially_confirmed: { label: 'Officially Confirmed', color: 'bg-blue-50 text-blue-800 border-blue-200' },
                  disputed: { label: 'Disputed Report', color: 'bg-rose-50 text-rose-800 border-rose-200' },
                  resolved: { label: 'Resolved / Cleared', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                  rejected: { label: 'Rejected', color: 'bg-slate-100 text-slate-600 border-slate-200' },
                  expired: { label: 'Expired', color: 'bg-slate-100 text-slate-400 border-slate-200' },
                  pending_review: { label: 'Pending Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                }[report.moderation_state] || { label: report.moderation_state, color: 'bg-slate-100 text-slate-700' };

                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    {/* Status & Time */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {report.category.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(report.observation_time || report.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      {report.title && (
                        <h3 className="font-heading font-bold text-sm text-navy-900 mb-1">
                          {report.title}
                        </h3>
                      )}
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {report.description}
                      </p>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                      <span>
                        {report.location_name || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                      </span>
                    </div>

                    {/* Interactive Action Bar: Corroborate, Dispute, Resolve */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {/* Corroborate Button */}
                        <button
                          type="button"
                          onClick={() => handleCorroborate(report.id)}
                          disabled={submittingAction || report.moderation_state === 'resolved'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal/10 text-teal font-semibold hover:bg-teal hover:text-white transition-colors focus:outline-none disabled:opacity-50"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Corroborate ({report.corroborations_count || 0})</span>
                        </button>

                        {/* Dispute Button */}
                        <button
                          type="button"
                          onClick={() => setDisputeReportId(report.id)}
                          disabled={submittingAction || report.moderation_state === 'resolved'}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-medium hover:bg-rose-100 transition-colors focus:outline-none disabled:opacity-50 text-[11px]"
                        >
                          <AlertOctagon className="w-3 h-3" />
                          <span>Dispute ({report.disputes_count || 0})</span>
                        </button>
                      </div>

                      {/* Resolve Button (if eligible) */}
                      {report.moderation_state !== 'resolved' && (
                        <button
                          type="button"
                          onClick={() => handleResolve(report.id)}
                          disabled={submittingAction}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mark Cleared</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dispute Modal */}
        {disputeReportId && (
          <div
            className="fixed inset-0 z-[1100] bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setDisputeReportId(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="dispute-modal-title"
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-slide-up"
            >
              <h3 id="dispute-modal-title" className="font-heading font-bold text-base text-navy-900 mb-2 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Dispute Community Observation
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Help maintain community integrity. State why this report is inaccurate or no longer relevant.
              </p>
              <form onSubmit={handleDisputeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispute Reason
                  </label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30"
                  >
                    <option value="hazard_cleared">Hazard already cleared / Road open</option>
                    <option value="incorrect_location">Incorrect location / Not on this highway</option>
                    <option value="exaggerated">Severity exaggerated / Minor issue</option>
                    <option value="false_information">Spam / False information</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supporting Observation Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details on what you observed..."
                    value={disputeNotes}
                    onChange={(e) => setDisputeNotes(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDisputeReportId(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-navy-900 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
                  >
                    Submit Dispute
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
