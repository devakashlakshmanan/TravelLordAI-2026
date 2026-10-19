import React, { useState, useMemo } from 'react';
import { TravelWiseItem } from '../types';
import {
  ShieldAlert, FileCheck, Moon, AlertOctagon,
  ExternalLink, Search, CheckCircle, ChevronDown, ChevronUp,
  Sparkles, Info, BookOpen
} from 'lucide-react';

const TRAVELWISE_ITEMS: TravelWiseItem[] = [
  {
    id: 'ilp-arunachal',
    region: 'Northeast India',
    category: 'permit',
    title: 'Arunachal Pradesh Inner Line Permit (ILP)',
    summary: 'Mandatory statutory permit required by Indian domestic citizens under the Bengal Eastern Frontier Regulation, 1873 to enter and travel within any part of Arunachal Pradesh.',
    rules: [
      'Domestic travellers must apply online or obtain ILP at designated resident commissioner offices (Guwahati, Tezpur, Kolkata, Delhi).',
      'Valid identity proof (Aadhaar, Voter ID, Passport) and passport-sized photographs are required.',
      'Foreign nationals require a Protected Area Permit (PAP) issued through the Ministry of Home Affairs or authorized tour operators in minimum groups of two.',
      'Permit must be carried physically at all border check gates (Bhalukpong, Pasighat, Naharlagun, etc.).',
    ],
    official_links: [
      { name: 'Official Arunachal Pradesh e-ILP Portal', url: 'https://arunachalilp.gov.in/' },
      { name: 'Arunachal Tourism Guidance', url: 'https://arunachaltourism.com/' },
    ],
    caution_notes: 'Never purchase ILPs from unauthorized touts or local shops; checkposts actively scan QR verification codes and will turn away fraudulent holders.',
  },
  {
    id: 'ilp-ladakh',
    region: 'Northern India',
    category: 'permit',
    title: 'Ladakh Protected Area Permits (Nubra, Pangong, Tso Moriri)',
    summary: 'Travel to border areas of the Union Territory of Ladakh (Nubra Valley, Khardung La, Pangong Tso, Chang La, Dha-Hanu, and Nyoma) requires online LAHDC permit verification.',
    rules: [
      'Environmental / Wildlife Protection fee and Red Cross fee payable via the official portal.',
      'Print at least 4 to 6 physical copies of the endorsed permit, as separate military and police check-posts retain a physical copy at each crossing.',
      'Carry original government ID cards along with the printed permit at all times.',
      'Permits are generally valid for up to 15 days for domestic tourists.',
    ],
    official_links: [
      { name: 'LAHDC Leh Official e-Permit Portal', url: 'https://lahdclehpermit.in/' },
      { name: 'District Administration Leh', url: 'https://leh.nic.in/' },
    ],
    caution_notes: 'Due to extreme elevation (14,000 to 18,380 ft), mandatory 48-hour acclimatization in Leh town is recommended before crossing Khardung La or Chang La.',
  },
  {
    id: 'night-ban-bandipur',
    region: 'Southern India',
    category: 'restriction',
    title: 'Bandipur National Park Highway Night Traffic Ban (NH-766)',
    summary: 'Strict statutory curfew on vehicular movement through the Bandipur Tiger Reserve corridor to protect wildlife from road mortality during nocturnal hours.',
    rules: [
      'Traffic closure is strictly enforced daily between 9:00 PM and 6:00 AM on NH-766 (Gundlupet to Sultan Bathery) and NH-67.',
      'Emergency vehicles (ambulances) and government transit buses are granted controlled exceptions; private vehicles are completely halted at check-posts.',
      'Alternative night route between Karnataka and Kerala operates via Kutta-Gonikoppal-Mananthavady, which involves substantial detours.',
      'Speed limit within the park limits during daytime is restricted to 30-40 km/h with strict speed traps.',
    ],
    official_links: [
      { name: 'Karnataka Forest Department Bandipur Regulations', url: 'https://aranya.gov.in/' },
    ],
    caution_notes: 'Arriving at the forest gates after 8:45 PM often results in being stranded until morning at highway queues without food or facilities.',
  },
  {
    id: 'eco-rohtang-epass',
    region: 'Northern India',
    category: 'eco_rule',
    title: 'Rohtang Pass NGT Permit & Environmental Congestion Fee',
    summary: 'National Green Tribunal (NGT) statutory quota and daily vehicular restriction to protect the fragile Himalayan glacier ecology around Rohtang Pass.',
    rules: [
      'Only 800 petrol vehicles and 400 diesel vehicles are permitted to cross Rohtang Pass daily.',
      'Permits must be booked in advance online through the HP Tourism portal.',
      'Vehicles travelling across the Atal Tunnel towards Lahaul/Spiti/Leh do not require Rohtang Pass permit, but are subject to local traffic police regulation at South Portal.',
      'Rohtang pass remains closed for weekly maintenance every Tuesday.',
    ],
    official_links: [
      { name: 'Himachal Pradesh Rohtang Pass Online Permit', url: 'https://rohtangpermits.nic.in/' },
    ],
    caution_notes: 'Heavy traffic congestion can occur at Solang Valley and South Portal during peak summer tourist seasons (May-June).',
  },
  {
    id: 'eco-nilgiris-epass',
    region: 'Southern India',
    category: 'eco_rule',
    title: 'Nilgiris (Ooty & Coonoor) e-Pass System',
    summary: 'Mandatory environmental vehicular e-pass system introduced by the Madras High Court to monitor vehicular influx and vehicular carrying capacity in the Nilgiris biosphere.',
    rules: [
      'All outside tourist vehicles entering the Nilgiris district must generate a free electronic e-pass online prior to commencing travel.',
      'e-Pass is verified via QR code scan at entry check-posts including Burliyar, Kakkanallah, and Naduvattam.',
      'Single-use plastic bottles, plastic bags, and disposable cups are completely banned throughout the Nilgiris district with spot fines.',
    ],
    official_links: [
      { name: 'Tamil Nadu Nilgiris Official e-Pass Portal', url: 'https://epass.tnega.org/' },
    ],
    caution_notes: 'Generating the e-pass is free of cost on the official Tamil Nadu government portal; beware of commercial third-party websites charging processing fees.',
  },
  {
    id: 'scam-railway-touts',
    region: 'Pan-India',
    category: 'scam_alert',
    title: 'Major Railway Station Touts & Fake Tourist Bureaus',
    summary: 'Documented deceptive practices near major railway terminals (New Delhi NDLS, Howrah HWH, Varanasi BSB, Mumbai CSMT).',
    rules: [
      'Touts dressed in semi-official uniforms frequently falsely claim that the train has been cancelled or that the station booking office has relocated.',
      'They steer vulnerable tourists towards unauthorized private travel agencies charging exorbitant taxi rates.',
      'Always verify train status directly using official Indian Railways apps (NTES, IRCTC Rail Connect) or the official enquiry counters on Platform 1.',
      'Book official prepaid government taxis or app-based rides (Ola/Uber) from designated station bays rather than engaging street solicitors.',
    ],
    official_links: [
      { name: 'National Train Enquiry System (NTES)', url: 'https://enquiry.indianrail.gov.in/' },
      { name: 'Ministry of Tourism Tourist Helpline (1363)', url: 'https://tourism.gov.in/' },
    ],
    caution_notes: 'Never surrender your printed train tickets or confirmation SMS to strangers outside the station gates claiming to be railway inspectors.',
  },
  {
    id: 'scam-fake-safari-passes',
    region: 'Central & Western India',
    category: 'scam_alert',
    title: 'Tiger Reserve & National Park Safari Booking Frauds',
    summary: 'Ubiquitous unofficial websites imitating government booking portals for Corbett, Ranthambore, Kaziranga, and Tadoba tiger reserves.',
    rules: [
      'Official tiger safari bookings are exclusively routed through the respective state forest department booking portals.',
      'Unauthorized agencies charge 300% to 500% surcharges and frequently issue invalid receipts that lead to denied entry at gate checkpoints.',
      'Safari gypsy vehicle numbers and naturalist guides are allotted randomly by the park authorities on the morning of entry; private agents cannot reserve specific zones without official registration.',
    ],
    official_links: [
      { name: 'Ranthambore Official Booking (Rajasthan SSO)', url: 'https://fmdss.forest.rajasthan.gov.in/' },
      { name: 'Corbett Official Safari Portal', url: 'https://corbettonline.uk.gov.in/' },
    ],
    caution_notes: 'Always examine the website domain; authentic state government portals end with `.gov.in` or `.nic.in`.',
  },
];

