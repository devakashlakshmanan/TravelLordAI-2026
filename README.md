# TravelLord AI 🇮🇳

> **"Travel informed. Travel aware."**  
> *Know more about the journey ahead. Understand the hazards, examine the evidence, and make better-informed travel decisions.*

TravelLord AI is an evidence-driven, multi-threat travel intelligence and risk-awareness platform designed for India's national highways, state corridors, mountain passes, and urban arterials.

---

## 🌟 Core Innovations

1. **Multi-Threat Risk Fusion**: Real-time integration of meteorological alerts (IMD), disaster bulletins (NDMA), geotechnical landslide susceptibility (GSI), wildlife crossing corridors, road infrastructure damage, and civic blockades.
2. **Corridor Buffer Geospatial Analysis**: Maps journeys into discrete corridor slices, evaluating proximity, terrain vulnerability, and temporal overlap.
3. **Evidence-Grounded Intelligence**: Every risk metric is traceable to raw observations, official warnings, or corroborated citizen reports. The system explicitly discloses data freshness and uncertainty.
4. **Transparent "Zero-Incident" Policy**: The absence of reported alerts along a route is never portrayed as "verified safe."
5. **Alternative Route Trade-off Comparison**: Compares primary and alternative routes by distance, travel time, and threat exposure score.

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
  - OpenStreetMap & OSRM routing engine
  - IMD weather and NDMA disaster adapters
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
│   │   ├── pages/           # All 11 application routes
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
