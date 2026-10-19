import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, ArrowLeft, ExternalLink, Clock, MapPin,
  Calendar, FileText, CheckCircle2, ShieldAlert, Info, Share2
} from 'lucide-react';
import { api } from '../services/api';
import { Incident } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { InteractiveMap } from '../components/InteractiveMap';

export const IncidentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchIncident = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.getIncidentById(id);
        setIncident(data);
      } catch (err: any) {
        setError(err.message || 'Unable to retrieve incident dossier.');
      } finally {
        setLoading(false);
      }
    };
    fetchIncident();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        <p className="font-heading font-bold text-sm text-navy-900">Loading Hazard Dossier...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-alertRed mx-auto" />
        <h2 className="font-heading font-bold text-xl text-navy-900">Hazard Record Not Found</h2>
        <p className="text-xs text-slateText">{error || 'This incident may have resolved or expired.'}</p>
        <Link to="/threats" className="inline-block px-4 py-2 bg-teal text-white rounded-xl font-bold text-xs">
          Return to Threat Centre
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Threat Map / Results
        </button>

        <button
          onClick={handleShare}
          className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm flex items-center gap-1 text-navy-900 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5 text-teal" />
          <span>{copied ? 'Link Copied!' : 'Share Dossier'}</span>
        </button>
      </div>

      {/* Main Dossier Card */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
        {/* Header Ribbon */}
        <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={incident.platform_severity} />
            <RiskBadge verification={incident.verification_status} isSample={incident.is_sample_data} />
            <RiskBadge category={incident.hazard_category} />
          </div>

          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-navy-900 leading-tight">
            {incident.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal" />
              Published: {new Date(incident.published_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal" />
              Status: <strong className="uppercase text-emerald-700 ml-1">{incident.status}</strong>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8 text-navy-900">
          {/* Detailed Description & Guidance */}
          <div className="space-y-3">
            <h2 className="font-heading font-bold text-base text-navy-900 uppercase tracking-wider text-xs">
              Official Description & Field Advisory
            </h2>
            <div className="p-4 bg-warmWhite rounded-xl border border-slate-200 text-sm leading-relaxed whitespace-pre-line text-slate-800">
              {incident.description}
            </div>
          </div>

          {/* Provenance & Severity Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <h3 className="font-heading font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                Source Provenance
              </h3>
              <div>
                <span className="text-slate-500">Issuing Authority:</span>
                <div className="font-bold text-navy-900 text-sm">{incident.source_name}</div>
              </div>
              <div>
                <span className="text-slate-500">Original Source Severity:</span>
                <div className="font-semibold text-slate-800">{incident.source_severity}</div>
              </div>
              {incident.source_url && (
                <div className="pt-1">
                  <a
                    href={incident.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-teal hover:underline text-xs"
                  >
                    Official Source Bulletin <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <h3 className="font-heading font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                Geographic Scope & Compliance
              </h3>
              <div>
                <span className="text-slate-500">Affected Buffer Radius:</span>
                <div className="font-bold text-navy-900 text-sm">
                  {Math.round(incident.affected_radius_meters / 1000)} km
                </div>
              </div>
              <div>
                <span className="text-slate-500">Coordinates:</span>
                <div className="font-mono text-slate-800 font-semibold">
                  {incident.fuzzed_coordinates ? (
                    <span className="text-amber-800">
                      Broad regional corridor (~{incident.latitude.toFixed(2)}, {incident.longitude.toFixed(2)})
                    </span>
                  ) : (
                    `${incident.latitude.toFixed(4)}° N, ${incident.longitude.toFixed(4)}° E`
                  )}
                </div>
              </div>

              {incident.fuzzed_coordinates && (
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-950 flex items-start gap-1.5 mt-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span>
                    Sensitive wildlife coordinates are deliberately fuzzed in accordance with anti-poaching and environmental compliance policies.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Map Preview */}
          <div className="space-y-3">
            <h2 className="font-heading font-bold text-base text-navy-900 uppercase tracking-wider text-xs">
              Geographic Hazard Location
            </h2>
            <InteractiveMap
              incidents={[incident]}
              center={[incident.latitude, incident.longitude]}
              zoom={10}
              height="340px"
            />
          </div>

          {/* Traveler Guidance Action Box */}
          <div className="p-5 bg-teal/10 rounded-2xl border border-teal/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-sm text-navy-900">
                Planning a journey passing through this area?
              </h3>
              <p className="text-xs text-slateText">
                Evaluate alternative bypass routes and compute your exact exposure window.
              </p>
            </div>
            <Link
              to="/plan"
              className="px-4 py-2.5 bg-teal hover:bg-teal-dark text-white font-bold text-xs rounded-xl shadow-sm transition-all whitespace-nowrap"
            >
              Analyze Your Route
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
