import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navigation, Trash2, ArrowRight, Bookmark, Calendar, Clock } from 'lucide-react';
import { api } from '../services/api';
import { SavedRoute } from '../types';

export const MyTripsPage: React.FC = () => {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const data = await api.listSavedRoutes();
      setRoutes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this saved corridor?')) return;
    try {
      await api.deleteSavedRoute(id);
      setRoutes(routes.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal uppercase tracking-wider mb-1">
            <Bookmark className="w-4 h-4 text-teal" />
            Travel History & Saved Corridors
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-navy-900">
            My Saved Journeys
          </h1>
        </div>

        <Link
          to="/plan"
          className="px-4 py-2.5 bg-teal hover:bg-teal-dark text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
        >
          <Navigation className="w-4 h-4" />
          <span>Plan New Journey</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading saved journeys...</p>
        </div>
      ) : routes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-card space-y-3">
          <Navigation className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-heading font-bold text-base text-navy-900">No saved journeys found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you analyze a route on the journey planner, click 'Save Route' to easily monitor active hazards over time.
          </p>
          <div className="pt-2">
            <Link
              to="/plan"
              className="inline-block px-4 py-2 bg-teal text-white rounded-xl text-xs font-bold"
            >
              Start Journey Planner
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((r) => (
            <div
              key={r.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card hover:shadow-hover transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-bold text-base text-navy-900 leading-snug">
                    {r.title}
                  </h3>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-slate-400 hover:text-alertRed hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Route"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2 text-xs text-slate-600 space-y-1">
                  <div>
                    <span className="text-slate-400">From:</span> {r.origin_label}
                  </div>
                  <div>
                    <span className="text-slate-400">To:</span> {r.destination_label}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  {Math.round(r.distance_meters / 1000)} km
                </span>
                <Link
                  to={`/dashboard/${r.id}`}
                  className="px-3.5 py-1.5 bg-navy-900 hover:bg-teal text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1 transition-colors"
                >
                  <span>Re-Assess Hazards</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
