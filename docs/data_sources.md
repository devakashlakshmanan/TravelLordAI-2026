# TravelLord AI — External Data Sources & Adapter Registry

This document records all candidate, active, and baseline data sources integrated into TravelLord AI, including access methods, licensing terms, geographic coverage, verification status, and data freshness policies.

---

## 1. Nationwide Data Source Registry

| Source Name | Category | Official URL | Access Method | Licensing / Terms | Geographic Scope | Verified / Tested | Current Integration State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **India Meteorological Department (IMD)** | Meteorology & Extreme Weather | https://mausam.imd.gov.in/ | Public CAP / RSS Alerts, District Warnings & Nowcasts | Government Open Data / Attributed Public Use | Pan-India (District & Sub-divisional) | Yes | **Adapter Active** (`imd_adapter.py`) with district-level attribution |
| **National Disaster Management Authority (NDMA / SACHET)** | Disaster & Early Warning | https://ndma.gov.in/ | Public Bulletins / SACHET National Early Warning CAP Feeds | Official Public Notices | Pan-India | Yes | **Adapter Active** with automated ingestion sync |
| **Central Water Commission (CWC)** | River Basin Floods & Inundation | https://ffs.india-water.gov.in/ | National Flood Forecasting Hydro-Meteorological Bulletins | Ministry of Jal Shakti Open Bulletins | Major Indian river basins (Ganga, Brahmaputra, Godavari, Mahanadi) | Yes | **Adapter Active** (`cwc_adapter.py`) with threshold water level metrics |
| **Geological Survey of India (GSI)** | Landslides & Terrain Susceptibility | https://www.gsi.gov.in/ | National Landslide Susceptibility Mapping (NLSM) baselines | Public Geological Survey Records | Himalayas (UK, HP, J&K), Western Ghats (MH, Goa, KA, KL), Northeast (ML, AS, SK) | Yes | **Adapter Active** (`gsi_adapter.py`) with clear susceptibility distinction |
| **State Forest Departments Wildlife Advisories** | Wildlife Corridors & Crossings | Authorized public advisory datasets (MoEFCC) | Spatial corridor buffers & published crossing zones | Public Road Safety Advisories | National highway corridors through Tiger Reserves (Bandipur, Kaziranga, Corbett, Gir, Tadoba) | Yes | **Adapter Active** (`wildlife_adapter.py`) with **Strict Anti-Poaching Coordinate Fuzzing** |
| **Highway Authorities (NHAI) & Traffic Police** | Highway Closures & Infrastructure | https://nhai.gov.in/ | Official Highway Safety Bulletins & Traffic Police Notices | Public Highway Travel Advisories | National Highway Arterials (NH-44, NH-48, NH-19, NH-16, NH-66) | Yes | **Adapter Active** (`traffic_police_adapter.py`) with real lane-restriction notices |
| **OSRM (Project OSRM)** | Road Routing & Turn-by-Turn | https://project-osrm.org/ | Open REST routing API (`/route/v1/driving`) | Open Database License (ODbL) | Pan-India Interstate Network | Yes | **Adapter Active** (`osrm_adapter.py`) with alternative route generation |
| **OpenStreetMap & Nominatim** | Geocoding & Place Search | https://nominatim.openstreetmap.org/ | REST Search & Reverse API (`/search`, `/reverse`) | ODbL / OSM Foundation Acceptable Use | Pan-India (All 28 States, 8 UTs, coordinates) | Yes | **Adapter Active** (`nominatim_adapter.py`) with Indian bounding box & coordinate parser |
| **Community Hazard Submissions** | Citizen Reports | TravelLord AI App Submission Pipeline | Authenticated REST Endpoint (`POST /api/v1/reports`) | TravelLord Platform Policy | User-reported coordinates across India | Yes | **Moderation Pipeline Active** with citizen tracking at `/my-reports` |

---

## 2. Ingestion & Freshness Policy
- **IMD Meteorological Feeds**: Refreshed every 30 to 60 minutes. Alerts marked stale after 6 hours unless reaffirmed by source. District warnings strictly attributed as district-level.
- **CWC Flood Advisories**: Refreshed hourly. Water-level threshold exceedances mapped to river basin highway crossings.
- **Landslide Susceptibility**: Static GSI NLSM geological baseline updated seasonally. Explicitly distinguished from active collapses.
- **Wildlife Crossing Corridors**: Permanent protected crossing zones maintained with intentional spatial centroid fuzzing (2-5 km) to protect endangered species from poaching.
- **Highway Disruptions & Civil Blockades**: Expire after 8 to 24 hours unless reaffirmed by highway safety patrol bulletins.
- **National Ingestion Pipeline**: Executable on demand via `POST /api/v1/sources/sync`, deduplicating records, retiring expired events, and updating source telemetry.

---

## 3. Geographic Attribution Rules
1. **District-Level Warnings**: When IMD issues an alert for a district (e.g. Kullu or Raigad), TravelLord AI records it as a district-level alert and does not claim to know the exact weather on an individual unmonitored road segment.
2. **Terrain Susceptibility vs Active Landslide**: GSI susceptibility mapping indicates slope vulnerability; it is not presented as an active debris flow unless corroborated by highway police notices.
3. **Wildlife Protection Act Compliance**: Coordinates for wildlife crossings are fuzzed at ingestion to safeguard wildlife against poaching.
4. **Zero-Incident Policy**: A zero-incident count along a route or region does not mean verified safe. Unmonitored rural stretches may face undocumented risks.
