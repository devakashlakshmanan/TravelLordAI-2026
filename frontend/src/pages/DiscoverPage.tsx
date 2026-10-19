import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DestinationItem } from '../types';
import {
  Compass, MapPin, Search, Filter, Navigation, ExternalLink,
  Calendar, Train, Plane, Mountain, Trees, Waves, Castle, Info, ArrowRight
} from 'lucide-react';

const PAN_INDIA_DESTINATIONS: DestinationItem[] = [
  {
    id: 'dest-leh',
    name: 'Leh-Ladakh',
    state: 'Ladakh',
    region: 'North',
    tag: 'High Altitude Desert',
    description: 'Breathtaking cold desert plateau with world famous high passes (Khardung La, Chang La, Tanglang La). Requires mandatory acclimatization and Inner Line Permits for protected sectors.',
    connectivity: {
      highway: 'NH-3 (Leh-Manali Highway) & NH-1 (Srinagar-Leh)',
      airport: 'Kushok Bakula Rimpochee Airport (IXL), Leh',
      railway: 'Jammu Tawi (700 km) or Pathankot',
    },
    best_season: 'May to September (Highway Passes Open)',
    tourism_url: 'https://leh.nic.in/tourism/',
    coordinates: [34.1526, 77.5771],
    terrain_type: 'High Altitude Mountain',
  },
  {
    id: 'dest-manali',
    name: 'Manali & Spiti Valley',
    state: 'Himachal Pradesh',
    region: 'North',
    tag: 'Himalayan Corridor',
    description: 'Premier gateway to the Lahaul-Spiti valley via the Atal Tunnel. Highly subject to winter snowfall closures, Rohtang pass permits, and monsoon flash floods along the Beas river corridor.',
    connectivity: {
      highway: 'NH-21 (Kiratpur-Manali) & Atal Tunnel corridor',
      airport: 'Bhuntar Airport (KUU), Kullu (50 km)',
      railway: 'Joginder Nagar (Narrow) / Chandigarh (Broad - 310 km)',
    },
    best_season: 'April to June & October to February',
    tourism_url: 'https://himachaltourism.gov.in/',
    coordinates: [32.2432, 77.1892],
    terrain_type: 'Mountain / Valley',
  },
  {
    id: 'dest-munnar',
    name: 'Munnar & Western Ghats',
    state: 'Kerala',
    region: 'South',
    tag: 'Western Ghats Hill Station',
    description: 'High-altitude tea estates surrounded by evergreen rainforests in the Anamalai range. Known for narrow winding ghat roads prone to dense fog and monsoon landslides along Gap Road.',
    connectivity: {
      highway: 'NH-85 (Kochi-Madurai GAP Road)',
      airport: 'Cochin International Airport (COK) (110 km)',
      railway: 'Aluva / Ernakulam Junction (120 km)',
    },
    best_season: 'September to March',
    tourism_url: 'https://www.keralatourism.org/destination/munnar/202',
    coordinates: [10.0889, 77.0595],
    terrain_type: 'Ghats / Rainforest',
  },
  {
    id: 'dest-hampi',
    name: 'Hampi & Tungabhadra',
    state: 'Karnataka',
    region: 'South',
    tag: 'UNESCO World Heritage',
    description: 'Ancient ruins of the Vijayanagara Empire situated amidst dramatic boulder-strewn terrain and the Tungabhadra river. Excellent highway access via the NH-50 corridor.',
    connectivity: {
      highway: 'NH-50 (Hospet-Chitradurga-Bengaluru corridor)',
      airport: 'Jindal Vidyanagar Airport, Toranagallu (40 km)',
      railway: 'Hosapete Junction (HPT) (13 km)',
    },
    best_season: 'October to March (Warm summers exceed 40°C)',
    tourism_url: 'https://www.karnatakatourism.org/destinations/hampi/',
    coordinates: [15.3350, 76.4600],
    terrain_type: 'Plains / Rocky Boulders',
  },
  {
    id: 'dest-jaisalmer',
    name: 'Jaisalmer (Thar Desert)',
    state: 'Rajasthan',
    region: 'West',
    tag: 'Thar Desert Corridor',
    description: 'The Golden City in the heart of the Thar Desert. Border zone travel requires situational awareness, carrying adequate water, and avoiding extreme summer heatwaves.',
    connectivity: {
      highway: 'NH-11 & NH-68 border highway',
      airport: 'Jaisalmer Airport (JSA)',
      railway: 'Jaisalmer Railway Station (JSM)',
    },
    best_season: 'November to February',
    tourism_url: 'https://www.tourism.rajasthan.gov.in/jaisalmer.html',
    coordinates: [26.9157, 70.9083],
    terrain_type: 'Desert Dunes',
  },
  {
    id: 'dest-goa',
    name: 'Goa Coastal Corridor',
    state: 'Goa',
    region: 'West',
    tag: 'Arabian Sea Coastal Road',
    description: 'Famous coastal belt accessed via the scenic Western Ghats passes (Chorla Ghat & Anmod Ghat). Seasonal monsoons cause heavy downpours and low ghat visibility.',
    connectivity: {
      highway: 'NH-66 (Mumbai-Goa-Kochi) & NH-748',
      airport: 'Manohar International (GOX) / Dabolim (GOI)',
      railway: 'Madgaon (MAO) / Thivim (THVM)',
    },
    best_season: 'November to April',
    tourism_url: 'https://goatourism.gov.in/',
    coordinates: [15.2993, 74.1240],
    terrain_type: 'Coastal Belt / Estuary',
  },
  {
    id: 'dest-gangtok',
    name: 'Gangtok & North Sikkim',
    state: 'Sikkim',
    region: 'Northeast',
    tag: 'Eastern Himalayas',
    description: 'Spectacular Himalayan capital and gateway to Gurudongmar Lake and Yumthang Valley. North Sikkim travel strictly mandates permits and suffers frequent monsoon rockfalls on NH-10.',
    connectivity: {
      highway: 'NH-10 (Siliguri-Sevoke-Gangtok corridor)',
      airport: 'Pakyong Airport (PYG) / Bagdogra (IXB) (125 km)',
      railway: 'New Jalpaiguri (NJP) (120 km)',
    },
    best_season: 'March to May & October to mid-December',
    tourism_url: 'https://www.sikkimtourism.gov.in/',
    coordinates: [27.3389, 88.6065],
    terrain_type: 'Steep Mountain / Seismic Zone',
  },
  {
    id: 'dest-kaziranga',
    name: 'Kaziranga & Brahmaputra Corridor',
    state: 'Assam',
    region: 'Northeast',
    tag: 'UNESCO Wildlife Biosphere',
    description: 'Home of the great one-horned rhinoceros. Traversed by NH-715 (old NH-37) where speed sensor cameras strictly enforce animal crossing safety zones, especially during Brahmaputra floods.',
    connectivity: {
      highway: 'NH-715 (Guwahati-Jorhat corridor)',
      airport: 'Jorhat Airport (JRH) (97 km) / Guwahati (GAU) (220 km)',
      railway: 'Jakhalabandha / Furkating Junction',
    },
    best_season: 'November to April (Park closed during monsoons)',
    tourism_url: 'https://assamtourism.gov.in/',
    coordinates: [26.5775, 93.1711],
    terrain_type: 'Wetland / Floodplain Forest',
  },
  {
    id: 'dest-puri',
    name: 'Puri & Konark Marine Drive',
    state: 'Odisha',
    region: 'East',
    tag: 'Bay of Bengal Coast',
    description: 'Pilgrimage and coastal corridor known for the Konark Sun Temple and Chilika Lake. Subject to seasonal Bay of Bengal cyclonic storms between October and December.',
    connectivity: {
      highway: 'NH-316 (Bhubaneswar-Puri Expressway)',
      airport: 'Biju Patnaik International Airport (BBI), Bhubaneswar (60 km)',
      railway: 'Puri Railway Station (PURI)',
    },
    best_season: 'October to March',
    tourism_url: 'https://odishatourism.gov.in/',
    coordinates: [19.8135, 85.8312],
    terrain_type: 'Coastal Plain',
  },
  {
    id: 'dest-varanasi',
    name: 'Varanasi Heritage Corridor',
    state: 'Uttar Pradesh',
    region: 'North',
    tag: 'Ganga Cultural Corridor',
    description: 'One of the world oldest living cities. Major junction on the Golden Quadrilateral (NH-19 / Grand Trunk Road) connecting Northern India to Eastern ports.',
    connectivity: {
      highway: 'NH-19 (Delhi-Kolkata) & Purvanchal Expressway link',
      airport: 'Lal Bahadur Shastri International Airport (VNS)',
      railway: 'Varanasi Junction (BSB) & Pt. Deen Dayal Upadhyaya (DDU)',
    },
    best_season: 'October to March',
    tourism_url: 'https://uptourism.gov.in/',
    coordinates: [25.3176, 82.9739],
    terrain_type: 'Gangetic Plains',
  },
  {
    id: 'dest-kanha',
    name: 'Kanha & Central Tiger Reserves',
    state: 'Madhya Pradesh',
    region: 'Central',
    tag: 'Central Highlands Biosphere',
    description: 'Lush Sal and bamboo forests forming India premier tiger conservation landscape. Forest corridors enforce night driving curfews and regulated speed limits.',
    connectivity: {
      highway: 'NH-30 & State Highway corridor from Jabalpur',
      airport: 'Jabalpur Airport (JLR) (160 km) / Nagpur (NAG) (260 km)',
      railway: 'Gondia Junction / Jabalpur Junction',
    },
    best_season: 'October to June',
    tourism_url: 'https://www.mptourism.com/',
    coordinates: [22.3345, 80.6115],
    terrain_type: 'Plateau & Dense Sal Forests',
  },
];

