import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, MapPin, CheckCircle2, AlertTriangle, Shield, FileText, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { CommunityReport } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const MyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyReports();
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve your submitted hazard reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-teal" />
            Citizen Hazard Contributions
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-navy-900">
            My Submitted Reports
          </h1>
          <p className="text-xs text-slateText mt-1">
            Track review status, moderation decisions, and official corroboration of hazards you reported.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="p-2.5 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Refresh list"
            aria-label="Refresh reports"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/report"
            className="px-4 py-2.5 bg-teal hover:bg-teal-dark text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Hazard</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading your hazard reports...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-red-200 shadow-card space-y-3">
          <AlertTriangle className="w-8 h-8 text-alertRed mx-auto" />
          <h3 className="font-heading font-bold text-base text-navy-900">Failed to load reports</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-teal text-white rounded-xl text-xs font-bold"
          >
            Try Again
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-card space-y-3">
          <PlusCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-heading font-bold text-base text-navy-900">No hazard reports submitted yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you encounter a landslide, road closure, fallen tree, or weather disruption, report it to help keep other travelers safe.
          </p>
          <div className="pt-2">
            <Link
              to="/report"
              className="inline-block px-4 py-2 bg-teal text-white rounded-xl text-xs font-bold"
            >
              Submit Your First Report
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-card hover:shadow-hover transition-all space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <RiskBadge category={report.category} />
                  <RiskBadge verification={report.moderation_state as any} />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Reported {new Date(report.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-heading font-bold text-base text-navy-900 mb-1">
                  {report.location_name || `Hazard near ${report.latitude.toFixed(3)}, ${report.longitude.toFixed(3)}`}
                </h3>
                <p className="text-xs text-slateText leading-relaxed">
                  {report.description}
                </p>
              </div>

              {/* Coordinates & Media if any */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal" />
                  <span className="font-mono">{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
                </span>
                <span className="font-mono text-slate-400">ID: {report.id}</span>
              </div>

              {/* Moderation Notes / Feedback from Admin if available */}
              {(report.moderation_notes || report.rejection_reason) && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-navy-900 block text-[11px] uppercase tracking-wide">
                    Moderation Desk Feedback
                  </span>
                  {report.moderation_notes && (
                    <p className="text-slate-700">{report.moderation_notes}</p>
                  )}
                  {report.rejection_reason && (
                    <p className="text-red-700 font-medium">Reason: {report.rejection_reason}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
