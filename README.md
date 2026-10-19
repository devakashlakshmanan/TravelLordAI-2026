# TravelLord AI 🇮🇳

> **"Travel informed. Travel aware."**  
> *Know more about the journey ahead. Understand the hazards, examine the evidence, and make better-informed travel decisions.*

TravelLord AI is an evidence-driven, multi-threat travel intelligence and risk-awareness platform designed for India's national highways, state corridors, mountain passes, and urban arterials.

---

## 🌟 Core Innovations

1. **Nationwide Geographic Coverage**: Full route planning, geocoding, and threat exploration across all 28 Indian States, 8 Union Territories, national highways, and mountain corridors.
2. **Cohesive Travel Awareness Suite**: Reorganized into 4 dedicated navigation groups:
   - **Journey**: Plan Journey, My Journeys, RoadWatch, Travel Pack.
   - **Explore**: Discover, TravelWise, Hazard Guide.
   - **Community**: Live Reports, Report an Issue, My Contributions.
   - **Trust & Safety**: Official Alerts, Source Centre, Emergency Guide.
3. **Multi-Threat Risk Fusion**: Real-time integration of meteorological alerts (IMD), hydrological river flood warnings (CWC), disaster bulletins (NDMA), geotechnical landslide susceptibility (GSI NLSM), wildlife corridors (Forest Departments with anti-poaching fuzzing), and road closures (NHAI & Traffic Police).
4. **Corridor Buffer Geospatial Analysis**: Maps journeys into discrete corridor slices, evaluating proximity, terrain vulnerability, and temporal overlap.
5. **Evidence-Grounded Intelligence**: Every risk metric is traceable to raw observations, official warnings, or corroborated citizen reports. The system explicitly discloses data freshness and uncertainty without speculative accident scores or AI danger claims.
6. **Transparent "Zero-Incident" Policy**: The absence of reported alerts along a route is never portrayed as "verified safe."
7. **Alternative Route Trade-off Comparison**: Compares primary and alternative routes by distance, travel time, and threat exposure score.
8. **Coverage & Freshness Transparency Dossier**: Interactive dashboard exposing source health, refresh intervals, and geographic precision levels.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 18, Vite, TypeScript
  - Tailwind CSS with customized TravelLord design tokens
  - Leaflet & React-Leaflet for interactive spatial mapping
  - Lucide React icons, accessible dialogs & responsive viewports
- **Backend**:
  - Python 3.12+ / 3.14+, FastAPI
  - SQLAlchemy 2.0 Async ORM with Pydantic v2 schemas
  - PostGIS / Geodesic spatial corridor matching
  - JWT Authentication with secure HttpOnly cookies & RBAC
- **Data & Ingestion Pipeline**:
  - OpenStreetMap & OSRM routing engine with alternative route generation
  - Nominatim pan-India geocoder with coordinate parsing & reverse geocoding
  - Independent adapters for IMD, CWC, GSI, Wildlife, and NHAI
  - National ingestion pipeline (`/api/v1/sources/sync`)
  - Controlled community reporting & moderation lifecycle

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations / database setup & seed baseline data
python -m backend.seed_data

# Start FastAPI server
uvicorn backend.app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application will be live at `http://localhost:5173`.

---

## 📁 Repository Structure
```
├── docs/                     # Full system specifications & documentation
│   ├── requirements.md
│   ├── architecture.md
│   ├── data_sources.md
│   ├── risk_methodology.md
│   ├── api_specification.md
│   ├── security_and_privacy.md
│   ├── testing_strategy.md
│   └── implementation_status.md
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/v1/          # Versioned REST endpoints
│   │   ├── core/            # Config, security, database session
│   │   ├── models/          # SQLAlchemy async models
│   │   ├── schemas/         # Pydantic v2 request/response models
│   │   ├── services/        # Business logic, spatial engine, risk fusion
│   │   ├── integrations/    # External data adapters (IMD, OSRM, GSI)
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Pytest suite
│   └── requirements.txt
├── frontend/                 # React + Vite + TypeScript Application
│   ├── src/
│   │   ├── components/      # Reusable UI & Map components
│   │   ├── pages/           # All 22 application routes (Journey, Explore, Community, Trust & Safety, Admin)
│   │   ├── services/        # Typed API clients
│   │   ├── types/           # Shared TypeScript interfaces
│   │   ├── App.tsx          # React Router setup
│   │   └── main.tsx
│   └── package.json
├── .env.example              # Sample environment variables
└── README.md
```

---

## 🔒 Security & Privacy
- Zero plaintext password storage (Bcrypt hashing).
- Sensitive wildlife sightings have coordinates fuzzed to protect endangered species from poaching.
- RBAC protection for admin workflows and strict user data isolation.

## 📄 License
Open Database License (ODbL) for OpenStreetMap data. Code released under MIT License.
