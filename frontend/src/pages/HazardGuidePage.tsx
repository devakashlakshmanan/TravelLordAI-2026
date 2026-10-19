import React, { useState } from 'react';
import { HazardGuideItem } from '../types';
import {
  ShieldAlert, CloudRain, Mountain, Wind, Sun,
  Zap, AlertTriangle, AlertCircle, Phone, Info,
  CheckCircle2, Compass, Car, HelpCircle
} from 'lucide-react';

const HAZARD_GUIDES: HazardGuideItem[] = [
  {
    id: 'hazard-floods',
    hazard_type: 'Flash Floods & Cloudbursts',
    title: 'Himalayan Flash Floods & River Surges',
    icon: 'CloudRain',
    high_risk_corridors: [
      'NH-3 & NH-21 (Beas River Corridor, Kullu-Manali)',
      'NH-10 (Teesta River Basin, Sevoke-Gangtok)',
      'NH-7 (Alaknanda Basin, Rishikesh-Badrinath)',
      'Western Ghats causeways during peak Southwest Monsoon',
    ],
    signs_to_watch: [
      'Sudden rapid darkening of upstream mountain peaks with thunder.',
      'River water suddenly turning muddy brown with surging debris or floating tree trunks.',
      'Unusual rumbling sound echoing down the valley prior to visible water surge.',
      'Water rapidly rising above marked bridge pilings or culvert thresholds.',
    ],
    precautions: [
      'Never park vehicles along dry riverbeds or gravel shoals near mountain rivers.',
      'Do not attempt to ford across submerged bridges or flooded dips; less than 30 cm of rushing water can dislodge an SUV.',
      'Monitor Central Water Commission (CWC) flood advisories and IMD flash flood bulletins.',
      'During heavy cloudbursts, seek higher solid ground immediately away from river embankments.',
    ],
    emergency_actions: [
      'Abandon the vehicle immediately if water reaches door sills; climb to uphill terraced terrain.',
      'Do not shelter under precarious overhangs or near steep saturated earth slopes.',
      'Dial 112 or state disaster control (1070/1077) once reaching secure higher ground.',
    ],
    non_diagnosis_disclaimer: 'This guide outlines historical incident patterns and standard civil defense practices. Flash floods are sudden localized hydrological events and cannot be forecast with street-level timing.',
  },
  {
    id: 'hazard-landslides',
    hazard_type: 'Landslides & Slope Failures',
    title: 'Monsoon Landslides, Mudflows & Rockfalls',
    icon: 'Mountain',
    high_risk_corridors: [
      'NH-58 & Char Dham highway corridors (Uttarakhand)',
      'NH-10 (Siliguri to Gangtok, 29th Mile zone)',
      'Mumbai-Pune Expressway (Khandala Bhor Ghat)',
      'NH-85 Munnar Gap Road (Kerala Western Ghats)',
    ],
    signs_to_watch: [
      'Trickles of small pebbles, dust clouds, or loose mud tumbling onto the asphalt.',
      'Trees, telephone poles, or roadside retaining walls visibly leaning uphill or downhill.',
      'New tension cracks developing along the road shoulder or outer embankment.',
      'Sudden springs of muddy water bursting through rock crevices.',
    ],
    precautions: [
      'Avoid driving through mountain passes during active continuous night rainfall.',
      'Maintain an increased following distance behind preceding heavy vehicles to avoid blind stops in slide zones.',
      'Observe Border Roads Organisation (BRO) and PWD cautionary shooting stone warning boards.',
      'Check local traffic police WhatsApp / Twitter channels before departing from base towns.',
    ],
    emergency_actions: [
      'If caught in a rockfall zone, accelerate calmly out of the line of fire if road is clear ahead; never reverse blindly into oncoming traffic.',
      'If road is blocked ahead and behind, reverse to a wide stable turn away from steep cliffs.',
      'Wait for heavy equipment deployment by BRO/PWD road clearance teams; do not walk across live shifting debris.',
    ],
    non_diagnosis_disclaimer: 'Geological instability depends on complex subsurface saturation and seismic factors. Antigravity does not forecast specific slope failures.',
  },
  {
    id: 'hazard-fog',
    hazard_type: 'Dense Winter Fog & Smog',
    title: 'Northern Plains Zero-Visibility Fog',
    icon: 'Wind',
    high_risk_corridors: [
      'Yamuna Expressway & Agra-Lucknow Expressway (Dec-Jan)',
      'Eastern & Western Peripheral Expressways (NCR)',
      'NH-44 (Delhi-Ambala-Jalandhar corridor)',
      'Purvanchal & Bundelkhand Expressways (Uttar Pradesh)',
    ],
    signs_to_watch: [
      'Rapid drop in ambient temperature near midnight or early morning over agricultural belts.',
      'Visibility suddenly reducing to under 20 meters near canal or river crossings.',
      'Reflective road studs (cat eyes) disappearing from sight beyond the hood.',
    ],
    precautions: [
      'Use dipped low-beam headlights and dedicated yellow fog lamps; high beams reflect off water droplets and create a blinding white wall.',
      'Strictly avoid using hazard (four-way) flashers while moving in dense fog; hazard lights confuse following motorists into believing you are stationary.',
      'Reduce speed drastically (recommended under 40 km/h on expressways) and guide vehicle along painted left shoulder edge lines.',
      'Never halt in active traffic lanes; if stopping, exit the expressway completely or park inside designated toll plaza rest areas.',
    ],
    emergency_actions: [
      'If involved in a minor fender-bender, immediately move all passengers behind crash barriers off the roadway to prevent multi-car pileups.',
      'Place reflective emergency triangle 50 meters behind the vehicle on the shoulder.',
      'Call Expressway toll helpline (e.g. 1033 or 1800-1033) for escort vehicle assistance.',
    ],
    non_diagnosis_disclaimer: 'Fog density varies minute-by-minute across microclimatic agricultural depressions and canal interfaces.',
  },
  {
    id: 'hazard-wildlife',
    hazard_type: 'Wildlife Corridors & Nocturnal Crossing',
    title: 'Elephant & Big Cat Highway Crossings',
    icon: 'Zap',
    high_risk_corridors: [
      'NH-766 & NH-67 (Bandipur & Mudumalai Tiger Reserves)',
      'NH-715 (Kaziranga National Park animal corridors)',
      'NH-7 (Pench Tiger Reserve forest stretch & flyover passes)',
      'Haridwar-Dehradun corridor via Rajaji National Park',
    ],
    signs_to_watch: [
      'Forest department animal crossing signboards with lower statutory speed limits.',
      'Fresh animal droppings or tracks along the gravel highway shoulder.',
      'Reflected eye-shine on high beam sweep along dark forest edges.',
    ],
    precautions: [
      'Comply strictly with statutory speed limits (generally 30-40 km/h) in marked forest corridors.',
      'Never honk high-decibel horns or use loud musical exhaust pipes inside reserve zones.',
      'Do not get out of the vehicle to take selfies or approach wild animals under any circumstances.',
      'Observe statutory night traffic bans where applicable (e.g. Bandipur 9 PM - 6 AM).',
    ],
    emergency_actions: [
      'If encountering an elephant herd crossing the highway, stop at least 50 meters away, switch off high beams, and wait quietly.',
      'Do not rev the engine or attempt to squeeze past the herd; give animals the right of way to complete their crossing.',
      'Report injured wildlife or highway collisions to the nearest Forest Department checkpost or Dial 112.',
    ],
    non_diagnosis_disclaimer: 'Wildlife movement is wild and spontaneous. Forest signs mark historic migration corridors rather than scheduled occurrences.',
  },
  {
    id: 'hazard-heatwave',
    hazard_type: 'Extreme Heat & Tyre Blowouts',
    title: 'Summer Highway Heatwaves & Tyre Degradation',
    icon: 'Sun',
    high_risk_corridors: [
      'NH-68 & NH-11 (Western Rajasthan desert stretches)',
      'NH-44 (Central India & Bundelkhand summer corridors)',
      'Delhi-Mumbai Expressway during April-June peak temperatures exceeding 45°C',
    ],
    signs_to_watch: [
      'Ambient air temperatures exceeding 42°C and asphalt surface temperatures topping 60°C.',
      'Tyre pressure monitoring system (TPMS) warning lights showing rapid pressure surge.',
      'Vehicle engine temperature gauge creeping towards the red zone during prolonged high-speed cruising.',
    ],
    precautions: [
      'Check tyre cold pressures before starting in the morning; do not deflate hot tyres during afternoon stops.',
      'Inspect tyre tread depth; bald or retreaded tyres suffer catastrophic delamination on heated concrete expressways.',
      'Carry minimum 5 litres of drinking water per occupant and spare radiator coolant.',
      'Schedule high-speed highway travel during cooler dawn and twilight hours.',
    ],
    emergency_actions: [
      'In the event of a high-speed tyre blowout, DO NOT slam on the brakes; grip the steering wheel firmly, coast gradually, and steer gently towards the shoulder.',
      'Once stopped safely, deploy emergency triangle and call NHAI 1033 assistance.',
    ],
    non_diagnosis_disclaimer: 'Tyre endurance depends on vehicle weight, tyre age, maintenance, and surface conditions.',
  },
  {
    id: 'hazard-breakdowns',
    hazard_type: 'Remote Breakdown Management',
    title: 'Breakdown Protocols on Remote Indian Highways',
    icon: 'Car',
    high_risk_corridors: [
      'Manali-Leh Highway (stretches like Morey Plains without cellular service)',
      'Spiti Valley Kaza corridor',
      'Remote desert highways in Barmer & Jaisalmer',
    ],
    signs_to_watch: [
      'Sudden loss of engine power, unusual smoke, brake fade, or transmission overheating.',
      'Dashboard warning indicators (check engine, battery, brake fluid).',
    ],
    precautions: [
      'Ensure tool kit contains jack, wheel spanner, jumper cables, tow strap, and puncture repair kit with 12V portable compressor.',
      'Keep a power bank and offline maps cached on at least two different smartphones.',
      'Share trip itinerary and expected arrival times with family before entering zero-connectivity valleys.',
    ],
    emergency_actions: [
      'Maneuver vehicle as far off the travel lane as possible onto a firm, visible shoulder.',
      'Raise the vehicle bonnet (hood) and place hazard triangle behind to signal distress to passing motorists.',
      'On mountain routes, wave down passing local taxis or BRO convoys for assistance.',
    ],
    non_diagnosis_disclaimer: 'Always verify vehicle roadworthiness at authorized service centers before entering remote corridors.',
  },
];

