import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  FileText, Activity, Database, Clock, Lock
} from 'lucide-react';
import { api } from '../services/api';
import { CommunityReport, SourceStatus, AuditLog } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'moderation' | 'sources' | 'audit'>('moderation');
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'moderation') {
        const data = await api.getAdminReports();
        setReports(data);
      } else if (activeTab === 'sources') {
        const data = await api.getAdminSources();
        setSources(data);
      } else if (activeTab === 'audit') {
        const data = await api.getAdminAuditLogs();
        setAuditLogs(data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (
    id: string,
    action: 'approve' | 'corroborate' | 'reject' | 'resolve'
  ) => {
    try {
      const notes = actionNotes[id] || '';
      await api.moderateReport(id, action, notes);
      setFeedback(`Report ${id} successfully transitioned via action: ${action.toUpperCase()}`);
      setTimeout(() => setFeedback(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Moderation failed: ${err.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-card">
        <Lock className="w-12 h-12 text-alertRed mx-auto" />
        <h2 className="font-heading font-extrabold text-2xl text-navy-900">
          Restricted Administrator Access
        </h2>
        <p className="text-xs text-slateText">
          This portal requires verified platform administration credentials. Your current account does not have administrative privileges.
        </p>
        <Link
          to="/app"
          className="inline-block px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          Return to Traveler Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            Platform Governance & Administrative Console
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-navy-900">
            Admin Governance Portal
          </h1>
          <p className="text-xs text-slateText mt-1">
            Moderate crowdsourced citizen reports, inspect external ingestion adapter health, and review immutable audit trails.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-navy-900 text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-teal" />
          <span>Refresh Data</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`py-3 px-4 font-heading font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'moderation'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-navy-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Community Moderation Queue</span>
          {reports.filter((r) => r.moderation_state === 'pending_review').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">
              {reports.filter((r) => r.moderation_state === 'pending_review').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`py-3 px-4 font-heading font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'sources'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-navy-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Data Ingestion & Source Freshness</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 font-heading font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-navy-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Administrative Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading moderation queue...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-xs text-navy-900">No community hazard reports submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <RiskBadge category={report.category} />
                      <span className="font-mono text-xs font-bold text-slate-700">ID: {report.id}</span>
                    </div>
                    <RiskBadge verification={report.moderation_state} />
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-navy-900">{report.location_name}</h3>
                    <p className="text-xs text-slateText mt-1 leading-relaxed">{report.description}</p>
                    <div className="text-[11px] text-slate-500 mt-2 font-mono">
                      Coordinates: {report.latitude}, {report.longitude} • Reported:{' '}
                      {new Date(report.observation_time).toLocaleString()}
                    </div>
                  </div>

                  {report.media_url && (
                    <div className="pt-1">
                      <a
                        href={report.media_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-teal hover:underline"
                      >
                        Inspect Attached Photo Evidence
                      </a>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Add moderation verification notes..."
                      value={actionNotes[report.id] || ''}
                      onChange={(e) =>
                        setActionNotes({ ...actionNotes, [report.id]: e.target.value })
                      }
                      className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-navy-900 flex-1 min-w-[200px]"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModerate(report.id, 'approve')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm as Official</span>
                      </button>

                      <button
                        onClick={() => handleModerate(report.id, 'corroborate')}
                        className="px-3 py-1.5 bg-teal hover:bg-teal-dark text-white font-bold text-xs rounded-lg transition-colors"
                      >
                        Corroborate
                      </button>

                      <button
                        onClick={() => handleModerate(report.id, 'reject')}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-alertRed font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Sources Health */}
      {activeTab === 'sources' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-heading font-bold text-xs uppercase tracking-wider text-slate-700">
            Registered External Data Adapters
          </div>
          <div className="divide-y divide-slate-100">
            {sources.map((s) => (
              <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-900 text-sm">{s.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {s.health_status}
                    </span>
                  </div>
                  <p className="text-slateText text-[11px] mt-0.5">{s.licensing_notes}</p>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Policy: {s.refresh_policy} • Adapter: {s.adapter_type}
                  </div>
                </div>

                <div className="text-right">
                  <a
                    href={s.official_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-teal hover:underline"
                  >
                    Official Portal
                  </a>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Last ingest: {s.last_successful_retrieval ? new Date(s.last_successful_retrieval).toLocaleTimeString() : 'Active'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-heading font-bold text-xs uppercase tracking-wider text-slate-700">
            Immutable Administrative Audit Trail
          </div>
          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-purple-800">{log.action}</span>
                    <span className="text-slate-500">• Admin: {log.admin_email}</span>
                  </div>
                  <p className="text-slate-600 font-mono text-[11px]">
                    Target: {log.target_entity} ({log.target_id})
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
