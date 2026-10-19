import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.core.database import get_db
from backend.app.models.entities import Route, RouteAnalysis, RouteSegment, Incident, User
from backend.app.schemas.dto import (
    RouteCalculateRequest,
    RouteSaveRequest,
    RouteAnalysisResponse,
    GeocodeItem
)
from backend.app.integrations.nominatim_adapter import nominatim_client
from backend.app.integrations.osrm_adapter import osrm_client
from backend.app.services.risk_engine import risk_engine
from backend.app.services.auth_service import get_current_user, get_current_user_optional

router = APIRouter(prefix="/routes", tags=["Routes & Hazard Analysis"])

@router.get("/geocode", response_model=List[GeocodeItem])
async def geocode_location(q: str = Query(..., min_length=2)):
    """Search for locations, towns, cities, or landmarks in India."""
    results = await nominatim_client.search(q)
    return [GeocodeItem(**item) for item in results]

@router.post("/calculate")
async def calculate_route(req: RouteCalculateRequest):
    """
    Calculate driving corridor polyline and alternatives connecting origin and destination.
    """
    route_data = await osrm_client.get_route(
        req.origin_lat, req.origin_lon,
        req.destination_lat, req.destination_lon,
        alternatives=True
    )
    return route_data

@router.post("/analyze", response_model=RouteAnalysisResponse)
async def analyze_route_hazards(
    req: RouteCalculateRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate route polyline and run multi-threat corridor risk fusion.
    Persists Route and RouteAnalysis records in database.
    """
    # 1. Fetch driving route and alternatives from OSRM / Geodesic adapter
    route_data = await osrm_client.get_route(
        req.origin_lat, req.origin_lon,
        req.destination_lat, req.destination_lon,
        alternatives=True
    )

    polyline = route_data.get("geometry", [])
    distance = route_data.get("distance_meters", 0.0)
    duration = route_data.get("duration_seconds", 0.0)
    alternatives_raw = route_data.get("alternatives", [])

    # 2. Retrieve active hazards from database
    inc_query = select(Incident).where(Incident.status == "active")
    inc_res = await db.execute(inc_query)
    all_incidents = inc_res.scalars().all()

    # 3. Execute risk intelligence analysis
    analysis_result = risk_engine.analyze_route(
        route_polyline=polyline,
        distance_meters=distance,
        duration_seconds=duration,
        origin_label=req.origin_label,
        destination_label=req.destination_label,
        all_incidents=all_incidents,
        alternative_routes_raw=alternatives_raw
    )

    # 4. Persist Route and Analysis to database
    route_record = Route(
        user_id=current_user.id if current_user else None,
        title=f"{req.origin_label.split(',')[0]} to {req.destination_label.split(',')[0]}",
        origin_label=req.origin_label,
        origin_lat=req.origin_lat,
        origin_lon=req.origin_lon,
        destination_label=req.destination_label,
        destination_lat=req.destination_lat,
        destination_lon=req.destination_lon,
        travel_mode=req.travel_mode,
        distance_meters=distance,
        duration_seconds=duration,
        geometry=polyline,
        is_saved=False
    )
    db.add(route_record)
    await db.flush()

    analysis_record = RouteAnalysis(
        route_id=route_record.id,
        user_id=current_user.id if current_user else None,
        route_provider=route_data.get("provider", "osrm"),
        overall_risk_index=analysis_result["overall_risk_index"],
        overall_risk_level=analysis_result["overall_risk_level"],
        evidence_coverage=analysis_result["evidence_coverage"],
        uncertainty_summary=analysis_result["uncertainty_summary"],
        contributing_reasons=analysis_result["contributing_reasons"],
        alternatives=[alt.model_dump(mode="json") for alt in analysis_result["alternatives"]]
    )
    db.add(analysis_record)
    await db.flush()

    # Save segments
    for seg_dto in analysis_result["segments"]:
        seg_record = RouteSegment(
            analysis_id=analysis_record.id,
            segment_index=seg_dto.segment_index,
            start_lat=seg_dto.start_lat,
            start_lon=seg_dto.start_lon,
            end_lat=seg_dto.end_lat,
            end_lon=seg_dto.end_lon,
            segment_risk_index=seg_dto.risk_index,
            segment_risk_level=seg_dto.risk_level,
            evidence_quality=seg_dto.evidence_quality,
            threat_references=[t.model_dump(mode="json") for t in seg_dto.threats]
        )
        db.add(seg_record)

    await db.commit()

    return RouteAnalysisResponse(
        analysis_id=analysis_record.id,
        route_id=route_record.id,
        origin_label=req.origin_label,
        destination_label=req.destination_label,
        distance_meters=distance,
        duration_seconds=duration,
        overall_risk_index=analysis_result["overall_risk_index"],
        overall_risk_level=analysis_result["overall_risk_level"],
        evidence_coverage=analysis_result["evidence_coverage"],
        uncertainty_summary=analysis_result["uncertainty_summary"],
        contributing_reasons=analysis_result["contributing_reasons"],
        segments=analysis_result["segments"],
        intersecting_incidents=analysis_result["intersecting_incidents"],
        alternatives=analysis_result["alternatives"],
        geometry=polyline,
        is_safe_claim=False
    )

@router.get("")
async def list_user_saved_routes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve saved routes belonging to the authenticated user."""
    res = await db.execute(
        select(Route)
        .where(Route.user_id == current_user.id)
        .order_by(Route.created_at.desc())
    )
    routes = res.scalars().all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "origin_label": r.origin_label,
            "destination_label": r.destination_label,
            "distance_meters": r.distance_meters,
            "duration_seconds": r.duration_seconds,
            "is_saved": r.is_saved,
            "created_at": r.created_at
        }
        for r in routes
    ]

