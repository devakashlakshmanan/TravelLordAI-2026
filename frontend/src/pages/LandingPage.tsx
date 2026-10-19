import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Navigation, AlertTriangle, CloudRain, Mountain, PawPrint,
  Radio, Compass, ArrowRight, CheckCircle2, ChevronRight, HelpCircle,
  Clock, ShieldAlert, Sparkles, Database, FileCheck, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { Incident, ThreatSummary } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('New Delhi, Delhi, India');
  const [destination, setDestination] = useState('Manali, Himachal Pradesh, India');
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [threatSummary, setThreatSummary] = useState<ThreatSummary | null>(null);
  const [loadingLive, setLoadingLive] = useState(true);

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const [incidents, summary] = await Promise.all([
          api.getIncidents({ include_sample: false }),
          api.getThreatSummary(),
        ]);
        setRecentIncidents(incidents.slice(0, 4));
        setThreatSummary(summary);
      } catch (err) {
        console.error('Failed to load live data', err);
      } finally {
        setLoadingLive(false);
      }
    };
    fetchLiveData();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/plan?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-navy-900 to-navy-800 text-white pt-16 pb-24 lg:pt-20 lg:pb-32">
        {/* Background Subtle Grid Texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#65D6AD_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal/20 text-mint text-xs font-bold border border-teal/40">
              <Sparkles className="w-4 h-4 text-mint" />
              Pan-India Multi-Threat Travel Risk Intelligence
            </div>

            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight sm:leading-none text-white">
              Travel informed. <span className="text-mint">Travel aware.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
              Understand hazards, examine real-world evidence, and make better-informed travel decisions across national highways, mountain passes, and remote corridors.
            </p>
          </div>

          {/* Hero Journey Search Bar */}
          <div className="mt-10 max-w-3xl mx-auto">
            <form
              onSubmit={handleHeroSearch}
              className="bg-white p-3 sm:p-4 rounded-2xl shadow-hover border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-navy-900"
            >
              <div className="sm:col-span-5 relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Starting Point (Origin)
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <Navigation className="w-4 h-4 text-teal flex-shrink-0" />
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Enter departure city or highway..."
                    className="w-full bg-transparent text-sm font-semibold focus:outline-none text-navy-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="sm:col-span-5 relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Destination
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <Compass className="w-4 h-4 text-mint-dark flex-shrink-0" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter destination location..."
                    className="w-full bg-transparent text-sm font-semibold focus:outline-none text-navy-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 pt-2 sm:pt-4">
                <button
                  type="submit"
                  className="w-full h-11 bg-teal hover:bg-teal-dark text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all transform active:scale-95"
                >
                  <span>Check Risks</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 gap-2">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-mint" />
                Open to all travelers — No account required to check public routes
              </span>
              <Link to="/threats" className="text-mint hover:underline font-semibold flex items-center gap-1">
                Or explore the Live India Threat Map <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME THREAT RADAR OVERVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal font-bold text-xs uppercase tracking-wider">
              <Radio className="w-4 h-4 animate-pulse text-alertRed" />
              Real-Time Public Threat Intelligence
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-navy-900 mt-1">
              Active Verified Alerts Across India
            </h2>
            <p className="text-slateText text-sm mt-1 max-w-xl">
              Authentic observations and official warnings directly retrieved from IMD, GSI, and state traffic police feeds.
            </p>
          </div>

          <Link
            to="/threats"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-teal bg-teal/10 hover:bg-teal/20 transition-colors"
          >
            Open Interactive Threat Map <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Live Threat Cards */}
        {loadingLive ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div>
            ))}
          </div>
        ) : recentIncidents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-card">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="font-semibold text-navy-900 text-sm">No critical warnings currently broadcast.</p>
            <p className="text-slateText text-xs mt-1">
              Absence of an alert is not proof of safety. Continue monitoring local weather before travel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentIncidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:shadow-hover transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <RiskBadge level={inc.platform_severity} />
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(inc.published_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-sm text-navy-900 line-clamp-2 leading-snug mb-2">
                    {inc.title}
                  </h3>

                  <p className="text-slateText text-xs line-clamp-3 leading-relaxed mb-4">
                    {inc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 truncate max-w-[140px]" title={inc.source_name}>
                    {inc.source_name}
                  </span>
                  <Link
                    to={`/incidents/${inc.id}`}
                    className="font-bold text-teal hover:underline flex items-center gap-1"
                  >
                    Details <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. MULTI-THREAT COVERAGE ARCHITECTURE */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-heading font-extrabold text-3xl text-navy-900">
              Five Critical Threat Dimensions
            </h2>
            <p className="text-slateText text-sm mt-2">
              Most map providers only show basic traffic slowdowns. TravelLord AI evaluates systemic physical and environmental risks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                <CloudRain className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-navy-900">Weather & Flooding</h3>
              <p className="text-xs text-slateText leading-relaxed">
                Monsoonal rainfall forecasts, river overflow advisories, and winter highway fog alerts from IMD and CWC.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Mountain className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-navy-900">Geotechnical Slopes</h3>
              <p className="text-xs text-slateText leading-relaxed">
                Geological Survey of India landslide susceptibility mappings, active debris flows, and rockfall risk along mountain highways.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <PawPrint className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-navy-900">Wildlife Corridors</h3>
              <p className="text-xs text-slateText leading-relaxed">
                Elephant crossings and night transit restrictions through sanctuaries, with anti-poaching coordinate privacy.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-navy-900">Social Disruptions</h3>
              <p className="text-xs text-slateText leading-relaxed">
                Verified highway bandhs, tractor marches, farmer gatherings, and civic perimeter diversions.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-navy-900">Road Infrastructure</h3>
              <p className="text-xs text-slateText leading-relaxed">
                Waterlogged urban subways, collapsed culverts, major accident bottlenecks, and long-term highway diversions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading font-extrabold text-3xl text-navy-900">
            How TravelLord AI Evaluates Your Journey
          </h2>
          <p className="text-slateText text-sm mt-2">
            Evidence-grounded spatial corridor analysis in four transparent steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-card space-y-3">
            <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-heading font-bold text-base text-navy-900">Enter Journey</h3>
            <p className="text-xs text-slateText leading-relaxed">
              Input departure and destination. The system retrieves driving routes and viable alternatives via OSRM.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-card space-y-3">
            <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-heading font-bold text-base text-navy-900">Corridor Buffering</h3>
            <p className="text-xs text-slateText leading-relaxed">
              We slice your route into 20 km segments and query hazard buffers (2 km to 30 km depending on threat category).
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-card space-y-3">
            <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-heading font-bold text-base text-navy-900">Evidence Risk Fusion</h3>
            <p className="text-xs text-slateText leading-relaxed">
              Each hazard is weighted by base severity, distance decay, and source quality (official vs citizen report).
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-card space-y-3">
            <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="font-heading font-bold text-base text-navy-900">Compare & Decide</h3>
            <p className="text-xs text-slateText leading-relaxed">
              Inspect alternative corridors with trade-off explanations. A route is never falsely declared "100% safe".
            </p>
          </div>
        </div>
      </section>

      {/* 5. TRUST & TRANSPARENCY PRINCIPLES */}
      <section className="bg-navy-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-mint">
              Platform Integrity & Governance
            </span>
            <h2 className="font-heading font-extrabold text-3xl text-white">
              Built on Evidence, Not Guarantees
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Travel safety requires honest transparency. Here is how TravelLord AI safeguards your trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-navy-800/90 p-6 rounded-2xl border border-slate-700 space-y-3">
              <Database className="w-6 h-6 text-mint" />
              <h3 className="font-heading font-bold text-base text-white">Source Attribution</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every hazard card cites the specific authority (IMD, NDMA, GSI, Traffic Police) and observation timestamp.
              </p>
            </div>

            <div className="bg-navy-800/90 p-6 rounded-2xl border border-slate-700 space-y-3">
              <FileCheck className="w-6 h-6 text-mint" />
              <h3 className="font-heading font-bold text-base text-white">Controlled Verification</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Citizen submissions enter a strict moderation pipeline. Users cannot self-promote reports to official status.
              </p>
            </div>

            <div className="bg-navy-800/90 p-6 rounded-2xl border border-slate-700 space-y-3">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              <h3 className="font-heading font-bold text-base text-white">Zero-Incident Principle</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                If no hazard is found along a route, we state "No reported alerts in current window", never a false "100% Safe" label.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-heading font-extrabold text-3xl text-navy-900">
            Frequently Asked Questions
          </h2>
          <p className="text-slateText text-sm mt-2">
            Common questions regarding TravelLord AI's coverage, sources, and data policies.
          </p>
        </div>

        <div className="space-y-4">
          <details className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer group">
            <summary className="font-heading font-bold text-base text-navy-900 flex justify-between items-center">
              <span>What is TravelLord AI?</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="mt-3 text-xs text-slateText leading-relaxed">
              TravelLord AI is an evidence-driven travel risk intelligence platform designed for India. It integrates meteorological warnings, landslide susceptibility data, wildlife corridors, and road blockages to help travelers make informed decisions.
            </p>
          </details>

          <details className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer group">
            <summary className="font-heading font-bold text-base text-navy-900 flex justify-between items-center">
              <span>Does it cover all of India?</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="mt-3 text-xs text-slateText leading-relaxed">
              Yes. It covers national highways, state corridors, and district arteries across all 28 states and 8 union territories, with specialized geological attention on the Himalayas and Western Ghats.
            </p>
          </details>

          <details className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer group">
            <summary className="font-heading font-bold text-base text-navy-900 flex justify-between items-center">
              <span>Where does the data come from?</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="mt-3 text-xs text-slateText leading-relaxed">
              From open public government feeds including the India Meteorological Department (IMD), National Disaster Management Authority (NDMA), Geological Survey of India (GSI), and verified community submissions.
            </p>
          </details>

          <details className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer group">
            <summary className="font-heading font-bold text-base text-navy-900 flex justify-between items-center">
              <span>Can users report hazards without an account?</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="mt-3 text-xs text-slateText leading-relaxed">
              Yes! Anyone can submit a hazard on the Report page. However, all new community reports enter a 'pending_review' moderation queue before being confirmed.
            </p>
          </details>
        </div>
      </section>

      {/* 7. FINAL CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal to-navy-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl">
              Ready to check the journey ahead?
            </h2>
            <p className="text-slate-200 text-sm max-w-lg">
              Start with our journey planner or view the pan-India threat radar without signing up.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/plan"
              className="px-6 py-3 bg-mint hover:bg-mint-dark text-navy-900 font-extrabold text-sm rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
            >
              Plan Journey Now
            </Link>
            <Link
              to="/threats"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 transition-all"
            >
              Explore Threat Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
