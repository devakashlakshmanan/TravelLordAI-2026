import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Navigation, AlertTriangle, Bot, PlusCircle, User as UserIcon, Menu, X, LogOut, Bell, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-mint group-hover:bg-teal transition-colors shadow-sm">
              <Shield className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-navy-900">
                TravelLord <span className="text-teal font-black">AI</span>
              </span>
              <span className="hidden sm:block text-[10px] tracking-wider font-semibold text-slateText uppercase">
                India Risk Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/plan"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/plan') ? 'bg-teal/10 text-teal font-semibold' : 'text-slateText hover:text-navy-900 hover:bg-slate-50'
              }`}
            >
              <Navigation className="w-4 h-4 text-teal" />
              Plan Journey
            </Link>

            <Link
              to="/threats"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/threats') ? 'bg-teal/10 text-teal font-semibold' : 'text-slateText hover:text-navy-900 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-caution" />
              Threat Centre
            </Link>

            <Link
              to="/assistant"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/assistant') ? 'bg-teal/10 text-teal font-semibold' : 'text-slateText hover:text-navy-900 hover:bg-slate-50'
              }`}
            >
              <Bot className="w-4 h-4 text-teal" />
              AI Assistant
            </Link>

            <Link
              to="/report"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/report') ? 'bg-teal/10 text-teal font-semibold' : 'text-slateText hover:text-navy-900 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-mint-dark" />
              Report Hazard
            </Link>
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/notifications"
                  className="p-2 text-slateText hover:text-navy-900 hover:bg-slate-100 rounded-lg relative transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-alertRed rounded-full"></span>
                </Link>

                <Link
                  to="/app"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    isActive('/app') ? 'bg-navy-900 text-white' : 'text-navy-900 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Dashboard
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold rounded-lg transition-colors border border-purple-300"
                  >
                    Admin Portal
                  </Link>
                )}

                <div className="relative group">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </Link>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slateText hover:text-alertRed hover:bg-red-50 rounded-lg transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-navy-900 hover:text-teal transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal hover:bg-teal-dark rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-navy-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          <Link
            to="/plan"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-navy-900 hover:bg-slate-100"
          >
            <Navigation className="w-5 h-5 text-teal" />
            Plan Journey
          </Link>
          <Link
            to="/threats"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-navy-900 hover:bg-slate-100"
          >
            <AlertTriangle className="w-5 h-5 text-caution" />
            Threat Centre
          </Link>
          <Link
            to="/assistant"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-navy-900 hover:bg-slate-100"
          >
            <Bot className="w-5 h-5 text-teal" />
            AI Assistant
          </Link>
          <Link
            to="/report"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-navy-900 hover:bg-slate-100"
          >
            <PlusCircle className="w-5 h-5 text-mint-dark" />
            Report a Hazard
          </Link>

          <div className="pt-3 border-t border-slate-200">
            {user ? (
              <div className="space-y-2">
                <Link
                  to="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-navy-900 hover:bg-slate-100"
                >
                  <Compass className="w-5 h-5 text-teal" />
                  User Dashboard
                </Link>
                <Link
                  to="/my-trips"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-navy-900 hover:bg-slate-100"
                >
                  <Navigation className="w-5 h-5 text-slateText" />
                  My Saved Journeys
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-navy-900 hover:bg-slate-100"
                >
                  <UserIcon className="w-5 h-5 text-slateText" />
                  Profile & Preferences
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-bold text-purple-900 bg-purple-50 hover:bg-purple-100"
                  >
                    Admin Portal
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-alertRed hover:bg-red-50 text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Log Out
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center font-semibold text-navy-900 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center font-semibold text-white bg-teal hover:bg-teal-dark rounded-lg shadow-sm"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
