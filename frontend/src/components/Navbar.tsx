import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, Navigation, AlertTriangle, Bot, PlusCircle, User as UserIcon,
  Menu, X, LogOut, Bell, Compass, ChevronDown, Bookmark, Radio, FileText,
  Construction, Printer, BookOpen, Users, ShieldCheck, Database, LifeBuoy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  type NavDropdownId = 'journey' | 'explore' | 'community' | 'trust';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<NavDropdownId | null>(null);
  const [isClickLocked, setIsClickLocked] = useState(false);
  const [mobileSectionOpen, setMobileSectionOpen] = useState<{ [key: string]: boolean }>({
    journey: true,
    explore: false,
    community: false,
    trust: false,
  });

  const navRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRefs = useRef<{ [key in NavDropdownId]?: HTMLButtonElement | null }>({});

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleTriggerClick = (name: NavDropdownId) => {
    clearCloseTimeout();
    if (openDropdown === name) {
      setOpenDropdown(null);
      setIsClickLocked(false);
    } else {
      setOpenDropdown(name);
      setIsClickLocked(true);
    }
  };

  const handleGroupMouseEnter = (name: NavDropdownId) => {
    clearCloseTimeout();
    // Do not override a dropdown that the user deliberately opened by clicking
    if (isClickLocked) {
      return;
    }
    setOpenDropdown(name);
  };

  const handleGroupMouseLeave = () => {
    // If deliberately opened by click, mouse leave MUST NEVER close it
    if (isClickLocked) {
      return;
    }
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 200);
  };

  const handleSubmenuMouseEnter = () => {
    clearCloseTimeout();
  };

  const handleSubmenuLinkClick = () => {
    clearCloseTimeout();
    setOpenDropdown(null);
    setIsClickLocked(false);
  };

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        clearCloseTimeout();
        setOpenDropdown(null);
        setIsClickLocked(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (openDropdown) {
          const currentTrigger = triggerRefs.current[openDropdown];
          clearCloseTimeout();
          setOpenDropdown(null);
          setIsClickLocked(false);
          currentTrigger?.focus();
        }
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearCloseTimeout();
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown]);

  // Close menus on route change
  useEffect(() => {
    clearCloseTimeout();
    setOpenDropdown(null);
    setIsClickLocked(false);
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isJourneyActive =
    location.pathname === '/plan' ||
    location.pathname === '/my-trips' ||
    location.pathname === '/roadwatch' ||
    location.pathname === '/travel-pack' ||
    location.pathname.startsWith('/dashboard/');

  const isExploreActive =
    location.pathname === '/discover' ||
    location.pathname === '/travelwise' ||
    location.pathname === '/hazard-guide' ||
    location.pathname === '/threats' ||
    location.pathname.startsWith('/incidents/');

  const isCommunityActive =
    location.pathname === '/live-reports' ||
    location.pathname === '/report' ||
    location.pathname === '/my-reports';

  const isTrustActive =
    location.pathname === '/official-alerts' ||
    location.pathname === '/source-centre' ||
    location.pathname === '/emergency-guide';

  const isAssistantActive = location.pathname === '/assistant';
  const isDashboardActive = location.pathname === '/app';

  const toggleMobileSection = (section: string) => {
    setMobileSectionOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <header className="sticky top-0 z-[1020] bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-2">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-navy-900 flex items-center justify-center text-mint group-hover:bg-teal transition-colors shadow-xs flex-shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-navy-900 leading-tight">
                TravelLord <span className="text-teal font-black">AI</span>
              </span>
              <span className="hidden sm:block text-[9px] xl:text-[10px] tracking-wider font-semibold text-slateText uppercase leading-none mt-0.5">
                India Risk Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links — Only visible to Authenticated Users */}
          {user ? (
            <nav
              ref={navRef}
              className="hidden lg:flex items-center space-x-0.5 xl:space-x-1"
              aria-label="Platform navigation"
            >
              {/* 1. Journey Group Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleGroupMouseEnter('journey')}
                onMouseLeave={handleGroupMouseLeave}
              >
                <button
                  ref={(el) => (triggerRefs.current['journey'] = el)}
                  id="journey-nav-trigger"
                  type="button"
                  onClick={() => handleTriggerClick('journey')}
                  aria-expanded={openDropdown === 'journey'}
                  aria-haspopup="true"
                  aria-controls="journey-nav-menu"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                      if (openDropdown !== 'journey') {
                        e.preventDefault();
                        handleTriggerClick('journey');
                      }
                    }
                  }}
                  className={`px-2.5 py-2 xl:px-3 rounded-lg text-xs xl:text-sm font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-teal/30 whitespace-nowrap ${
                    isJourneyActive
                      ? 'bg-teal/10 text-teal font-semibold'
                      : 'text-slateText hover:text-navy-900 hover:bg-slate-50'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-teal flex-shrink-0" />
                  <span>Journey</span>
                  <ChevronDown
                    className={`w-3 h-3 xl:w-3.5 xl:h-3.5 transition-transform duration-200 ${
                      openDropdown === 'journey' ? 'rotate-180 text-teal' : 'text-slate-400'
                    }`}
                  />
                </button>

                {openDropdown === 'journey' && (
                  <div
                    id="journey-nav-menu"
                    aria-labelledby="journey-nav-trigger"
                    onMouseEnter={handleSubmenuMouseEnter}
                    onMouseLeave={handleGroupMouseLeave}
                    className="absolute top-full left-0 pt-2 w-72 z-[1050] animate-fade-in focus:outline-none"
                  >
                    <div
                      role="menu"
                      aria-orientation="vertical"
                      className="bg-white rounded-2xl shadow-xl border border-slate-200 py-2 divide-y divide-slate-100 overflow-hidden"
                    >
                      <Link
                        to="/plan"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-teal group-hover:text-white transition-colors">
                          <Navigation className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">Plan Journey</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            Multi-threat corridor risk analysis & alternatives
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/my-trips"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-teal group-hover:text-white transition-colors">
                          <Bookmark className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">My Journeys</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            Saved travel corridors and re-assessment history
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/roadwatch"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                          <Construction className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">RoadWatch</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            Documented pass closures, ghat advisories & roadworks
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/travel-pack"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <Printer className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">Travel Pack</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            Printable journey briefing, checklists & contacts
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Explore Group Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleGroupMouseEnter('explore')}
                onMouseLeave={handleGroupMouseLeave}
              >
                <button
                  ref={(el) => (triggerRefs.current['explore'] = el)}
                  id="explore-nav-trigger"
                  type="button"
                  onClick={() => handleTriggerClick('explore')}
                  aria-expanded={openDropdown === 'explore'}
                  aria-haspopup="true"
                  aria-controls="explore-nav-menu"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                      if (openDropdown !== 'explore') {
                        e.preventDefault();
                        handleTriggerClick('explore');
                      }
                    }
                  }}
                  className={`px-2.5 py-2 xl:px-3 rounded-lg text-xs xl:text-sm font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-teal/30 whitespace-nowrap ${
                    isExploreActive
                      ? 'bg-teal/10 text-teal font-semibold'
                      : 'text-slateText hover:text-navy-900 hover:bg-slate-50'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-teal flex-shrink-0" />
                  <span>Explore</span>
                  <ChevronDown
                    className={`w-3 h-3 xl:w-3.5 xl:h-3.5 transition-transform duration-200 ${
                      openDropdown === 'explore' ? 'rotate-180 text-teal' : 'text-slate-400'
                    }`}
                  />
                </button>

                {openDropdown === 'explore' && (
                  <div
                    id="explore-nav-menu"
                    aria-labelledby="explore-nav-trigger"
                    onMouseEnter={handleSubmenuMouseEnter}
                    onMouseLeave={handleGroupMouseLeave}
                    className="absolute top-full left-0 pt-2 w-72 z-[1050] animate-fade-in focus:outline-none"
                  >
                    <div
                      role="menu"
                      aria-orientation="vertical"
                      className="bg-white rounded-2xl shadow-xl border border-slate-200 py-2 divide-y divide-slate-100 overflow-hidden"
                    >
                      <Link
                        to="/discover"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-teal group-hover:text-white transition-colors">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">Discover</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            Pan-India regions, connectivity & terrain explorer
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/travelwise"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">TravelWise</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            Inner line permits, night traffic curfews & eco-rules
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/hazard-guide"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">Hazard Guide</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            Action protocols for floods, landslides & fog
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Community Group Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleGroupMouseEnter('community')}
                onMouseLeave={handleGroupMouseLeave}
              >
                <button
                  ref={(el) => (triggerRefs.current['community'] = el)}
                  id="community-nav-trigger"
                  type="button"
                  onClick={() => handleTriggerClick('community')}
                  aria-expanded={openDropdown === 'community'}
                  aria-haspopup="true"
                  aria-controls="community-nav-menu"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                      if (openDropdown !== 'community') {
                        e.preventDefault();
                        handleTriggerClick('community');
                      }
                    }
                  }}
                  className={`px-2.5 py-2 xl:px-3 rounded-lg text-xs xl:text-sm font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-teal/30 whitespace-nowrap ${
                    isCommunityActive
                      ? 'bg-teal/10 text-teal font-semibold'
                      : 'text-slateText hover:text-navy-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-teal flex-shrink-0" />
                  <span>Community</span>
                  <ChevronDown
                    className={`w-3 h-3 xl:w-3.5 xl:h-3.5 transition-transform duration-200 ${
                      openDropdown === 'community' ? 'rotate-180 text-teal' : 'text-slate-400'
                    }`}
                  />
                </button>

                {openDropdown === 'community' && (
                  <div
                    id="community-nav-menu"
                    aria-labelledby="community-nav-trigger"
                    onMouseEnter={handleSubmenuMouseEnter}
                    onMouseLeave={handleGroupMouseLeave}
                    className="absolute top-full left-0 pt-2 w-72 z-[1050] animate-fade-in focus:outline-none"
                  >
                    <div
                      role="menu"
                      aria-orientation="vertical"
                      className="bg-white rounded-2xl shadow-xl border border-slate-200 py-2 divide-y divide-slate-100 overflow-hidden"
                    >
                      <Link
                        to="/live-reports"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-teal group-hover:text-white transition-colors">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">Live Reports</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            Shared citizen observations & corroboration map
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/report"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-teal group-hover:text-white transition-colors">
                          <PlusCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">Report an Issue</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            Submit crowdsourced road or terrain hazard
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/my-reports"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-teal group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">My Contributions</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            Track your submitted observations & lifecycle
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Trust & Safety Group Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleGroupMouseEnter('trust')}
                onMouseLeave={handleGroupMouseLeave}
              >
                <button
                  ref={(el) => (triggerRefs.current['trust'] = el)}
                  id="trust-nav-trigger"
                  type="button"
                  onClick={() => handleTriggerClick('trust')}
                  aria-expanded={openDropdown === 'trust'}
                  aria-haspopup="true"
                  aria-controls="trust-nav-menu"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                      if (openDropdown !== 'trust') {
                        e.preventDefault();
                        handleTriggerClick('trust');
                      }
                    }
                  }}
                  className={`px-2.5 py-2 xl:px-3 rounded-lg text-xs xl:text-sm font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-teal/30 whitespace-nowrap ${
                    isTrustActive
                      ? 'bg-teal/10 text-teal font-semibold'
                      : 'text-slateText hover:text-navy-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-teal flex-shrink-0" />
                  <span>Trust & Safety</span>
                  <ChevronDown
                    className={`w-3 h-3 xl:w-3.5 xl:h-3.5 transition-transform duration-200 ${
                      openDropdown === 'trust' ? 'rotate-180 text-teal' : 'text-slate-400'
                    }`}
                  />
                </button>

                {openDropdown === 'trust' && (
                  <div
                    id="trust-nav-menu"
                    aria-labelledby="trust-nav-trigger"
                    onMouseEnter={handleSubmenuMouseEnter}
                    onMouseLeave={handleGroupMouseLeave}
                    className="absolute top-full left-0 pt-2 w-72 z-[1050] animate-fade-in focus:outline-none"
                  >
                    <div
                      role="menu"
                      aria-orientation="vertical"
                      className="bg-white rounded-2xl shadow-xl border border-slate-200 py-2 divide-y divide-slate-100 overflow-hidden"
                    >
                      <Link
                        to="/official-alerts"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-alertRed flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-alertRed group-hover:text-white transition-colors">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">Official Alerts</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            IMD, CWC, NDMA and Traffic Police warnings
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/source-centre"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-teal group-hover:text-white transition-colors">
                          <Database className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">Source Centre</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            Data provenance, verification tiers & sync status
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/emergency-guide"
                        role="menuitem"
                        onClick={handleSubmenuLinkClick}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-teal/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <LifeBuoy className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-navy-900">Emergency Guide</div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            Verified 112, 1033 helplines & breakdown protocols
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Assistant Single Item */}
              <Link
                to="/assistant"
                className={`px-2.5 py-2 xl:px-3 rounded-lg text-xs xl:text-sm font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-teal/30 whitespace-nowrap ${
                  isAssistantActive
                    ? 'bg-teal/10 text-teal font-semibold'
                    : 'text-slateText hover:text-navy-900 hover:bg-slate-50'
                }`}
              >
                <Bot className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-teal flex-shrink-0" />
                <span>AI Assistant</span>
              </Link>
            </nav>
          ) : (
            <div className="hidden lg:flex items-center text-xs text-slate-500 font-medium">
              <span>National Multi-Threat Travel Awareness Platform</span>
            </div>
          )}

          {/* Right Action / Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2 flex-shrink-0">
            {user ? (
              <div className="flex items-center space-x-1 xl:space-x-2">
                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="p-2 text-slateText hover:text-navy-900 hover:bg-slate-100 rounded-lg relative transition-colors focus:outline-none focus:ring-2 focus:ring-teal/30 flex-shrink-0"
                  title="Notifications & Corridor Bulletins"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 xl:w-5 xl:h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-alertRed rounded-full"></span>
                </Link>

                {/* Dashboard */}
                <Link
                  to="/app"
                  className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-lg text-xs xl:text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    isDashboardActive
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-navy-900 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-teal" />
                  <span>Dashboard</span>
                </Link>

                {/* Admin Portal — Authorized Admins Only */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-2 py-1 xl:px-2.5 xl:py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold rounded-lg transition-colors border border-purple-300 whitespace-nowrap flex-shrink-0"
                    title="Administrative Console"
                  >
                    Admin
                  </Link>
                )}

                {/* Profile */}
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal/30 flex-shrink-0"
                  title={`Profile & Settings (${user.name})`}
                  aria-label="Profile"
                >
                  <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </Link>

                {/* Log Out */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 xl:p-2 text-slateText hover:text-alertRed hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-200 flex-shrink-0"
                  title="Log Out"
                  aria-label="Log out of TravelLord AI"
                >
                  <LogOut className="w-4 h-4 xl:w-5 xl:h-5" />
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
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal hover:bg-teal-dark rounded-lg shadow-xs transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-navy-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto animate-fade-in">
          {user ? (
            <div className="space-y-3">
              {/* 1. Journey Group */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleMobileSection('journey')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 font-bold text-xs text-navy-900 uppercase tracking-wide"
                >
                  <span className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-teal" />
                    Journey
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      mobileSectionOpen.journey ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {mobileSectionOpen.journey && (
                  <div className="p-2 space-y-1 bg-white">
                    <Link
                      to="/plan"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <Navigation className="w-4 h-4 text-teal" />
                      Plan Journey
                    </Link>
                    <Link
                      to="/my-trips"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <Bookmark className="w-4 h-4 text-slate-500" />
                      My Journeys
                    </Link>
                    <Link
                      to="/roadwatch"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <Construction className="w-4 h-4 text-amber-600" />
                      RoadWatch
                    </Link>
                    <Link
                      to="/travel-pack"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <Printer className="w-4 h-4 text-emerald-600" />
                      Travel Pack
                    </Link>
                  </div>
                )}
              </div>

              {/* 2. Explore Group */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleMobileSection('explore')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 font-bold text-xs text-navy-900 uppercase tracking-wide"
                >
                  <span className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-teal" />
                    Explore
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      mobileSectionOpen.explore ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {mobileSectionOpen.explore && (
                  <div className="p-2 space-y-1 bg-white">
                    <Link
                      to="/discover"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <Compass className="w-4 h-4 text-teal" />
                      Discover
                    </Link>
                    <Link
                      to="/travelwise"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      TravelWise
                    </Link>
                    <Link
                      to="/hazard-guide"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Hazard Guide
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. Community Group */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleMobileSection('community')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 font-bold text-xs text-navy-900 uppercase tracking-wide"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal" />
                    Community
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      mobileSectionOpen.community ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {mobileSectionOpen.community && (
                  <div className="p-2 space-y-1 bg-white">
                    <Link
                      to="/live-reports"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <Users className="w-4 h-4 text-teal" />
                      Live Reports
                    </Link>
                    <Link
                      to="/report"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-600" />
                      Report an Issue
                    </Link>
                    <Link
                      to="/my-reports"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <FileText className="w-4 h-4 text-slate-500" />
                      My Contributions
                    </Link>
                  </div>
                )}
              </div>

              {/* 4. Trust & Safety Group */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleMobileSection('trust')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 font-bold text-xs text-navy-900 uppercase tracking-wide"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal" />
                    Trust & Safety
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      mobileSectionOpen.trust ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {mobileSectionOpen.trust && (
                  <div className="p-2 space-y-1 bg-white">
                    <Link
                      to="/official-alerts"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <Radio className="w-4 h-4 text-alertRed" />
                      Official Alerts
                    </Link>
                    <Link
                      to="/source-centre"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <Database className="w-4 h-4 text-blue-600" />
                      Source Centre
                    </Link>
                    <Link
                      to="/emergency-guide"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                    >
                      <LifeBuoy className="w-4 h-4 text-emerald-600" />
                      Emergency Guide
                    </Link>
                  </div>
                )}
              </div>

              {/* AI Assistant */}
              <Link
                to="/assistant"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-navy-900 hover:bg-slate-50"
              >
                <Bot className="w-4 h-4 text-teal" />
                AI Assistant
              </Link>

              {/* Account Controls */}
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <Link
                  to="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                >
                  <Compass className="w-4 h-4 text-teal" />
                  Traveler Dashboard
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                >
                  <Bell className="w-4 h-4 text-slate-500" />
                  Notifications & Advisories
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  Profile & Preferences
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-purple-900 bg-purple-50 hover:bg-purple-100"
                  >
                    <Shield className="w-4 h-4 text-purple-700" />
                    Admin Governance Portal
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-alertRed hover:bg-red-50 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out ({user.name})
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed">
                Sign in to plan journey corridors, explore the threat radar, and receive verified hazard warnings.
              </div>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center font-semibold text-navy-900 border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center font-semibold text-white bg-teal hover:bg-teal-dark rounded-xl shadow-xs"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
