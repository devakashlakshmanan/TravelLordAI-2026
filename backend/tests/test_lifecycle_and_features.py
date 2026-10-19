import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app, init_db_and_seed

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    await init_db_and_seed()

@pytest.mark.asyncio
async def test_community_incident_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        import time, uuid
        uid = str(uuid.uuid4())[:8]
        # 1. Register User A (Reporter)
        user_a_email = f"reporter_{uid}@example.com"
        await client.post("/api/v1/auth/register", json={
            "name": "Citizen Reporter A",
            "email": user_a_email,
            "password": "Password123!"
        })
        login_a = await client.post("/api/v1/auth/login", json={
            "email": user_a_email,
            "password": "Password123!"
        })
        token_a = login_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # 2. Register User B (Witness / Corroborator)
        user_b_email = f"witness_{uid}@example.com"
        await client.post("/api/v1/auth/register", json={
            "name": "Citizen Witness B",
            "email": user_b_email,
            "password": "Password123!"
        })
        login_b = await client.post("/api/v1/auth/login", json={
            "email": user_b_email,
            "password": "Password123!"
        })
        token_b = login_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # 3. User A submits a community report with unique coordinates
        base_lat = 27.5000 + (time.time() % 100) / 100.0
        base_lon = 78.5000 + (time.time() % 100) / 100.0
        report_payload = {
            "title": f"Severe Waterlogging on Expressway {uid}",
            "category": "road_infrastructure",
            "description": "Right two lanes under 40cm water near Kherki Daula toll due to choked culvert drainage.",
            "latitude": base_lat,
            "longitude": base_lon,
            "location_name": "NH-48 Kherki Daula Toll Plaza, Gurugram"
        }
        res_submit = await client.post("/api/v1/reports", json=report_payload, headers=headers_a)
        assert res_submit.status_code == 201
        report_data = res_submit.json()
        report_id = report_data["id"]
        assert report_data["title"] == report_payload["title"]
        assert report_data["moderation_state"] == "unverified"
        assert report_data["corroborations_count"] == 0
        assert report_data["disputes_count"] == 0
        assert report_data.get("incident_id") is not None

        # 4. Self-corroboration prevention: User A attempts to corroborate own report
        res_self_corroborate = await client.post(
            f"/api/v1/reports/{report_id}/corroborate",
            json={"notes": "I definitely saw it myself!"},
            headers=headers_a
        )
        assert res_self_corroborate.status_code == 400
        assert "cannot corroborate your own report" in res_self_corroborate.json()["detail"]

        # 5. User B corroborates User A's report
        res_corroborate = await client.post(
            f"/api/v1/reports/{report_id}/corroborate",
            json={"notes": "Confirmed, water receded slightly but lane 1 still blocked."},
            headers=headers_b
        )
        assert res_corroborate.status_code == 200
        corroborate_data = res_corroborate.json()
        assert corroborate_data["corroborations_count"] == 1
        assert corroborate_data["moderation_state"] == "corroborated"

        # 6. Verify shared community feed returns the report with updated status
        res_feed = await client.get("/api/v1/reports/feed?category=road_infrastructure", headers=headers_a)
        assert res_feed.status_code == 200
        feed_items = res_feed.json()
        matched = next((item for item in feed_items if item["id"] == report_id), None)
        assert matched is not None
        assert matched["moderation_state"] == "corroborated"
        assert matched["corroborations_count"] == 1
        # Privacy check: Reporter email must NOT be exposed
        assert "reporter_email" not in matched
        assert "email" not in matched

        # 7. Duplicate clustering: User B submits another report 60m away in same category
        duplicate_payload = {
            "title": f"Flooded stretch near Kherki Daula {uid}",
            "category": "road_infrastructure",
            "description": "Standing water noticed on the highway lanes.",
            "latitude": base_lat + 0.0005, # ~55m away
            "longitude": base_lon + 0.0005,
            "location_name": "Near Kherki Daula Toll"
        }
        res_dup = await client.post("/api/v1/reports", json=duplicate_payload, headers=headers_b)
        assert res_dup.status_code == 201
        dup_data = res_dup.json()
        # Should cluster to the existing report and elevate corroborations!
        assert dup_data["id"] == report_id
        assert dup_data["corroborations_count"] >= 1

        # 8. Dispute flow: User B disputes the report stating road is cleared
        res_dispute = await client.post(
            f"/api/v1/reports/{report_id}/dispute",
            json={"reason": "hazard_cleared", "notes": "NHAI pumps cleared the water, all lanes moving."},
            headers=headers_b
        )
        assert res_dispute.status_code == 200
        dispute_data = res_dispute.json()
        assert dispute_data["moderation_state"] == "disputed"
        assert dispute_data["disputes_count"] == 1

        # 9. Resolution flow: User A marks the report resolved
        res_resolve = await client.post(f"/api/v1/reports/{report_id}/resolve", headers=headers_a)
        assert res_resolve.status_code == 200
        assert res_resolve.json()["moderation_state"] == "resolved"
