import pytest
import pytest_asyncio
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from backend.app.main import app, init_db_and_seed
from backend.app.core.config import settings
from backend.app.services.assistant_service import assistant_service

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    await init_db_and_seed()

async def get_auth_token(client: AsyncClient) -> str:
    """Helper to authenticate and return a valid JWT token."""
    reg_payload = {
        "name": "Groq Test Traveler",
        "email": "groq.tester@example.com",
        "password": "SecurePassword123!"
    }
    await client.post("/api/v1/auth/register", json=reg_payload)
    
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "groq.tester@example.com",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    return login_res.json()["access_token"]

@pytest.mark.asyncio
async def test_assistant_unauthenticated_rejected():
    """Unauthenticated queries must be rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/assistant/query", json={
            "query": "Is NH-44 open today?"
        })
        assert res.status_code == 401

@pytest.mark.asyncio
async def test_assistant_empty_and_short_query_validation():
    """Empty or excessively short queries must return 400 Bad Request."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client)
        # Empty string
        res_empty = await client.post(
            "/api/v1/assistant/query",
            json={"query": "    "},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res_empty.status_code == 400
        assert "Query must contain at least 2 characters" in res_empty.json()["detail"]

        # Single character
        res_short = await client.post(
            "/api/v1/assistant/query",
            json={"query": "?"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res_short.status_code == 400

@pytest.mark.asyncio
async def test_assistant_query_with_history_and_groq():
    """Authenticated query with multi-turn conversation history."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client)
        payload = {
            "query": "What are the night traffic rules and speed limits along Bandipur on NH-766?",
            "history": [
                {"role": "user", "content": "I am planning a trip across Karnataka and Kerala."},
                {"role": "assistant", "content": "I can help with route alerts and wildlife regulations."}
            ]
        }
        res = await client.post(
            "/api/v1/assistant/query",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert "answer" in data
        assert len(data["answer"]) > 20
        # Truthful Safety principle
        assert data["is_synthesized_safety_guarantee"] is False
        assert data["data_freshness_status"] == "live_verified"
        assert data["provider"] in ["groq", "grounded_rag"]

@pytest.mark.asyncio
async def test_assistant_safety_guarantee_refusal():
    """Assistant must never synthesize a 100% safety guarantee."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client)
        res = await client.post(
            "/api/v1/assistant/query",
            json={"query": "Guarantee me that the Mumbai to Pune expressway is 100% safe right now."},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_synthesized_safety_guarantee"] is False
        answer_lower = data["answer"].lower()
        # Ensure either explicit disclaimer or no guarantee is made
        assert "safe" in answer_lower or "guarantee" in answer_lower or "absence of" in answer_lower or "precaution" in answer_lower

@pytest.mark.asyncio
async def test_assistant_fallback_when_groq_fails():
    """When Groq throws an exception or key is unavailable, deterministic RAG fallback must trigger."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client)
        # Mock _call_groq_llm to simulate an API outage/rate limit
        with patch.object(assistant_service, "_call_groq_llm", side_effect=Exception("Groq upstream connection timeout")):
            res = await client.post(
                "/api/v1/assistant/query",
                json={"query": "What are the rules for Bandipur night curfew?"},
                headers={"Authorization": f"Bearer {token}"}
            )
            assert res.status_code == 200
            data = res.json()
            assert data["provider"] == "grounded_rag"
            assert "1033" in data["answer"] # Emergency helpline present
            assert data["is_synthesized_safety_guarantee"] is False

@pytest.mark.asyncio
async def test_assistant_rate_limiting():
    """Server-side rate limiter enforces max 30 requests per minute per user."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client)
        from backend.app.api.v1.assistant import _user_request_timestamps, MAX_REQUESTS_PER_WINDOW
        
        # Get user ID
        me_res = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
        user_id = me_res.json()["id"]

        # Pre-fill user request timestamps to simulate hitting the cap
        import time
        now = time.time()
        _user_request_timestamps[user_id] = [now] * MAX_REQUESTS_PER_WINDOW

        # Next query must return 429
        res = await client.post(
            "/api/v1/assistant/query",
            json={"query": "Checking rate limit enforcement."},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 429
        assert "Rate limit exceeded" in res.json()["detail"]

        # Clean up
        _user_request_timestamps[user_id].clear()
