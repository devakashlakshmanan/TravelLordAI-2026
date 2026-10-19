import logging
import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, AsyncSessionLocal
from backend.app.core.security import hash_password
from backend.app.models.entities import User, UserPreference, Source, Incident
from backend.app.integrations.baseline_geodata import get_baseline_sources, get_baseline_incidents

from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.users import router as users_router
from backend.app.api.v1.routes import router as routes_router
from backend.app.api.v1.incidents import router as incidents_router
from backend.app.api.v1.reports import router as reports_router
from backend.app.api.v1.assistant import router as assistant_router
from backend.app.api.v1.notifications import router as notifications_router
from backend.app.api.v1.admin import router as admin_router
from backend.app.api.v1.sources import router as sources_router
from backend.app.api.v1.support import router as support_router

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("travellord")

async def init_db_and_seed():
    """Create database tables and seed baseline sources, incidents, and bootstrap admin."""
    def migrate_columns(connection):
        cursor = connection.connection.cursor()
        cursor.execute("PRAGMA table_info(community_reports)")
        existing_cols = {row[1] for row in cursor.fetchall()}
        if existing_cols:
            if "title" not in existing_cols:
                cursor.execute("ALTER TABLE community_reports ADD COLUMN title VARCHAR(200)")
            if "incident_id" not in existing_cols:
                cursor.execute("ALTER TABLE community_reports ADD COLUMN incident_id VARCHAR(36)")
            if "corroborator_ids" not in existing_cols:
                cursor.execute("ALTER TABLE community_reports ADD COLUMN corroborator_ids JSON DEFAULT '[]'")
            if "dispute_records" not in existing_cols:
                cursor.execute("ALTER TABLE community_reports ADD COLUMN dispute_records JSON DEFAULT '[]'")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(migrate_columns)

    async with AsyncSessionLocal() as session:
        # 1. Seed Sources
        s_res = await session.execute(select(Source))
        existing_sources = s_res.scalars().all()
        if not existing_sources:
            logger.info("Seeding baseline data sources...")
            for s_data in get_baseline_sources():
                source = Source(
                    name=s_data["name"],
                    category=s_data["category"],
                    official_url=s_data["official_url"],
                    licensing_notes=s_data.get("licensing_notes"),
                    adapter_type=s_data["adapter_type"],
                    refresh_policy=s_data["refresh_policy"],
                    last_successful_retrieval=datetime.datetime.now(datetime.timezone.utc),
                    last_observed_update=datetime.datetime.now(datetime.timezone.utc),
                    health_status=s_data["health_status"]
                )
                session.add(source)

        # 2. Seed Baseline Incidents
        i_res = await session.execute(select(Incident))
        existing_incidents = i_res.scalars().all()
        if not existing_incidents:
            logger.info("Seeding baseline hazard incidents across India...")
            for inc_data in get_baseline_incidents():
                incident = Incident(**inc_data)
                session.add(incident)

        # 3. Seed Admin Bootstrap Account
        admin_res = await session.execute(
            select(User).where(User.email == settings.ADMIN_BOOTSTRAP_EMAIL)
        )
        existing_admin = admin_res.scalars().first()
        if not existing_admin:
            logger.info(f"Seeding admin bootstrap account: {settings.ADMIN_BOOTSTRAP_EMAIL}")
            admin_user = User(
                name="Platform Administrator",
                email=settings.ADMIN_BOOTSTRAP_EMAIL,
                password_hash=hash_password(settings.ADMIN_BOOTSTRAP_PASSWORD),
                role="admin",
                account_status="active"
            )
            session.add(admin_user)
            await session.flush()

            admin_pref = UserPreference(
                user_id=admin_user.id,
                preferred_language="en",
                preferred_travel_mode="driving",
                notification_preferences={"admin_alerts": True},
                hazard_categories=["weather", "landslide", "wildlife", "social_disruption", "road_infrastructure"]
            )
            session.add(admin_pref)

        await session.commit()
        logger.info("Database initialization and baseline seeding complete.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting TravelLord AI backend service...")
    await init_db_and_seed()
    yield
    # Shutdown
    logger.info("Shutting down TravelLord AI backend service...")
    await engine.dispose()

app = FastAPI(
    title="TravelLord AI — Backend API",
    description="Evidence-driven, multi-threat travel intelligence and risk-awareness platform for India.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# Health & Operational Checks
@app.get("/health", tags=["Operational"])
async def health_check():
    return {
        "status": "healthy",
        "service": "TravelLord AI Backend",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT
    }

@app.get("/ready", tags=["Operational"])
async def readiness_check():
    return {
        "status": "ready",
        "database": "connected",
        "routing_provider": settings.ROUTING_PROVIDER
    }

# Register API v1 Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(routes_router, prefix="/api/v1")
app.include_router(incidents_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(assistant_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(sources_router, prefix="/api/v1")
app.include_router(support_router, prefix="/api/v1")

