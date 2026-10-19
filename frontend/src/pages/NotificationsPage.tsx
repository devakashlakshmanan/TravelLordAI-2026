import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { Link } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4 text-teal" />
            Travel Intelligence Bulletins
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-navy-900">
            Notifications
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Checking bulletins...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-card space-y-2">
          <CheckCheck className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-heading font-bold text-base text-navy-900">You're all caught up!</h3>
          <p className="text-xs text-slate-500">
            Real-time updates regarding your saved journeys and new national advisories will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                n.is_read ? 'bg-white' : 'bg-teal/5'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-navy-900">{n.title}</span>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-alertRed flex-shrink-0"></span>
                  )}
                </div>
                <p className="text-xs text-slateText leading-relaxed">{n.message}</p>
                <div className="text-[10px] text-slate-400">
                  {new Date(n.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex-shrink-0 transition-colors"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