export const HazardGuidePage: React.FC = () => {
  const [selectedHazardId, setSelectedHazardId] = useState<string>(HAZARD_GUIDES[0].id);

  const selectedGuide = HAZARD_GUIDES.find((h) => h.id === selectedHazardId) || HAZARD_GUIDES[0];

  return (
    <div className="min-h-screen bg-warmWhite pb-16">
      {/* Header */}
      <div className="bg-navy-900 text-white border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-mint font-semibold text-xs tracking-wider uppercase mb-2">
            <AlertTriangle className="w-4 h-4 text-mint" />
            Highway Safety Protocols & Hazard Recognition
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-white">
            Hazard Guide
          </h1>
          <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
            Practical, evidence-based field guides for navigating extreme environmental conditions,
            geological hazards, wildlife encounters, and unexpected road incidents across India.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Navigation: Hazard Types */}
          <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-3 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 block">
              Documented Indian Road Hazards
            </span>
            {HAZARD_GUIDES.map((hazard) => {
              const isActive = hazard.id === selectedHazardId;
              return (
                <button
                  key={hazard.id}
                  type="button"
                  onClick={() => setSelectedHazardId(hazard.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-medium transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-teal text-white font-bold shadow-sm'
                      : 'text-navy-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-mint" />
                    <span>{hazard.hazard_type}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Content: Comprehensive Guide Dossier */}
          <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
            {/* Guide Header */}
            <div className="border-b border-slate-100 pb-5">
              <span className="text-xs font-bold text-teal uppercase tracking-wider">
                {selectedGuide.hazard_type}
              </span>
              <h2 className="text-2xl font-heading font-black text-navy-900 mt-1">
                {selectedGuide.title}
              </h2>
            </div>

            {/* High-Risk Corridors */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-teal" />
                Frequently Affected Corridors in India
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedGuide.high_risk_corridors.map((c, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-navy-900 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal flex-shrink-0" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning Signs */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Immediate Warning Signs to Observe
              </h3>
              <ul className="space-y-2">
                {selectedGuide.signs_to_watch.map((sign, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-xs text-amber-950 flex items-start gap-2.5 leading-relaxed">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Precautionary Measures */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal" />
                Precautionary Driving & Preparation Protocols
              </h3>
              <div className="space-y-2">
                {selectedGuide.precautions.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Actions */}
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 space-y-2 text-xs">
              <h3 className="font-bold text-red-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-red-600" />
                Immediate Emergency Actions if Caught Unawares
              </h3>
              <ul className="space-y-1.5 text-red-900 leading-relaxed">
                {selectedGuide.emergency_actions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-red-600">→</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Non-Diagnosis Disclaimer */}
            <div className="pt-4 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
              <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Methodology & Safety Disclaimer:</strong> {selectedGuide.non_diagnosis_disclaimer}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