@router.post("")
async def save_route(
    req: RouteSaveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save a route to the user's travel dashboard."""
    new_route = Route(
        user_id=current_user.id,
        title=req.title,
        origin_label=req.origin_label,
        origin_lat=req.origin_lat,
        origin_lon=req.origin_lon,
        destination_label=req.destination_label,
        destination_lat=req.destination_lat,
        destination_lon=req.destination_lon,
        travel_mode=req.travel_mode,
        distance_meters=req.distance_meters,
        duration_seconds=req.duration_seconds,
        geometry=req.geometry,
        is_saved=True
    )
    db.add(new_route)
    await db.commit()
    await db.refresh(new_route)
    return {"id": new_route.id, "title": new_route.title, "message": "Route saved successfully."}

@router.get("/{id}")
async def get_route_details(
    id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """Fetch route and its associated risk analyses."""
    res = await db.execute(
        select(Route)
        .options(selectinload(Route.analyses))
        .where(Route.id == id)
    )
    route = res.scalars().first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    # If route has a private owner, ensure authorization
    if route.user_id and (not current_user or current_user.id != route.user_id):
        raise HTTPException(status_code=403, detail="Unauthorized access to saved route")

    analyses_data = [
        {
            "id": a.id,
            "overall_risk_index": a.overall_risk_index,
            "overall_risk_level": a.overall_risk_level,
            "evidence_coverage": a.evidence_coverage,
            "uncertainty_summary": a.uncertainty_summary,
            "contributing_reasons": a.contributing_reasons,
            "created_at": a.created_at
        }
        for a in route.analyses
    ]

    return {
        "id": route.id,
        "title": route.title,
        "origin_label": route.origin_label,
        "origin_lat": route.origin_lat,
        "origin_lon": route.origin_lon,
        "destination_label": route.destination_label,
        "destination_lat": route.destination_lat,
        "destination_lon": route.destination_lon,
        "distance_meters": route.distance_meters,
        "duration_seconds": route.duration_seconds,
        "geometry": route.geometry,
        "analyses": analyses_data
    }

@router.delete("/{id}")
async def delete_saved_route(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a user's saved route."""
    res = await db.execute(select(Route).where(Route.id == id, Route.user_id == current_user.id))
    route = res.scalars().first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found or unauthorized")
    await db.delete(route)
    await db.commit()
    return {"message": "Route deleted successfully"}
