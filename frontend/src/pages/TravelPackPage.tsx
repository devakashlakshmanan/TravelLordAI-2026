import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { SavedRoute, Incident } from '../types';
import {
  Printer, Download, Shield, MapPin, AlertTriangle, Phone, CheckSquare,
  Clock, Compass, Car, FileText, ChevronRight, Info, ArrowLeft, RefreshCw
} from 'lucide-react';

export const TravelPackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const routeIdParam = searchParams.get('routeId');

  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SavedRoute | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [customOrigin, setCustomOrigin] = useState<string>('New Delhi, Delhi');
  const [customDest, setCustomDest] = useState<string>('Manali, Himachal Pradesh');
  const [generationDate] = useState<string>(new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }));

  // Emergency contact directories for travel packs
  const emergencyNumbers = [
    { name: 'National Emergency Helpline', number: '112', purpose: 'Police, Fire, Ambulance pan-India' },
    { name: 'National Highways Helpline (NHAI)', number: '1033', purpose: 'Highway ambulance, crane, breakdown assistance' },
    { name: 'Medical / Ambulance Services', number: '108', purpose: 'Emergency medical transport & trauma' },
    { name: 'National Disaster Response (NDRF)', number: '1078', purpose: 'Severe flood, landslide or disaster coordination' },
    { name: 'Mountain Rescue / BRO Control (Northern)', number: '01902-252251', purpose: 'Manali-Leh & High Altitude corridors' },
  ];

  const travelChecklist = [
    { title: 'Vehicle Mechanical Verification', desc: 'Engine coolant, brake fluid, wiper blades, tyre pressure and functional spare tyre.' },
    { title: 'Offline Navigation Pack', desc: 'Download offline Google Maps / OSM maps for the entire travel corridor before signal dropouts.' },
    { title: 'Fuel & High-Altitude Planning', desc: 'Fuel up at major junction towns; high passes often have stretches exceeding 150 km without retail pumps.' },
    { title: 'Weather & Night Driving Window', desc: 'Avoid traversing ghats and landslide-prone mountain sectors during active night rainfall.' },
    { title: 'Emergency Cash & Essential Kit', desc: 'Keep physical cash for remote toll plazas or rural fuel pumps where UPI connectivity is intermittent.' },
    { title: 'Official Permit Documents', desc: 'Carry printed copies of Aadhaar/ID and valid Inner Line Permits (ILP) if heading into restricted border districts.' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [routes, alerts] = await Promise.all([
          api.listSavedRoutes().catch(() => []),
          api.getIncidents({ limit: 40 }).catch(() => []),
        ]);
        setSavedRoutes(routes);
        setActiveAlerts(alerts);

        if (routeIdParam && routes.length > 0) {
          const matched = routes.find((r) => r.id === routeIdParam);
          if (matched) {
            setSelectedRoute(matched);
            setCustomOrigin(matched.origin_label);
            setCustomDest(matched.destination_label);
          }
        } else if (routes.length > 0) {
          setSelectedRoute(routes[0]);
          setCustomOrigin(routes[0].origin_label);
          setCustomDest(routes[0].destination_label);
        }
      } catch (err) {
        console.error('Error loading travel pack data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routeIdParam]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-warmWhite py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 print:px-0">
        {/* Navigation & Controls Bar (Hidden during print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              to="/plan"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Planner
            </Link>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-medium text-slate-600">Travel Readiness Dossier</span>
          </div>

          <div className="flex items-center gap-3">
            {savedRoutes.length > 0 && (
              <select
                aria-label="Load Saved Journey"
                value={selectedRoute?.id || ''}
                onChange={(e) => {
                  const r = savedRoutes.find((x) => x.id === e.target.value);
                  if (r) {
                    setSelectedRoute(r);
                    setCustomOrigin(r.origin_label);
                    setCustomDest(r.destination_label);
                  }
                }}
                className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal/30 font-medium"
              >
                <option value="">-- Load Saved Journey --</option>
                {savedRoutes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || `${r.origin_label} → ${r.destination_label}`}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal text-white text-xs font-bold hover:bg-teal/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal/40"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 print:border-none print:shadow-none print:p-0 print:rounded-none">
          {/* Header */}
          <div className="border-b border-slate-200 pb-6 mb-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 text-teal font-black text-lg">
                  <Shield className="w-5 h-5 text-teal" />
                  TravelLord AI
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-black text-navy-900 mt-1">
                  Corridor Travel Pack & Safety Briefing
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Verified transit advisories, route emergency points, and situational guidance for Indian travel corridors.
                </p>
              </div>

              <div className="text-right flex-shrink-0 text-xs text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-xl print:border-slate-300">
                <div className="font-bold text-navy-900">Generated Dossier</div>
                <div>{generationDate}</div>
                <div className="text-[10px] text-teal font-semibold mt-1">Official Data Freshness Sync</div>
              </div>
            </div>

            {/* Route Details Box */}
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    A
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Origin Corridor</span>
                    <span className="text-sm font-bold text-navy-900">{customOrigin}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-mint/20 text-teal flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    B
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Destination Corridor</span>
                    <span className="text-sm font-bold text-navy-900">{customDest}</span>
                  </div>
                </div>
              </div>

              {selectedRoute && (
                <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-4 text-xs text-slate-600">
                  <div>
                    Distance: <strong className="text-navy-900">{(selectedRoute.distance_meters / 1000).toFixed(0)} km</strong>
                  </div>
                  <div>
                    Transit Time: <strong className="text-navy-900">{Math.round(selectedRoute.duration_seconds / 3600)} hrs</strong>
                  </div>
                  <div>
                    Travel Mode: <strong className="text-navy-900">Road Corridor (Pan-India)</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documented Active Alerts Section */}
          <div className="mb-8">
            <h2 className="text-base font-heading font-bold text-navy-900 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Documented Regional Warnings & Pass Alerts
            </h2>
            <div className="space-y-3">
              {activeAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs text-navy-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{alert.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-semibold text-slate-700">
                        {alert.hazard_category}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-snug">{alert.description}</p>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 sm:text-right flex-shrink-0">
                    <MapPin className="w-3 h-3 text-teal" />
                    {alert.location_name || 'Corridor zone'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Helplines Section */}
          <div className="mb-8">
            <h2 className="text-base font-heading font-bold text-navy-900 flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4 text-teal" />
              Pan-India Highway Emergency Helplines
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {emergencyNumbers.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                    {item.number}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-navy-900">{item.name}</div>
                    <div className="text-[11px] text-slate-500">{item.purpose}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Corridor Readiness Checklist */}
          <div className="mb-8">
            <h2 className="text-base font-heading font-bold text-navy-900 flex items-center gap-2 mb-3">
              <CheckSquare className="w-4 h-4 text-teal" />
              Essential Travel Preparation Checklist
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {travelChecklist.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded border border-slate-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-navy-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Disclaimers & Integrity Note */}
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-navy-900">
              <Info className="w-4 h-4 text-teal flex-shrink-0" />
              Document Integrity & Safety Disclosure
            </div>
            <p className="text-[11px] leading-relaxed">
              This dossier contains factual alerts documented by official Indian agencies (IMD, CWC, NHAI, State Police)
              and corroborated citizen observers. Lack of documented alerts on a stretch does <strong>not</strong> guarantee
              absence of road hazards. Always follow official on-ground signage, local law enforcement directives, and weather advisories.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