export const TravelWisePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(TRAVELWISE_ITEMS[0].id);

  const filteredItems = useMemo(() => {
    return TRAVELWISE_ITEMS.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSummary = item.summary.toLowerCase().includes(q);
        const matchesRegion = item.region.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSummary && !matchesRegion) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-warmWhite pb-16">
      {/* Header */}
      <div className="bg-navy-900 text-white border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-mint font-semibold text-xs tracking-wider uppercase mb-2">
            <BookOpen className="w-4 h-4 text-mint" />
            Pan-India Travel Regulations & Situational Guidance
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-white">
            TravelWise
          </h1>
          <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            Essential regulatory awareness, statutory permit guidelines, night traffic bans,
            eco-sensitive corridor requirements, and verified avoidance strategies for common travel pitfalls across India.
          </p>

          {/* Category Tabs */}
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Guidance' },
              { id: 'permit', label: 'Inner Line & Protected Permits' },
              { id: 'restriction', label: 'Highway Night Bans & Curfews' },
              { id: 'eco_rule', label: 'Eco-Rules & Green Fees' },
              { id: 'scam_alert', label: 'Transit Pitfall Awareness' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-teal text-white shadow-sm'
                    : 'bg-navy-800 text-slate-300 hover:text-white hover:bg-navy-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by topic, state or rule (e.g. Bandipur, ILP, Rohtang, scam)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong>{filteredItems.length}</strong> travel dossiers
          </div>
        </div>

        {/* Accordion Dossiers */}
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const categoryBadge = {
              permit: { label: 'Statutory Permit', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              restriction: { label: 'Night Traffic Curfew', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              eco_rule: { label: 'Eco-Rule & Quota', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              scam_alert: { label: 'Pitfall Awareness', color: 'bg-rose-50 text-rose-700 border-rose-200' },
            }[item.category];

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isExpanded ? 'border-teal shadow-md ring-1 ring-teal/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header Clickable Row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="w-full p-5 text-left flex items-start justify-between gap-4 focus:outline-none"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${categoryBadge.color}`}>
                        {categoryBadge.label}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {item.region}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-base text-navy-900">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center flex-shrink-0 mt-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-slate-100 space-y-5 animate-fade-in text-xs">
                    {/* Rules List */}
                    <div>
                      <h4 className="font-bold text-navy-900 uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-teal" />
                        Key Operational Rules & Prerequisites
                      </h4>
                      <ul className="space-y-2">
                        {item.rules.map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-700 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal flex-shrink-0 mt-1.5" />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Caution Note */}
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                      <AlertOctagon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-amber-950">Important Awareness:</strong>
                        <p className="mt-0.5 leading-relaxed">{item.caution_notes}</p>
                      </div>
                    </div>

                    {/* Official Portals */}
                    {item.official_links.length > 0 && (
                      <div className="pt-2">
                        <span className="font-bold text-slate-700 block mb-2 text-[11px] uppercase tracking-wider">
                          Official Portals & Resources:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {item.official_links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-50 text-navy-900 border border-navy-100 hover:bg-teal hover:text-white transition-all font-semibold"
                            >
                              <span>{link.name}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Statutory Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-3">
          <Info className="w-4 h-4 text-teal flex-shrink-0" />
          <span>
            Regulations, fee structures, and permit guidelines are subject to revision by respective State and Central authorities. Always cross-check the linked official government portals prior to initiating transit.
          </span>
        </div>
      </div>
    </div>
  );
};
