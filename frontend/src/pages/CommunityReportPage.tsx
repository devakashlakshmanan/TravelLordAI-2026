import React, { useState } from 'react';
import {
  PlusCircle, MapPin, Camera, Clock, AlertTriangle, CheckCircle2,
  AlertCircle, Shield, ArrowRight, Crosshair
} from 'lucide-react';
import { api } from '../services/api';
import { CommunityReport } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const CommunityReportPage: React.FC = () => {
  const [category, setCategory] = useState('landslide');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number>(31.9579);
  const [longitude, setLongitude] = useState<number>(77.1095);
  const [locationName, setLocationName] = useState('NH-3 Valley Corridor');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<CommunityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(5)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(5)));
        setLocationName(`GPS Pin (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
        setGpsLoading(false);
      },
      (err) => {
        setError(`Unable to retrieve GPS position: ${err.message}`);
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError('Please provide a descriptive explanation of the hazard (minimum 10 characters).');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.submitReport({
        category,
        description,
        latitude,
        longitude,
        location_name: locationName,
        media_url: mediaUrl || undefined,
      });
      setSubmittedReport(res);
    } catch (err: any) {
      setError(err.message || 'Report submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal uppercase tracking-wider mb-1">
          <PlusCircle className="w-4 h-4 text-mint-dark" />
          Crowdsourced Citizen Hazard Intelligence
        </div>
        <h1 className="font-heading font-extrabold text-3xl text-navy-900">
          Report a Road or Terrain Hazard
        </h1>
        <p className="text-xs text-slateText mt-1 max-w-xl">
          Help fellow travelers make safer journeys across India. All community submissions enter a transparent moderation review pipeline before official corroboration.
        </p>
      </div>

      {submittedReport ? (
        <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-200 text-center space-y-4 animate-fade-in">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="font-heading font-extrabold text-2xl text-navy-900">
            Hazard Report Submitted
          </h2>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2 max-w-md mx-auto text-left">
            <div>
              <span className="font-semibold text-slate-500">Report Tracking ID:</span>
              <div className="font-mono font-bold text-navy-900">{submittedReport.id}</div>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Initial Verification State:</span>
              <div className="mt-0.5">
                <RiskBadge verification={submittedReport.moderation_state as any} />
              </div>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Notice:</span>
              <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                In adherence to TravelLord AI governance, your submission will be cross-referenced with regional bulletins before official confirmation.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => {
                setSubmittedReport(null);
                setDescription('');
              }}
              className="px-4 py-2 bg-teal text-white font-bold text-xs rounded-xl shadow-sm hover:bg-teal-dark transition-colors"
            >
              Submit Another Observation
            </button>
            <a
              href="/threats"
              className="px-4 py-2 bg-slate-100 text-navy-900 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
            >
              Explore Threat Radar
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-card border border-slate-200 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900">
              <AlertCircle className="w-4 h-4 text-alertRed flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hazard Classification
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal"
              >
                <option value="landslide">Landslide / Rockfall / Slope Failure</option>
                <option value="weather">Flash Flooding / Severe Waterlogging</option>
                <option value="wildlife">Wildlife Movement / Animal Crossing on Road</option>
                <option value="social_disruption">Highway Bandh / Protest / Blockage</option>
                <option value="road_infrastructure">Accident / Damaged Bridge / Infrastructure Failure</option>
              </select>
            </div>

            {/* Location Fields */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hazard Coordinates & Location
                </span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gpsLoading}
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal hover:underline"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>Use Device GPS Pin</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Location Name / Highway Reference
                </label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. NH-44 near Karnal Toll Plaza, Haryana"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Field Observation & Incident Details
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe current road conditions, traffic passability, physical obstruction, or active weather impacts observed..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal focus:bg-white transition-all"
              ></textarea>
              <span className="text-[11px] text-slate-400">
                Minimum 10 characters. Avoid private identities or unverified rumors.
              </span>
            </div>

            {/* Optional Photo URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Optional Supporting Photo URL / Evidence Link
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
                <Camera className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://example.com/photo-evidence.jpg"
                  className="w-full bg-transparent text-xs font-medium focus:outline-none text-navy-900"
                />
              </div>
            </div>

            {/* Transparency Notice */}
            <div className="p-3.5 bg-warmWhite rounded-xl border border-slate-200 text-xs text-slateText space-y-1">
              <div className="font-bold text-navy-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-teal" />
                Responsible Reporting Policy
              </div>
              <p className="text-[11px] leading-relaxed">
                Reports are checked by automated geospatial proximity models and platform moderators. Sensitive wildlife sightings will have coordinates fuzzed automatically to protect animals.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-teal hover:bg-teal-dark disabled:opacity-70 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Submit Hazard for Review</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
