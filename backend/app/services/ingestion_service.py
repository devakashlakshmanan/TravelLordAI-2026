import logging
import datetime
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from backend.app.models.entities import Source, Incident
from backend.app.integrations.imd_adapter import imd_adapter
from backend.app.integrations.gsi_adapter import gsi_adapter
from backend.app.integrations.cwc_adapter import cwc_adapter
from backend.app.integrations.wildlife_adapter import wildlife_adapter
from backend.app.integrations.traffic_police_adapter import traffic_police_adapter

logger = logging.getLogger(__name__)

class IngestionPipeline:
    """
    National Ingestion Pipeline for TravelLord AI.
    Coordinates polling, validation, geographic normalization, and transactional
    storage across official Indian data providers (IMD, GSI, CWC, Forest Dept, NHAI).
    """

    async def run_full_sync(self, db: AsyncSession) -> Dict[str, Any]:
        """
        Executes a synchronization cycle across all configured provider adapters.
        Deduplicates records, flags expired hazards, and updates source health telemetry.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        sync_stats = {
            "retrieved_total": 0,
            "inserted_new": 0,
            "updated_existing": 0,
            "expired_deactivated": 0,
            "sources_updated": 0,
            "errors": []
        }

        # 1. Gather incidents from all provider adapters
        all_incoming: List[Dict[str, Any]] = []

        try:
            imd_warnings = await imd_adapter.fetch_district_warnings()
            all_incoming.extend(imd_warnings)
            await self._update_source_health(db, "India Meteorological Department (IMD)", imd_adapter.health_status)
            sync_stats["sources_updated"] += 1
        except Exception as e:
            sync_stats["errors"].append(f"IMD Ingestion error: {str(e)}")

        try:
            gsi_hazards = gsi_adapter.fetch_geological_hazards()
            all_incoming.extend(gsi_hazards)
            await self._update_source_health(db, "Geological Survey of India (GSI)", gsi_adapter.health_status)
            sync_stats["sources_updated"] += 1
        except Exception as e:
            sync_stats["errors"].append(f"GSI Ingestion error: {str(e)}")

        try:
            cwc_floods = cwc_adapter.fetch_flood_advisories()
            all_incoming.extend(cwc_floods)
            await self._update_source_health(db, "Central Water Commission (CWC Flood Forecasting)", cwc_adapter.health_status)
            sync_stats["sources_updated"] += 1
        except Exception as e:
            sync_stats["errors"].append(f"CWC Ingestion error: {str(e)}")

        try:
            wildlife_zones = wildlife_adapter.fetch_wildlife_corridors()
            all_incoming.extend(wildlife_zones)
            await self._update_source_health(db, "State Forest Departments Wildlife Advisories", wildlife_adapter.health_status)
            sync_stats["sources_updated"] += 1
        except Exception as e:
            sync_stats["errors"].append(f"Wildlife Ingestion error: {str(e)}")

        try:
            traffic_disruptions = traffic_police_adapter.fetch_traffic_disruptions()
            all_incoming.extend(traffic_disruptions)
            await self._update_source_health(db, "Highway & Traffic Police Public Alerts", traffic_police_adapter.health_status)
            sync_stats["sources_updated"] += 1
        except Exception as e:
            sync_stats["errors"].append(f"Traffic Ingestion error: {str(e)}")

        sync_stats["retrieved_total"] = len(all_incoming)

        # 2. Match with existing active incidents in database
        existing_res = await db.execute(select(Incident).where(Incident.status == "active"))
        existing_incidents = existing_res.scalars().all()
        existing_map = {inc.title.strip().lower(): inc for inc in existing_incidents}

        for item in all_incoming:
            title_key = item["title"].strip().lower()
            if title_key in existing_map:
                # Update existing record
                existing_inc = existing_map[title_key]
                existing_inc.observed_time = item["observed_time"]
                existing_inc.published_time = item["published_time"]
                existing_inc.expiry_time = item["expiry_time"]
                existing_inc.description = item["description"]
                existing_inc.platform_severity = item["platform_severity"]
                sync_stats["updated_existing"] += 1
            else:
                # Insert new incident
                # Remove extra metadata keys not on Incident model before instantiating
                incident_kwargs = {k: v for k, v in item.items() if hasattr(Incident, k)}
                new_incident = Incident(**incident_kwargs)
                db.add(new_incident)
                sync_stats["inserted_new"] += 1

        # 3. Clean up expired active incidents
        now_naive = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        for inc in existing_incidents:
            exp = inc.expiry_time
            if exp:
                if exp.tzinfo is not None:
                    exp = exp.astimezone(datetime.timezone.utc).replace(tzinfo=None)
                if exp < now_naive:
                    inc.status = "resolved"
                    sync_stats["expired_deactivated"] += 1

        await db.commit()
        logger.info(f"National Ingestion Sync complete: {sync_stats}")
        return sync_stats

    async def _update_source_health(self, db: AsyncSession, source_name_substring: str, health_status: str):
        now = datetime.datetime.now(datetime.timezone.utc)
        stmt = (
            update(Source)
            .where(Source.name.ilike(f"%{source_name_substring[:12]}%"))
            .values(
                health_status=health_status,
                last_successful_retrieval=now,
                last_observed_update=now
            )
        )
        await db.execute(stmt)

ingestion_pipeline = IngestionPipeline()
