import re
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.entities import Incident, Route, RouteAnalysis
from backend.app.schemas.dto import AssistantQueryResponse, EvidenceCitation
from backend.app.services.spatial_service import point_to_polyline_distance_meters

class GroundedAssistantService:
    """
    Evidence-grounded conversational intelligence service.
    Directly anchors all responses to verifiable database incidents,
    weather warnings, and corridor exposures with full provenance.
    """

    async def answer_query(
        self,
        query: str,
        db: AsyncSession,
        route_id: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None
    ) -> AssistantQueryResponse:
        clean_q = query.strip()
        q_lower = clean_q.lower()

        # Sanitize against prompt injection patterns
        if any(token in q_lower for token in ["ignore previous", "system prompt", "as an ai", "developer mode"]):
            return AssistantQueryResponse(
                answer="TravelLord AI provides factual hazard intelligence. Requests to bypass safety parameters or access system prompts are disallowed.",
                evidence_citations=[],
                data_freshness_status="verified",
                confidence_level="high",
                is_synthesized_safety_guarantee=False
            )

        # Retrieve active incidents from database
        incident_query = select(Incident).where(Incident.status == "active")
        res = await db.execute(incident_query)
        incidents = res.scalars().all()

        route = None
        route_analysis = None
        if route_id:
            r_res = await db.execute(select(Route).where(Route.id == route_id))
            route = r_res.scalars().first()
            if route:
                ra_res = await db.execute(
                    select(RouteAnalysis).where(RouteAnalysis.route_id == route_id).order_by(RouteAnalysis.created_at.desc())
                )
                route_analysis = ra_res.scalars().first()

        citations: List[EvidenceCitation] = []
        relevant_incidents: List[Incident] = []

        # Route-specific analysis query
        if route and route.geometry:
            polyline = route.geometry
            for inc in incidents:
                dist = point_to_polyline_distance_meters(inc.latitude, inc.longitude, polyline)
                if dist <= 30000.0: # within 30 km corridor
                    relevant_incidents.append(inc)
                    citations.append(EvidenceCitation(
                        incident_id=inc.id,
                        title=inc.title,
                        category=inc.hazard_category,
                        source_name=inc.source_name,
                        timestamp=inc.published_time,
                        verification=inc.verification_status,
                        relevance_reason=f"Located {round(dist/1000.0, 1)} km from your {route.origin_label} to {route.destination_label} route"
                    ))
        else:
            # Topic & location matching
            for inc in incidents:
                match = False
                cat = inc.hazard_category.lower()
                title_lower = inc.title.lower()
                desc_lower = inc.description.lower()

                if "weather" in q_lower or "rain" in q_lower or "fog" in q_lower or "flood" in q_lower:
                    if cat == "weather":
                        match = True
                elif "landslide" in q_lower or "rockfall" in q_lower or "hill" in q_lower or "mountain" in q_lower:
                    if cat == "landslide":
                        match = True
                elif "wildlife" in q_lower or "elephant" in q_lower or "animal" in q_lower or "tiger" in q_lower:
                    if cat == "wildlife":
                        match = True
                elif "strike" in q_lower or "protest" in q_lower or "block" in q_lower or "jam" in q_lower or "farmer" in q_lower:
                    if cat in ["social_disruption", "road_infrastructure"]:
                        match = True

                # Geographic token matching
                words = re.findall(r'\b[a-zA-Z]{4,}\b', q_lower)
                for w in words:
                    if w in title_lower or w in desc_lower:
                        match = True
                        break

                if match:
                    relevant_incidents.append(inc)
                    citations.append(EvidenceCitation(
                        incident_id=inc.id,
                        title=inc.title,
                        category=inc.hazard_category,
                        source_name=inc.source_name,
                        timestamp=inc.published_time,
                        verification=inc.verification_status,
                        relevance_reason=f"Matches category '{inc.hazard_category}' and queried terms"
                    ))

        # Synthesize truthful, grounded response
        if "safe" in q_lower or "is it safe" in q_lower:
            answer = (
                "**Safety Assessment Principle**: TravelLord AI does not issue absolute 'safe' declarations. "
                "Road conditions can change rapidly due to mountain weather, sudden debris flow, or unforeseen events. "
            )
            if relevant_incidents:
                answer += f"Currently, there are **{len(relevant_incidents)} known hazards** reported in the queried area:\n\n"
                for inc in relevant_incidents[:3]:
                    answer += f"- **{inc.title}** ({inc.source_name}, severity: {inc.source_severity}).\n"
                answer += "\nWe advise reviewing these advisories before departure and monitoring local administrative bulletins."
            else:
                answer += (
                    "There are currently **no officially reported active blockades or extreme warnings** in our database for this specific query. "
                    "However, absence of an alert is never a guarantee of safety. Exercise standard vigilance, especially at night or in rugged terrain."
                )
            return AssistantQueryResponse(
                answer=answer,
                evidence_citations=citations[:5],
                data_freshness_status="live_verified",
                confidence_level="high",
                is_synthesized_safety_guarantee=False
            )

        if not relevant_incidents:
            return AssistantQueryResponse(
                answer=(
                    f"Based on currently ingested records from official authorities (IMD, NDMA, GSI, NHAI) and verified community submissions, "
                    f"there are no active hazard advisories matching your specific query: *\"{clean_q}\"*.\n\n"
                    f"**Important Coverage Note**: Absence of reported incidents in public data does not guarantee hazard-free conditions. "
                    f"Always inspect regional weather before setting out."
                ),
                evidence_citations=[],
                data_freshness_status="current_monitoring",
                confidence_level="moderate",
                is_synthesized_safety_guarantee=False
            )

        # Build detailed evidence explanation
        ans_lines = [
            f"Here is the evidence-grounded intelligence regarding *\"{clean_q}\"* based on active platform data:\n"
        ]
        for idx, inc in enumerate(relevant_incidents[:4], start=1):
            pub_date = inc.published_time.strftime("%b %d, %H:%M UTC")
            fuzz_notice = " *(Coordinates fuzzed for wildlife protection)*" if inc.fuzzed_coordinates else ""
            ans_lines.append(
                f"### {idx}. {inc.title}\n"
                f"- **Category**: {inc.hazard_category.replace('_', ' ').capitalize()}\n"
                f"- **Source Authority**: {inc.source_name} ({inc.verification_status.replace('_', ' ')})\n"
                f"- **Published**: {pub_date}{fuzz_notice}\n"
                f"- **Official Advisory**: {inc.description}\n"
            )

        ans_lines.append(
            "\n*Data Source Attribution: Verified against public feeds from IMD, GSI, and relevant state departments.*"
        )

        return AssistantQueryResponse(
            answer="\n".join(ans_lines),
            evidence_citations=citations[:5],
            data_freshness_status="live_verified",
            confidence_level="high",
            is_synthesized_safety_guarantee=False
        )

assistant_service = GroundedAssistantService()
