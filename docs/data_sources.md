# TravelLord AI — External Data Sources & Adapter Registry

This document records all candidate, active, and baseline data sources integrated into TravelLord AI, including access methods, licensing terms, geographic coverage, and current verification status.

---

## 1. Data Source Registry

| Source Name | Category | Official URL | Access Method | Licensing / Terms | Geographic Scope | Verified / Tested | Current Integration State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **India Meteorological Department (IMD)** | Weather & Extreme Alerts | https://mausam.imd.gov.in/ | Public CAP / RSS Alerts & Weather Forecast Endpoints | Government Open Data / Attributed Use | Pan-India (Sub-divisional & District) | Yes | **Adapter Active** with offline fallback cache |
| **National Disaster Management Authority (NDMA)** | Disaster & Early Warning | https://ndma.gov.in/ | Public Bulletins / SACHET National Early Warning CAP Feeds | Official Public Notices | Pan-India | Yes | **Adapter Active** |
| **OSRM (Project OSRM)** | Road Routing & Distance | https://project-osrm.org/ | Open REST routing API (`/route/v1/driving`) | Open Database License (ODbL) | Pan-India & Global | Yes | **Adapter Active** with configurable endpoint |
| **OpenStreetMap & Nominatim** | Geocoding & Place Search | https://nominatim.openstreetmap.org/ | REST Search API (`/search`) | ODbL / OSM Foundation Acceptable Use | Pan-India | Yes | **Adapter Active** with custom user-agent & throttling |
| **Geological Survey of India (GSI)** | Landslides & Terrain Susceptibility | https://www.gsi.gov.in/ | National Landslide Susceptibility Mapping (NLSM) baselines | Public Geological Survey Records | Western Ghats, Himalayas, NE India | Yes | **Baseline Ingested** with macro-zone spatial geometry |
| **State Forest Departments / Wildlife Baselines** | Wildlife Corridors & Crossings | Authorized public advisory datasets | Spatial corridor buffers & published crossing zones | Public Road Safety Advisories | Major NH/SH through wildlife sanctuaries (e.g. Bandipur, Kaziranga, Corbett) | Yes | **Sensitive Coords Fuzzed** for anti-poaching compliance |
| **Community Hazard Submissions** | Citizen Reports | TravelLord AI App Submission Pipeline | Internal Authenticated REST Endpoint | TravelLord Platform Policy | User-reported coordinates in India | Yes | **Moderation Pipeline Active** |

---

## 2. Ingestion & Freshness Policy
- **IMD & Weather Feeds**: Refreshed every 30 to 60 minutes. Alerts marked stale after 6 hours unless reaffirmed by source.
- **Disaster Bulletins**: Ingested on scheduled 15-minute intervals with immediate broadcast for red/orange warnings.
- **Landslide Susceptibility**: Static geological base data refreshed annually or upon major post-monsoon GSI revisions.
- **Wildlife Corridors**: Active crossing alerts expire after 12 to 24 hours; permanent crossing zones remain continuous static advisories.
- **Civic & Road Blocks**: Expire after 8 hours unless renewed by community verification or traffic authority confirmation.
