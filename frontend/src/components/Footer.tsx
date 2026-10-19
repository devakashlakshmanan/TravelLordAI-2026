import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-900 text-slate-300 border-t border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-heading font-extrabold text-xl text-white tracking-tight">
                TravelLord <span className="text-mint">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              "Travel informed. Travel aware." Multi-threat travel risk intelligence across India's highways, rural corridors, and mountain passes.
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              © {new Date().getFullYear()} TravelLord AI Platform. All rights reserved.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-3 tracking-wider uppercase">
              Platform Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/plan" className="hover:text-mint transition-colors">Journey Hazard Planner</Link></li>
              <li><Link to="/threats" className="hover:text-mint transition-colors">India Threat Map & Center</Link></li>
              <li><Link to="/assistant" className="hover:text-mint transition-colors">Evidence-Grounded AI Assistant</Link></li>
              <li><Link to="/report" className="hover:text-mint transition-colors">Citizen Hazard Reporting</Link></li>
              <li><Link to="/app" className="hover:text-mint transition-colors">Personal Travel Dashboard</Link></li>
            </ul>
          </div>

          {/* Evidence & Methodology */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-3 tracking-wider uppercase">
              Trust & Transparency
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/docs/data_sources.md" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-mint transition-colors">
                  Data Sources Registry <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="/docs/risk_methodology.md" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-mint transition-colors">
                  Multi-Threat Fusion Methodology <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="/docs/security_and_privacy.md" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-mint transition-colors">
                  Anti-Poaching & Wildlife Privacy <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="/docs" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-mint transition-colors">
                  FastAPI OpenAPI Specification <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link to="/admin" className="text-purple-300 hover:text-purple-200 transition-colors">
                  Admin Governance Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety Disclaimer */}
          <div className="bg-navy-800/80 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
              <AlertCircle className="w-4 h-4" />
              Safety Principle & Disclaimer
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Absence of an alert along any route is not proof of safety. TravelLord AI aggregates official advisories (IMD, NDMA, GSI) and verified community submissions. Always exercise independent driver vigilance.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
