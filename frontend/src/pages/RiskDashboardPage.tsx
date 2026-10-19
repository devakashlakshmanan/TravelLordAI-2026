import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield, Navigation, AlertTriangle, CloudRain, Mountain, PawPrint,
  Clock, CheckCircle2, ChevronRight, Share2, Bookmark, BookmarkCheck,
  ChevronLeft, ExternalLink, Info, AlertCircle, Compass, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { RouteAnalysis, Incident } from '../types';
import { InteractiveMap } from '../components/InteractiveMap';
import { RiskBadge } from '../components/RiskBadge';
import { useAuth } from '../context/AuthContext';

export const RiskDashboardPage: React.FC = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const { user } = useAuth();

  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all active incidents for map display
        const incList = await api.getIncidents({ include_sample: true });
        setIncidents(incList);

        // Fetch saved route or re-simulate if fresh analysis
        // If analysisId is provided, fetch route data
        if (analysisId) {
          try {
            const routeData = await api.getRouteById(analysisId);
            if (routeData && routeData.geometry) {
              const res = await api.analyzeRoute({
                origin_label: routeData.origin_label,
                origin_lat: routeData.origin_lat,
                origin_lon: routeData.origin_lon,
                destination_label: routeData.destination_label,
                destination_lat: routeData.destination_lat,
                destination_lon: routeData.destination_lon,
              });
              setAnalysis(res);
            }
          } catch {
            // Default demo route if analysisId is standalone UUID
            const res = await api.analyzeRoute({
              origin_label: 'New Delhi, Delhi, India',
              origin_lat: 28.6139,
              origin_lon: 77.2090,
              destination_label: 'Manali, Himachal Pradesh, India',
              destination_lat: 32.2396,
              destination_lon: 77.1887,
            });
            setAnalysis(res);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load risk analysis.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [analysisId]);

  const handleSaveRoute = async () => {
    if (!analysis) return;
    try {
      await api.saveRoute({
        title: `${analysis.origin_label.split(',')[0]} to ${analysis.destination_label.split(',')[0]}`,
        origin_label: analysis.origin_label,
        origin_lat: analysis.segments[0]?.start_lat || 28.6139,
        origin_lon: analysis.segments[0]?.start_lon || 77.2090,
        destination_label: analysis.destination_label,
        destination_lat: analysis.segments[analysis.segments.length - 1]?.end_lat || 32.2396,
        destination_lon: analysis.segments[analysis.segments.length - 1]?.end_lon || 77.1887,
        distance_meters: analysis.distance_meters,
        duration_seconds: analysis.duration_seconds,
        geometry: analysis.geometry,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        <p className="font-heading font-bold text-sm text-navy-900">
          Synthesizing Multi-Threat Route Intelligence...
        </p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-alertRed mx-auto" />
        <h2 className="font-heading font-bold text-xl text-navy-900">Analysis Not Found</h2>
        <p className="text-xs text-slateText">{error || 'Unable to retrieve this route assessment.'}</p>
        <Link
          to="/plan"
          className="inline-block px-4 py-2 bg-teal text-white rounded-xl font-bold text-xs shadow-sm"
        >
          Plan a New Journey
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-warmWhite">
      {/* LEFT SIDEBAR: 35% on Desktop */}
      <aside
        className={`${
          sidebarOpen ? 'w-full lg:w-[38%] xl:w-[35%]' : 'w-0 hidden lg:block'
        } bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto z-10 transition-all duration-300 shadow-lg`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Route Hazard Dossier
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleShare}
                className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1 transition-colors"
                title="Share Route Link"
              >
                <Share2 className="w-4 h-4" />
                {copied && <span className="text-[10px] text-teal font-bold">Copied!</span>}
              </button>

              {user && (
                <button
                  onClick={handleSaveRoute}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                    saved ? 'text-teal bg-teal/10 font-bold' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                  title="Save Route"
                >
                  {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  <span>{saved ? 'Saved' : 'Save'}</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <h1 className="font-heading font-extrabold text-lg text-navy-900 leading-snug">
              {analysis.origin_label.split(',')[0]} → {analysis.destination_label.split(',')[0]}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {Math.round(analysis.distance_meters / 1000)} km • Approx.{' '}
              {Math.round(analysis.duration_seconds / 3600)}h {Math.round((analysis.duration_seconds % 3600) / 60)}m
            </p>
          </div>

          {/* Primary Risk Index Badge Banner */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Overall Corridor Risk
              </div>
              <div className="font-heading font-extrabold text-2xl text-navy-900 mt-0.5">
                {analysis.overall_risk_index}
                <span className="text-xs font-normal text-slate-500"> / 100</span>
              </div>
            </div>
            <RiskBadge level={analysis.overall_risk_level} />
          </div>
        </div>

        {/* Sidebar Body */}
        <div className="p-5 space-y-6 flex-1 text-xs text-navy-900">
          {/* Strict Safety Disclaimer Alert */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1 text-amber-950">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              Evidence Transparency Statement
            </div>
            <p className="leading-relaxed text-[11px]">
              {analysis.disclaimer}
            </p>
          </div>

          {/* Contributing Reasons Breakdown */}
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
              Key Contributing Factors
            </h3>
            <div className="space-y-1.5">
              {analysis.contributing_reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-caution flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium text-slate-800">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Intersecting Hazards List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
                Threats Along Corridor ({analysis.intersecting_incidents.length})
              </h3>
            </div>

            {analysis.intersecting_incidents.length === 0 ? (
              <p className="text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                No active official alerts currently mapped within buffer limits.
              </p>
            ) : (
              <div className="space-y-2">
                {analysis.intersecting_incidents.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedIncidentId(t.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedIncidentId === t.id
                        ? 'border-teal bg-teal/5 ring-2 ring-teal'
                        : 'border-slate-200 hover:bg-slate-50 bg-white shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <RiskBadge level={t.severity} />
                      <span className="text-[10px] text-slate-500 font-bold">
                        {Math.round(t.distance_meters / 1000)} km off route
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-sm text-navy-900 leading-snug mb-1">
                      {t.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                      <span>Source: {t.source_name}</span>
                      <Link
                        to={`/incidents/${t.id}`}
                        className="font-bold text-teal hover:underline flex items-center gap-1"
                      >
                        Dossier <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Segment Breakdown */}
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
              Corridor Segment Analysis ({analysis.segments.length} segments)
            </h3>
            <div className="space-y-2">
              {analysis.segments.map((seg) => (
                <div
                  key={seg.segment_index}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-navy-900">Segment #{seg.segment_index + 1}</span>
                    <div className="text-[11px] text-slate-500">
                      {seg.threats.length} nearby threat(s)
                    </div>
                  </div>
                  <RiskBadge level={seg.risk_level} score={seg.risk_index} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT MAP: 65% on Desktop */}
      <main className="flex-1 relative h-full">
        {/* Toggle Sidebar Button on Desktop */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-[450] bg-white text-navy-900 p-2.5 rounded-xl shadow-card border border-slate-200 hover:bg-slate-50 hidden lg:flex items-center gap-1 text-xs font-bold transition-all"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span>{sidebarOpen ? 'Collapse Sidebar' : 'Show Route Details'}</span>
        </button>

        <InteractiveMap
          routePolyline={analysis.geometry}
          alternativePolylines={analysis.alternatives.map((alt) => ({
            name: alt.name,
            geometry: alt.geometry,
          }))}
          segments={analysis.segments}
          incidents={incidents}
          selectedIncidentId={selectedIncidentId}
          onSelectIncident={(id) => setSelectedIncidentId(id)}
          height="100%"
        />
      </main>
    </div>
  );
};
