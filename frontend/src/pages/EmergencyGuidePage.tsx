import React, { useState } from 'react';
import { EmergencyContactItem } from '../types';
import {
  PhoneCall, ShieldAlert, AlertTriangle, LifeBuoy,
  HeartPulse, Car, Compass, Clock, MapPin, ChevronRight,
  ExternalLink, Search, Phone
} from 'lucide-react';

const EMERGENCY_CONTACTS: EmergencyContactItem[] = [
  {
    id: 'contact-112',
    name: 'National Unified Emergency Helpline',
    number: '112',
    category: 'national',
    description: 'Single pan-India emergency response number integrating Police, Fire, Medical, and Disaster dispatch services.',
    availability: '24 hours / 7 days a week',
    jurisdiction: 'Pan-India (All States & Union Territories)',
  },
  {
    id: 'contact-1033',
    name: 'National Highways Emergency Helpline (NHAI)',
    number: '1033',
    category: 'highway',
    description: 'Free 24x7 assistance for mechanical breakdowns, cranes, emergency medical trauma ambulances, and route assistance on National Highways & Expressways.',
    availability: '24 hours / 7 days a week',
    jurisdiction: 'All National Highways & Expressways in India',
  },
  {
    id: 'contact-108',
    name: 'Emergency Medical & Trauma Ambulance',
    number: '108',
    category: 'medical',
    description: 'Free emergency ambulance transport and life-support paramedic dispatch service across Indian states.',
    availability: '24 hours / 7 days a week',
    jurisdiction: 'Operating across 22+ Indian States',
  },
  {
    id: 'contact-1070',
    name: 'State Disaster Management Control Room',
    number: '1070',
    category: 'disaster',
    description: 'State government disaster relief control rooms for landslides, cyclones, severe floods, and dam water release warnings.',
    availability: '24 hours / 7 days a week',
    jurisdiction: 'State Government Disaster Authorities',
  },
  {
    id: 'contact-1078',
    name: 'NDRF Disaster Coordination Headquarters',
    number: '1078',
    category: 'disaster',
    description: 'National Disaster Response Force national control room for emergency evacuation and specialized rescue coordination.',
    availability: '24 hours / 7 days a week',
    jurisdiction: 'National Central Headquarters (MHA)',
  },
  {
    id: 'contact-1363',
    name: 'Ministry of Tourism 24x7 Helpline',
    number: '1363',
    category: 'national',
    description: 'Multi-lingual tourist advisory and distress assistance helpline supported in 12 major languages including Hindi, English, and foreign tongues.',
    availability: '24 hours / 7 days a week',
    jurisdiction: 'Ministry of Tourism, Govt of India',
  },
  {
    id: 'contact-139',
    name: 'Indian Railways RailMadad Security & Help',
    number: '139',
    category: 'national',
    description: 'Security, medical assistance on trains, passenger safety complaints, and transit coordination across Indian Railways network.',
    availability: '24 hours / 7 days a week',
    jurisdiction: 'Indian Railways Network Pan-India',
  },
  {
    id: 'contact-1091',
    name: 'Women in Distress Helpline',
    number: '1091',
    category: 'national',
    description: 'Specialized police distress unit and assistance for solo female travellers encountering harassment or safety threats.',
    availability: '24 hours / 7 days a week',
    jurisdiction: 'Pan-India State Police Cadres',
  },
];

export const EmergencyGuidePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredContacts = EMERGENCY_CONTACTS.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchNum = c.number.includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      if (!matchName && !matchNum && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-warmWhite pb-16">
      {/* Header */}
      <div className="bg-navy-900 text-white border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-mint font-semibold text-xs tracking-wider uppercase mb-2">
            <LifeBuoy className="w-4 h-4 text-mint" />
            Immediate Assistance Protocols & Verified Helplines
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-white">
            Emergency Guide
          </h1>
          <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            Verified statutory helplines, highway assistance numbers, and critical protocols for handling
            accidents, medical crises, and remote breakdowns on Indian travel corridors.
          </p>

          {/* Category Tabs */}
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Emergency Services' },
              { id: 'highway', label: 'Highway & Expressway (1033)' },
              { id: 'medical', label: 'Ambulance & Medical (108)' },
              { id: 'disaster', label: 'Disaster Relief (1070 / 1078)' },
              { id: 'national', label: 'Police & Citizen Helplines' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === tab.id
                    ? 'bg-teal text-white shadow-sm'
                    : 'bg-navy-800 text-slate-300 hover:text-white hover:bg-navy-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Quick Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search helpline (e.g. NHAI, 1033, medical)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Toll-free emergency numbers accessible from any Indian telecom provider.
          </div>
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-teal text-white flex items-center justify-center font-heading font-black text-xl shadow-xs">
                    {contact.number}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                    {contact.category}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-sm text-navy-900 mb-1 leading-snug">
                  {contact.name}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed">
                  {contact.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[10px] text-slate-400">
                  {contact.jurisdiction}
                </div>
                <a
                  href={`tel:${contact.number}`}
                  className="w-full py-2 bg-slate-50 hover:bg-teal hover:text-white text-navy-900 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Dial {contact.number}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Action Protocols Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-heading font-black text-navy-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            Standard Roadside Incident Protocols
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-navy-900 text-sm block">
                1. Highway Collision or Pileup
              </span>
              <ul className="space-y-1.5 text-slate-600 leading-relaxed">
                <li>• Turn on vehicle hazard flashers immediately.</li>
                <li>• If operable, steer onto the extreme left emergency shoulder.</li>
                <li>• Ensure all occupants step over the metal crash barrier off the asphalt.</li>
                <li>• Call <strong>1033 (NHAI)</strong> or <strong>112</strong> immediately. State highway number and nearest kilometer marker.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-navy-900 text-sm block">
                2. Acute Altitude Sickness (AMS)
              </span>
              <ul className="space-y-1.5 text-slate-600 leading-relaxed">
                <li>• Symptoms: persistent throbbing headache, nausea, shortness of breath.</li>
                <li>• <strong>Golden Rule:</strong> Descend immediately to a lower altitude (e.g. from Tanglang La back down to Pang or Leh).</li>
                <li>• Restrict physical exertion and administer supplemental portable oxygen.</li>
                <li>• Visit the nearest Indian Army / ITBP medical aid post along the highway corridor.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-navy-900 text-sm block">
                3. Stranded in Wildlife Forest Corridor
              </span>
              <ul className="space-y-1.5 text-slate-600 leading-relaxed">
                <li>• Remain inside the closed vehicle cabin; do not step outside.</li>
                <li>• Keep low beams or parking lights on; do not honk the horn.</li>
                <li>• Dial 112 or forest patrol check-post number.</li>
                <li>• Wait for highway patrol or forest guard escort vehicles to reach you.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
