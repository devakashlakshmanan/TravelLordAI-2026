import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass, Navigation, AlertTriangle, ShieldCheck, Bookmark,
  Bell, User, ChevronRight, PlusCircle, Bot, Radio, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SavedRoute, Incident, NotificationItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [routes, alerts, notifs] = await Promise.all([
          api.listSavedRoutes(),
          api.getAlerts(),
          api.getNotifications(),
        ]);
        setSavedRoutes(routes);
        setActiveAlerts(alerts.slice(0, 3));
        setNotifications(notifs.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal/30 text-mint text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Traveler Profile
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl">
            Welcome back, {user?.name || 'Traveler'}
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            TravelLord AI active monitor: 5 threat dimensions continuously monitored across Indian transit corridors.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/plan"
            className="px-4 py-2.5 bg-mint hover:bg-mint-dark text-navy-900 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Navigation className="w-4 h-4" />
            <span>Plan New Journey</span>
          </Link>
          <Link
            to="/report"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Hazard</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Saved Routes (8 cols) + Alerts/Notifs (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/plan"
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-card hover:border-teal transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal/10 text-teal flex items-center justify-center group-hover:bg-teal group-hover:text-white transition-colors">
                <Navigation className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-navy-900">Plan Route</span>
            </Link>

            <Link
              to="/threats"
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-card hover:border-teal transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-navy-900">Threat Radar</span>
            </Link>

            <Link
              to="/assistant"
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-card hover:border-teal transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal/10 text-teal flex items-center justify-center group-hover:bg-teal group-hover:text-white transition-colors">
                <Bot className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-navy-900">AI Assistant</span>
            </Link>

            <Link
              to="/profile"
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-card hover:border-teal transition-all flex flex-col items-center text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-navy-900 group-hover:text-white transition-colors">
                <User className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-navy-900">Preferences</span>
            </Link>
          </div>

          {/* Saved Routes Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-teal" />
                <h2 className="font-heading font-bold text-base text-navy-900">
                  Your Saved Travel Corridors
                </h2>
              </div>
              <Link to="/my-trips" className="text-xs font-bold text-teal hover:underline flex items-center gap-1">
                View All ({savedRoutes.length}) <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="h-32 bg-slate-50 animate-pulse rounded-xl"></div>
            ) : savedRoutes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <Navigation className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-xs text-navy-900">No saved journeys yet.</p>
                <p className="text-[11px] text-slate-500">
                  Analyze a route and click "Save Route" to pin it to your dashboard.
                </p>
                <div className="pt-2">
                  <Link
                    to="/plan"
                    className="inline-block px-3 py-1.5 bg-teal text-white rounded-lg text-xs font-bold"
                  >
                    Plan First Route
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {savedRoutes.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-teal transition-all flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-sm text-navy-900">{r.title}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {r.origin_label.split(',')[0]} → {r.destination_label.split(',')[0]} •{' '}
                        {Math.round(r.distance_meters / 1000)} km
                      </div>
                    </div>
                    <Link
                      to={`/dashboard/${r.id}`}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-teal hover:text-white rounded-lg text-xs font-bold text-navy-900 shadow-sm transition-all flex items-center gap-1"
                    >
                      <span>Check Status</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Warnings & Notifications (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* High Priority Alerts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                <Radio className="w-4 h-4 text-alertRed animate-pulse" />
                <span>Critical National Advisories</span>
              </div>
              <Link to="/threats" className="text-[11px] font-bold text-teal hover:underline">
                View All
              </Link>
            </div>

            {activeAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                No high-priority warnings currently active.
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeAlerts.map((alert) => (
                  <Link
                    key={alert.id}
                    to={`/incidents/${alert.id}`}
                    className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <RiskBadge level={alert.platform_severity} />
                      <span className="text-[10px] text-slate-500 font-semibold">{alert.source_name}</span>
                    </div>
                    <h4 className="font-bold text-xs text-navy-900 line-clamp-1">{alert.title}</h4>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* In-App Notifications */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                <Bell className="w-4 h-4 text-teal" />
                <span>Travel Alerts & Notifications</span>
              </div>
              <Link to="/notifications" className="text-[11px] font-bold text-teal hover:underline">
                Manage
              </Link>
            </div>

            {notifications.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                No new notifications. Saved corridor alerts will appear here.
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-navy-900">{n.title}</div>
                    <div className="text-[11px] text-slateText">{n.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
