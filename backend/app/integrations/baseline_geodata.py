import datetime
from typing import List, Dict, Any
from backend.app.integrations.imd_adapter import imd_adapter
from backend.app.integrations.gsi_adapter import gsi_adapter
from backend.app.integrations.cwc_adapter import cwc_adapter
from backend.app.integrations.wildlife_adapter import wildlife_adapter
from backend.app.integrations.traffic_police_adapter import traffic_police_adapter

def get_baseline_sources() -> List[Dict[str, Any]]:
    return [
        {
            "name": "India Meteorological Department (IMD)",
            "category": "weather",
            "official_url": "https://mausam.imd.gov.in/",
            "licensing_notes": "Government Open Data / Public Meteorological Dissemination",
            "adapter_type": "imd_cap_adapter",
            "refresh_policy": "every 30 minutes",
            "health_status": "healthy"
        },
        {
            "name": "National Disaster Management Authority (NDMA / SACHET)",
            "category": "disaster",
            "official_url": "https://ndma.gov.in/",
            "licensing_notes": "Official Public Early Warning Bulletins",
            "adapter_type": "ndma_sachet_adapter",
            "refresh_policy": "every 15 minutes",
            "health_status": "healthy"
        },
        {
            "name": "Central Water Commission (CWC Flood Forecasting)",
            "category": "weather",
            "official_url": "https://ffs.india-water.gov.in/",
            "licensing_notes": "Central Water Commission Open Hydrological Bulletins",
            "adapter_type": "cwc_flood_adapter",
            "refresh_policy": "every 1 hour",
            "health_status": "healthy"
        },
        {
            "name": "Geological Survey of India (GSI)",
            "category": "geotechnical",
            "official_url": "https://www.gsi.gov.in/",
            "licensing_notes": "National Landslide Susceptibility Mapping (NLSM) Open Public Data",
            "adapter_type": "gsi_nlsm_adapter",
            "refresh_policy": "seasonal / post-monsoon baseline",
            "health_status": "healthy"
        },
        {
            "name": "State Forest Departments Wildlife Advisories",
            "category": "wildlife",
            "official_url": "https://moef.gov.in/",
            "licensing_notes": "Public Roadkill Mitigation & Wildlife Sanctuary Crossing Advisories (Anti-Poaching Fuzzed)",
            "adapter_type": "wildlife_corridor_adapter",
            "refresh_policy": "daily / seasonal migration advisories",
            "health_status": "healthy"
        },
        {
            "name": "Highway & Traffic Police Public Alerts",
            "category": "road_infrastructure",
            "official_url": "https://nhai.gov.in/",
            "licensing_notes": "Public Highway Travel Advisories & Traffic Police Bulletins",
            "adapter_type": "traffic_police_adapter",
            "refresh_policy": "hourly",
            "health_status": "healthy"
        }
    ]

def get_baseline_incidents() -> List[Dict[str, Any]]:
    """
    Returns authentic, geographically precise baseline hazard records across India.
    Includes active geological hazards, weather warnings, protected wildlife corridors,
    and road disruptions with strict provenance and explicit sample/baseline identification.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    all_incidents: List[Dict[str, Any]] = []

    # 1. IMD Meteorological Bulletins across North, South, East, West, Central, Northeast
    all_incidents.extend(imd_adapter._get_baseline_warnings())

    # 2. GSI Landslide Susceptibility Corridors (Himalayas, Western Ghats, Northeast)
    all_incidents.extend(gsi_adapter.fetch_geological_hazards())

    # 3. CWC River Basin Flood Advisories (Brahmaputra, Ganga, Godavari, Mahanadi)
    all_incidents.extend(cwc_adapter.fetch_flood_advisories())

    # 4. State Forest Departments Wildlife Corridors (Bandipur, Kaziranga, Gir, Tadoba, Corbett)
    all_incidents.extend(wildlife_adapter.fetch_wildlife_corridors())

    # 5. NHAI & State Traffic Police Bulletins (NH-44, NH-48, NH-19, NH-16)
    all_incidents.extend(traffic_police_adapter.fetch_traffic_disruptions())

    # 6. Explicit QA Sample Record for testing
    all_incidents.append({
        "hazard_category": "road_infrastructure",
        "title": "SAMPLE DATA — NOT A LIVE ALERT: Simulated Construction Diversion on Pune-Goa NH-4",
        "description": "This is an explicit simulated test record for platform QA and demonstration. Bridge deck maintenance simulation near Shirwal.",
        "latitude": 18.1350,
        "longitude": 73.9850,
        "affected_radius_meters": 3000.0,
        "observed_time": now - datetime.timedelta(days=1),
        "published_time": now - datetime.timedelta(days=1),
        "source_name": "TravelLord QA Test Harness",
        "source_url": "https://travellord.ai/docs/testing",
        "source_severity": "Simulated Lane Restriction",
        "platform_severity": "low",
        "verification_status": "unverified",
        "status": "active",
        "is_sample_data": True, # STRICTLY MARKED AS SAMPLE DATA
        "evidence_quality": "low",
        "fuzzed_coordinates": False,
        "geographic_precision": "highway_marker",
        "expiry_time": now + datetime.timedelta(days=1)
    })

    return all_incidents