export const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredDestinations = useMemo(() => {
    return PAN_INDIA_DESTINATIONS.filter((item) => {
      if (selectedRegion !== 'all' && item.region !== selectedRegion) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesState = item.state.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesTag = item.tag.toLowerCase().includes(q);
        if (!matchesName && !matchesState && !matchesDesc && !matchesTag) {
          return false;
        }
      }
      return true;
    });
  }, [selectedRegion, searchQuery]);

  const handlePlanRoute = (dest: DestinationItem) => {
    // Navigate to /plan with destination prepopulated
    navigate(`/plan?dest=${encodeURIComponent(`${dest.name}, ${dest.state}`)}`);
  };

  return (
    <div className="min-h-screen bg-warmWhite pb-16">
      {/* Header */}
      <div className="bg-navy-900 text-white border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-mint font-semibold text-xs tracking-wider uppercase mb-2">
            <Compass className="w-4 h-4 text-mint" />
            Pan-India Geographic Corridors
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-white">
            Discover India
          </h1>
          <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            Explore diverse travel corridors across all Indian states and geographic zones.
            Access verified transit connectivity, terrain characteristics, seasonal travel windows,
            and direct links to official state tourism portals.
          </p>

          {/* Region Tabs */}
          <div className="mt-8 flex flex-wrap gap-2">
            {['all', 'North', 'South', 'West', 'East', 'Northeast', 'Central'].map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegion(reg)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedRegion === reg
                    ? 'bg-teal text-white shadow-sm'
                    : 'bg-navy-800 text-slate-300 hover:text-white hover:bg-navy-700'
                }`}
              >
                {reg === 'all' ? 'All Regions (India)' : `${reg} India`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Search & Stats Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by state, city, or corridor (e.g. Kerala, Ladakh, Desert)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong>{filteredDestinations.length}</strong> featured travel corridors
          </div>
        </div>

        {/* Destination Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map((dest) => (
            <div
              key={dest.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="p-5">
                {/* Header Tag */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20">
                    {dest.region} India • {dest.state}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Mountain className="w-3.5 h-3.5 text-slate-500" />
                    {dest.terrain_type}
                  </span>
                </div>

                <h3 className="font-heading font-extrabold text-lg text-navy-900 mb-1">
                  {dest.name}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                  {dest.description}
                </p>

                {/* Connectivity Box */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs mb-4">
                  <div className="flex items-start gap-2">
                    <Navigation className="w-3.5 h-3.5 text-teal flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 leading-tight">
                      <strong>Highway:</strong> {dest.connectivity.highway}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Plane className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600 leading-tight">
                      <strong>Airport:</strong> {dest.connectivity.airport}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Train className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600 leading-tight">
                      <strong>Railway:</strong> {dest.connectivity.railway}
                    </span>
                  </div>
                </div>

                {/* Seasonality */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                  <span>Season: <strong>{dest.best_season}</strong></span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
                <a
                  href={dest.tourism_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-teal transition-colors"
                >
                  Official Tourism
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={() => handlePlanRoute(dest)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal text-white text-xs font-bold hover:bg-teal/90 shadow-xs transition-colors"
                >
                  Plan Journey
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Responsible Travel Disclosure */}
        <div className="mt-10 p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-navy-900 block text-sm">
              Pan-India Responsible Travel Advisory
            </span>
            <p className="leading-relaxed">
              When travelling to border zones (Ladakh, Arunachal Pradesh, Sikkim) or eco-sensitive protected zones
              (Western Ghats, National Parks, Andaman Islands), ensure you verify permit prerequisites, local night traffic
              restrictions, and wildlife corridor speed regulations. Check the <strong>TravelWise</strong> guide for detailed regulatory briefings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
