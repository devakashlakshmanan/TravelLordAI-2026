import React, { useState } from 'react';
import { User, Shield, CheckCircle2, Save, Car, Bike, Globe, Bell, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [preferredMode, setPreferredMode] = useState(user?.preferences?.preferred_travel_mode || 'driving');
  const [preferredLang, setPreferredLang] = useState(user?.preferences?.preferred_language || 'en');
  const [weatherAlerts, setWeatherAlerts] = useState(
    user?.preferences?.notification_preferences?.weather_warnings ?? true
  );
  const [routeAlerts, setRouteAlerts] = useState(
    user?.preferences?.notification_preferences?.route_alerts ?? true
  );
  const [shareLiveLocation, setShareLiveLocation] = useState(
    user?.preferences?.privacy_settings?.share_live_location ?? false
  );

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await api.updateMe({
        name,
        preferred_travel_mode: preferredMode,
        preferred_language: preferredLang,
        notification_preferences: {
          weather_warnings: weatherAlerts,
          route_alerts: routeAlerts,
        },
        privacy_settings: {
          share_live_location: shareLiveLocation,
        },
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal uppercase tracking-wider mb-1">
          <User className="w-4 h-4 text-teal" />
          Personalized Traveler Configuration
        </div>
        <h1 className="font-heading font-extrabold text-3xl text-navy-900">
          Profile & Preferences
        </h1>
        <p className="text-xs text-slateText mt-1">
          Customize your default travel mode, risk threshold notifications, and privacy controls.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-card border border-slate-200 space-y-6">
        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-900 animate-fade-in font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Preferences saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-sm text-navy-900 uppercase tracking-wider text-xs">
              Account Information
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address (Permanent Identifier)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Travel Preferences */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <h3 className="font-heading font-bold text-sm text-navy-900 uppercase tracking-wider text-xs">
              Travel & Regional Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Default Travel Mode
                </label>
                <select
                  value={preferredMode}
                  onChange={(e) => setPreferredMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal"
                >
                  <option value="driving">Car / 4-Wheeler Highway Travel</option>
                  <option value="motorcycle">Motorcycle / 2-Wheeler</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Language
                </label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal"
                >
                  <option value="en">English (Official Bulletins)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="font-heading font-bold text-sm text-navy-900 uppercase tracking-wider text-xs">
              Notification Preferences
            </h3>

            <label className="flex items-center gap-2 text-xs text-navy-900 cursor-pointer">
              <input
                type="checkbox"
                checked={weatherAlerts}
                onChange={(e) => setWeatherAlerts(e.target.checked)}
                className="rounded accent-teal"
              />
              <span className="font-medium">
                Severe Meteorological Warnings (IMD Red/Orange alerts along saved routes)
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs text-navy-900 cursor-pointer">
              <input
                type="checkbox"
                checked={routeAlerts}
                onChange={(e) => setRouteAlerts(e.target.checked)}
                className="rounded accent-teal"
              />
              <span className="font-medium">
                Highway Closures & Critical Blockades (Immediate corridor updates)
              </span>
            </label>
          </div>

          {/* Privacy & Trusted Contact Controls */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="font-heading font-bold text-sm text-navy-900 uppercase tracking-wider text-xs">
              Privacy & Geospatial Safeguards
            </h3>

            <label className="flex items-center gap-2 text-xs text-navy-900 cursor-pointer">
              <input
                type="checkbox"
                checked={shareLiveLocation}
                onChange={(e) => setShareLiveLocation(e.target.checked)}
                className="rounded accent-teal"
              />
              <span className="font-medium">
                Allow temporary location sharing with Trusted Contacts during active journeys
              </span>
            </label>
            <p className="text-[11px] text-slate-500">
              User location traces are processed in ephemeral memory and never stored permanently in telemetry databases.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-teal hover:bg-teal-dark disabled:opacity-75 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
