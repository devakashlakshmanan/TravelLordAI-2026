import React from 'react';
import { AlertTriangle, ShieldCheck, AlertCircle, Info, Clock, HelpCircle } from 'lucide-react';

interface RiskBadgeProps {
  level?: 'low' | 'moderate' | 'high' | 'critical';
  verification?: string;
  category?: string;
  isSample?: boolean;
  score?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, verification, category, isSample, score }) => {
  if (isSample) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-300">
        <Info className="w-3.5 h-3.5" />
        SAMPLE DATA — NOT A LIVE ALERT
      </span>
    );
  }

  if (verification) {
    switch (verification) {
      case 'official':
      case 'officially_confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            Official Authority Alert
          </span>
        );
      case 'verified_community':
      case 'corroborated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-900 border border-teal-300">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            Verified Community Report
          </span>
        );
      case 'historical_susceptibility':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-700" />
            Historical Susceptibility Zone
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <Info className="w-3.5 h-3.5 text-slate-600" />
            Resolved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            Rejected
          </span>
        );
      case 'unverified':
      case 'pending_review':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
            {verification === 'pending_review' ? 'Pending Moderation Review' : 'Unverified Citizen Submission'}
          </span>
        );
    }
  }

  if (level) {
    switch (level) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
            <AlertCircle className="w-4 h-4 text-red-700" />
            CRITICAL RISK {score !== undefined ? `(${score}/100)` : ''}
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-950 border border-orange-300">
            <AlertTriangle className="w-4 h-4 text-orange-700" />
            HIGH RISK {score !== undefined ? `(${score}/100)` : ''}
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            MODERATE RISK {score !== undefined ? `(${score}/100)` : ''}
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
            <Info className="w-4 h-4 text-emerald-700" />
            ELEVATED ATTENTION {score !== undefined ? `(${score}/100)` : ''}
          </span>
        );
    }
  }

  if (category) {
    const formatted = category.replace('_', ' ').toUpperCase();
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {formatted}
      </span>
    );
  }

  return null;
};
