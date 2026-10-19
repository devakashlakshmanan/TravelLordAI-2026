import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app, init_db_and_seed
from backend.app.core.database import AsyncSessionLocal
from backend.app.services.ingestion_service import ingestion_pipeline
from backend.app.integrations.nominatim_adapter import nominatim_client
from backend.app.integrations.imd_adapter import imd_adapter
from backend.app.integrations.gsi_adapter import gsi_adapter
from backend.app.integrations.cwc_adapter import cwc_adapter
from backend.app.integrations.wildlife_adapter import wildlife_adapter
from backend.app.integrations.traffic_police_adapter import traffic_police_adapter

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    await init_db_and_seed()
    async with AsyncSessionLocal() as session:
        await ingestion_pipeline.run_full_sync(session)

@pytest.mark.asyncio
async def test_pan_india_geocoding():
    """Verify place resolution across Northern, Southern, Eastern, Western, Central, Northeast India and Islands."""
    test_queries = [
        # North
        ("Delhi", "Delhi"),
        ("Shimla", "Himachal Pradesh"),
        ("Jaipur", "Rajasthan"),
        # West
        ("Mumbai", "Maharashtra"),
        ("Pune", "Maharashtra"),
        ("Ahmedabad", "Gujarat"),
        # South
        ("Bengaluru", "Karnataka"),
        ("Chennai", "Tamil Nadu"),
        ("Kochi", "Kerala"),
        # East
        ("Kolkata", "West Bengal"),
        # Central
        ("Bhopal", "Madhya Pradesh"),
        # Northeast
        ("Guwahati", "Assam"),
        ("Shillong", "Meghalaya"),
        # Islands
        ("Port Blair", "Andaman and Nicobar Islands")
    ]

    for query, expected_region in test_queries:
        results = await nominatim_client.search(query, limit=3)
        assert len(results) > 0, f"Geocoding failed for {query}"
        top = results[0]
        assert "lat" in top and "lon" in top
        assert -90.0 <= top["lat"] <= 90.0
        assert -180.0 <= top["lon"] <= 180.0
        matched = any(expected_region.lower() in r["display_name"].lower() or query.lower() in r["display_name"].lower() for r in results)
        assert matched, f"Expected {expected_region} in results for {query}, got {top['display_name']}"

@pytest.mark.asyncio
async def test_coordinate_parsing_and_reverse_geocoding():
    """Verify direct coordinate entry and reverse geocoding functionality."""
    # 1. Direct coordinate regex parsing
    coord_query = "19.0760, 72.8777"
    results = await nominatim_client.search(coord_query)
    assert len(results) == 1
    assert abs(results[0]["lat"] - 19.0760) < 0.001
    assert abs(results[0]["lon"] - 72.8777) < 0.001
    assert "Mumbai" in results[0]["display_name"] or "Coordinates" in results[0]["display_name"]

    # 2. Reverse geocode endpoint via API
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/routes/reverse-geocode?lat=13.0827&lon=80.2707")
        assert res.status_code == 200
        data = res.json()
        assert data is not None
        assert "lat" in data and "lon" in data
        assert abs(data["lat"] - 13.0827) < 0.01

@pytest.mark.asyncio
async def test_cross_state_intercity_route_risk_fusion():
    """Verify route calculation and risk corridor analysis across Indian states."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register and login a user for route analysis
        user_email = "corridortester2@travellord.ai"
        await client.post("/api/v1/auth/register", json={
            "name": "Corridor Tester",
            "email": user_email,
            "password": "SecurePassword123!"
        })
        login_res = await client.post("/api/v1/auth/login", json={
            "email": user_email,
            "password": "SecurePassword123!"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Interstate Route: Bengaluru (Karnataka) to Chennai (Tamil Nadu)
        bengaluru_chennai_req = {
            "origin_label": "Bengaluru, Karnataka, India",
            "origin_lat": 12.9716,
            "origin_lon": 77.5946,
            "destination_label": "Chennai, Tamil Nadu, India",
            "destination_lat": 13.0827,
            "destination_lon": 80.2707,
            "travel_mode": "driving"
        }
        res = await client.post("/api/v1/routes/analyze", json=bengaluru_chennai_req, headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert data["distance_meters"] > 200000.0 # ~300+ km
        assert len(data["geometry"]) > 5
        assert len(data["segments"]) > 0
        assert data["is_safe_claim"] is False
        assert "analysis_id" in data

@pytest.mark.asyncio
async def test_pan_india_threat_filtering_and_viewport_queries():
    """Verify multi-criteria filtering, state selection, and spatial bounding box queries."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Sync feeds to guarantee latest national hazards
        await client.post("/api/v1/sources/sync")

        # 2. Filter by category
        res_cat = await client.get("/api/v1/incidents?category=weather")
        assert res_cat.status_code == 200
        for inc in res_cat.json():
            assert inc["hazard_category"] == "weather"

        # 3. Filter by state (e.g. Assam or Himachal Pradesh)
        res_state = await client.get("/api/v1/incidents?state=Assam")
        assert res_state.status_code == 200
        assert len(res_state.json()) > 0
        for inc in res_state.json():
            assert "assam" in inc["title"].lower() or "assam" in inc["description"].lower()

        # 4. Viewport bounding box: South India (lat 8.0 to 18.0, lon 73.0 to 82.0)
        res_bbox = await client.get("/api/v1/incidents?min_lat=8.0&max_lat=18.0&min_lon=73.0&max_lon=82.0")
        assert res_bbox.status_code == 200
        for inc in res_bbox.json():
            assert 8.0 <= inc["latitude"] <= 18.0
            assert 73.0 <= inc["longitude"] <= 82.0

@pytest.mark.asyncio
async def test_official_source_adapters_and_anti_poaching():
    """Verify official adapter behaviors: IMD precision, wildlife fuzzing, CWC, and GSI."""
    # 1. IMD Adapter: verifies district-level precision
    imd_warnings = await imd_adapter.fetch_district_warnings()
    assert len(imd_warnings) > 0
    for w in imd_warnings:
        assert w["geographic_precision"] in ["district_level", "subdivision_level"]
        assert "IMD" in w["source_name"]

    # 2. Wildlife Adapter: strict anti-poaching coordinate fuzzing compliance
    wildlife_zones = wildlife_adapter.fetch_wildlife_corridors()
    assert len(wildlife_zones) > 0
    for z in wildlife_zones:
        assert z["fuzzed_coordinates"] is True, f"Wildlife corridor {z['title']} must have coordinates fuzzed"
        assert z["hazard_category"] == "wildlife"

    # 3. GSI Adapter: landslide susceptibility distinction
    gsi_hazards = gsi_adapter.fetch_geological_hazards()
    assert len(gsi_hazards) > 0
    for g in gsi_hazards:
        full_text = (g["title"] + " " + g["description"] + " " + g["source_severity"]).lower()
        assert any(term in full_text for term in ["susceptibility", "vulnerability"])
        assert g["hazard_category"] == "landslide"

    # 4. Ingestion Sync API
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        sync_res = await client.post("/api/v1/sources/sync")
        assert sync_res.status_code == 200
        data = sync_res.json()
        assert "retrieved_total" in data
        assert data["retrieved_total"] > 10
