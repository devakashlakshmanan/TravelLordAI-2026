import re
import datetime
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from backend.app.core.config import settings
from backend.app.models.entities import Incident, Route, RouteAnalysis, CommunityReport
from backend.app.schemas.dto import AssistantQueryResponse, EvidenceCitation, ChatMessageItem
from backend.app.services.spatial_service import point_to_polyline_distance_meters

logger = logging.getLogger("travellord.assistant")

# Knowledge Base: Pan-India Destinations & Corridors
KNOWLEDGE_DESTINATIONS = [
    {
        "name": "Leh-Ladakh",
        "state": "Ladakh",
        "highways": "NH-3 (Leh-Manali) & NH-1 (Srinagar-Leh)",
        "passes": "Khardung La (17,982 ft), Chang La, Tanglang La",
        "season": "May to September (Highway passes open)",
        "permits": "Mandatory LAHDC e-Permit for Nubra, Pangong, Tso Moriri. Acclimatize 48 hrs in Leh."
    },
    {
        "name": "Manali & Spiti Valley",
        "state": "Himachal Pradesh",
        "highways": "NH-21 (Kiratpur-Manali) & Atal Tunnel corridor",
        "passes": "Rohtang Pass (requires NGT daily permit), Kunzum Pass",
        "season": "April to June & October to February",
        "hazards": "Monsoon flash floods in Beas River basin, winter snowfall closures at South Portal."
    },
    {
        "name": "Munnar & Western Ghats",
        "state": "Kerala",
        "highways": "NH-85 (Kochi-Madurai GAP Road)",
        "season": "September to March",
        "hazards": "Narrow winding ghats prone to dense fog and monsoon landslides along Gap Road."
    },
    {
        "name": "Bandipur Tiger Reserve & Western Ghats Corridor",
        "state": "Karnataka / Kerala / Tamil Nadu",
        "highways": "NH-766 (Gundlupet to Sultan Bathery) & NH-67",
        "curfew": "Strict night traffic ban daily from 9:00 PM to 6:00 AM. Detour via Kutta-Gonikoppal-Mananthavady.",
        "speed_limit": "30-40 km/h with active speed camera traps."
    },
    {
        "name": "Kaziranga National Park Corridor",
        "state": "Assam",
        "highways": "NH-715 (old NH-37)",
        "hazards": "Brahmaputra monsoon flood animal crossings; automated sensor speed traps enforce 40 km/h limit."
    },
    {
        "name": "Nilgiris (Ooty & Coonoor)",
        "state": "Tamil Nadu",
        "highways": "NH-181 (Gudalur / Mettupalayam ghat roads)",
        "permits": "Mandatory Nilgiris e-Pass (epass.tnega.org). Complete plastic ban."
    },
    {
        "name": "Arunachal Pradesh Corridor",
        "state": "Arunachal Pradesh",
        "highways": "NH-13 (Trans-Arunachal Highway)",
        "permits": "Mandatory Inner Line Permit (ILP) for domestic citizens via arunachalilp.gov.in."
    }
]

# Knowledge Base: Emergency Directory
EMERGENCY_HELPLINES = [
    {"name": "National Unified Emergency Helpline", "number": "112", "scope": "Police, Fire, Ambulance & Disaster Pan-India"},
    {"name": "National Highways Authority of India (NHAI)", "number": "1033", "scope": "Highway breakdown, ambulance & crane on all National Highways"},
    {"name": "Medical / Ambulance Services", "number": "108", "scope": "Emergency medical transport & trauma management"},
    {"name": "State Disaster Management Control Room", "number": "1070", "scope": "State disaster response, flood & landslide warnings"},
    {"name": "National Disaster Response Force (NDRF)", "number": "1078", "scope": "National disaster rescue coordination"},
    {"name": "Ministry of Tourism Tourist Helpline", "number": "1363", "scope": "24x7 multi-lingual tourist assistance in 12 languages"}
]

# Knowledge Base: Hazard Precautions
HAZARD_PRECAUTIONS = {
    "floods": "Never ford through moving water (>30 cm can float an SUV). Climb to uphill terraced ground if caught in mountain river surges.",
    "landslides": "Avoid mountain ghats during continuous night downpours. Watch for trickling pebbles or leaning trees. Check BRO / Traffic Police updates.",
    "fog": "Use dipped low-beam headlights and yellow fog lamps. Strictly DO NOT use hazard flashers while moving. Maintain speed <40 km/h on expressways.",
    "wildlife": "Maintain 50m distance from elephant herds. Switch off high beams. Never honk horns or step out of the vehicle in sanctuary zones.",
    "heatwave": "Check cold tyre pressures in the morning; do not deflate hot tyres during afternoon highway driving. Carry 5L water per occupant."
}


class GroundedAssistantService:
    """
    Evidence-grounded conversational intelligence service with Groq API integration.
    Synthesizes authentic answers using live database incidents, community reports,
    curated regulatory guidelines, and official Indian emergency resources.
    """

    def __init__(self):
        self._groq_client = None

    def _get_groq_client(self):
        """Lazy initialization of Groq async client using server-side environment credentials."""
        api_key = settings.GROQ_API_KEY.strip() if settings.GROQ_API_KEY else ""
        if not api_key:
            return None
        if self._groq_client is None:
            try:
                from groq import AsyncGroq
                self._groq_client = AsyncGroq(api_key=api_key)
            except Exception as e:
                logger.warning(f"Could not initialize AsyncGroq client: {e}")
                return None
        return self._groq_client

    async def answer_query(
        self,
        query: str,
        db: AsyncSession,
        current_user: Optional[Any] = None,
        route_id: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        history: Optional[List[ChatMessageItem]] = None
    ) -> AssistantQueryResponse:
        clean_q = query.strip()
        q_lower = clean_q.lower()

        # 1. Sanitize against prompt injection patterns
        if any(token in q_lower for token in ["ignore previous", "system prompt", "as an ai", "developer mode", "jailbreak"]):
            return AssistantQueryResponse(
                answer="TravelLord AI is an evidence-grounded travel risk intelligence assistant. Requests to bypass safety boundaries or access system instructions are disallowed and not permitted.",
                evidence_citations=[],
                data_freshness_status="verified",
                confidence_level="high",
                is_synthesized_safety_guarantee=False,
                provider="grounded_rag"
            )

        # 2. Retrieve active incidents from database
        incident_query = select(Incident).where(Incident.status == "active")
        res = await db.execute(incident_query)
        incidents = res.scalars().all()

        # 3. Retrieve active community reports
        cr_query = select(CommunityReport).where(
            CommunityReport.moderation_state.in_(["unverified", "corroborated", "officially_confirmed"])
        ).order_by(CommunityReport.created_at.desc()).limit(20)
        cr_res = await db.execute(cr_query)
        community_reports = cr_res.scalars().all()

        # 4. Handle route-specific corridor extraction if route_id provided
        route = None
        if route_id:
            r_res = await db.execute(select(Route).where(Route.id == route_id))
            route = r_res.scalars().first()
            if route and route.user_id and current_user:
                if route.user_id != getattr(current_user, 'id', None) and getattr(current_user, 'role', None) != 'admin':
                    route = None

        citations: List[EvidenceCitation] = []
        relevant_incidents: List[Incident] = []
        relevant_community_reports: List[CommunityReport] = []

        if route and route.geometry:
            polyline = route.geometry
            for inc in incidents:
                dist = point_to_polyline_distance_meters(inc.latitude, inc.longitude, polyline)
                if dist <= 35000.0: # within 35 km corridor
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
            for rep in community_reports:
                dist = point_to_polyline_distance_meters(rep.latitude, rep.longitude, polyline)
                if dist <= 25000.0:
                    relevant_community_reports.append(rep)
        else:
            # Semantic & geographic keyword matching across Indian corridors
            tokens = re.findall(r'\b[a-zA-Z]{3,}\b', q_lower)
            for inc in incidents:
                match = False
                cat = inc.hazard_category.lower()
                title_lower = inc.title.lower()
                desc_lower = inc.description.lower()
                src_lower = inc.source_name.lower()

                # Category tokens
                if any(k in q_lower for k in ["weather", "rain", "fog", "flood", "cyclone", "cloudburst"]) and cat == "weather":
                    match = True
                elif any(k in q_lower for k in ["landslide", "rockfall", "ghat", "mountain", "slope", "hill"]) and cat == "landslide":
                    match = True
                elif any(k in q_lower for k in ["wildlife", "elephant", "tiger", "animal", "corridor", "sanctuary"]) and cat == "wildlife":
                    match = True
                elif any(k in q_lower for k in ["closure", "road", "block", "protest", "jam", "diversion", "construction", "toll", "traffic"]) and cat in ["road_infrastructure", "social_disruption"]:
                    match = True

                # Geographic tokens
                for t in tokens:
                    if t in title_lower or t in desc_lower or t in src_lower:
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
                        relevance_reason=f"Direct match for category '{inc.hazard_category}' or geographic keywords in query"
                    ))

            # Community report matching
            for rep in community_reports:
                rep_text = f"{rep.title or ''} {rep.description} {rep.location_name or ''}".lower()
                if any(t in rep_text for t in tokens) or rep.category in q_lower:
                    relevant_community_reports.append(rep)

        # 5. Extract relevant curated travelwise & emergency context
        matched_destinations = [
            d for d in KNOWLEDGE_DESTINATIONS
            if d["name"].lower() in q_lower or d["state"].lower() in q_lower or any(h.lower() in q_lower for h in d.get("highways", "").split())
        ]
        matched_precautions = [
            f"**{k.title()} Safety**: {v}"
            for k, v in HAZARD_PRECAUTIONS.items()
            if k in q_lower
        ]

        # 6. Attempt Groq LLM Generation if configured
        groq_client = self._get_groq_client()
        if groq_client and settings.LLM_PROVIDER.lower() == "groq":
            try:
                groq_answer = await self._call_groq_llm(
                    client=groq_client,
                    query=clean_q,
                    route=route,
                    incidents=relevant_incidents[:6],
                    community_reports=relevant_community_reports[:4],
                    destinations=matched_destinations,
                    precautions=matched_precautions,
                    history=history
                )
                if groq_answer:
                    return AssistantQueryResponse(
                        answer=groq_answer,
                        evidence_citations=citations[:5],
                        data_freshness_status="live_verified",
                        confidence_level="high",
                        is_synthesized_safety_guarantee=False,
                        provider="groq"
                    )
            except Exception as e:
                logger.warning(f"Groq API call encountered an error: {e}. Falling back to deterministic RAG template.")

        # 7. Deterministic Evidence-Grounded Fallback Template
        fallback_answer = self._generate_grounded_fallback(
            clean_q=clean_q,
            q_lower=q_lower,
            route=route,
            relevant_incidents=relevant_incidents,
            community_reports=relevant_community_reports,
            matched_destinations=matched_destinations
        )

        return AssistantQueryResponse(
            answer=fallback_answer,
            evidence_citations=citations[:5],
            data_freshness_status="live_verified",
            confidence_level="high",
            is_synthesized_safety_guarantee=False,
            provider="grounded_rag"
        )

    async def _call_groq_llm(
        self,
        client: Any,
        query: str,
        route: Optional[Route],
        incidents: List[Incident],
        community_reports: List[CommunityReport],
        destinations: List[Dict[str, Any]],
        precautions: List[str],
        history: Optional[List[ChatMessageItem]]
    ) -> Optional[str]:
        """Format grounded prompt and execute chat completion via official Groq client."""
        # Build structured grounding context
        context_parts = []

        if route:
            context_parts.append(
                f"### Active Journey Corridor:\n"
                f"- Origin: {route.origin_label}\n"
                f"- Destination: {route.destination_label}\n"
                f"- Highway Distance: {round(route.distance_meters / 1000.0, 1)} km\n"
            )

        if incidents:
            context_parts.append("### Active Official Database Incidents & Advisories:")
            for inc in incidents:
                ts = inc.published_time.strftime("%b %d, %Y %H:%M UTC")
                context_parts.append(
                    f"- **{inc.title}**\n"
                    f"  Category: {inc.hazard_category} | Severity: {inc.source_severity} ({inc.platform_severity})\n"
                    f"  Source: {inc.source_name} | Verification: {inc.verification_status} | Timestamp: {ts}\n"
                    f"  Details: {inc.description}\n"
                )
        else:
            context_parts.append("### Active Official Database Incidents:\nNone recorded for the specific queried corridor in active platform data.")

        if community_reports:
            context_parts.append("### Recent Citizen Community Observations:")
            for rep in community_reports:
                ts = rep.created_at.strftime("%b %d, %H:%M UTC")
                state_label = "Corroborated by Observers" if rep.moderation_state == "corroborated" else "Unverified Citizen Witness"
                context_parts.append(
                    f"- {rep.title or 'Observation'}: {rep.description}\n"
                    f"  Location: {rep.location_name or 'Marked point'} | State: {state_label} | Reported: {ts}\n"
                )

        if destinations:
            context_parts.append("### Destination & Regulatory Information:")
            for d in destinations:
                context_parts.append(f"- **{d['name']} ({d['state']})**: Highway access: {d.get('highways', 'N/A')}. Notes: {d.get('permits', '')} {d.get('curfew', '')}")

        if precautions:
            context_parts.append("### Standard Precautionary Protocols:")
            for p in precautions:
                context_parts.append(f"- {p}")

        context_parts.append("### Statutory Pan-India Helplines:")
        context_parts.append("- NHAI Highway Emergency & Breakdown: **1033**")
        context_parts.append("- Unified National Emergency (Police/Fire/Medical): **112**")
        context_parts.append("- Emergency Ambulance: **108** | Disaster Control: **1070**")

        grounding_context = "\n\n".join(context_parts)

        system_prompt = (
            "You are the TravelLord AI Assistant, an authoritative, factual, and evidence-grounded travel risk intelligence assistant for India.\n\n"
            "MANDATORY OPERATIONAL INSTRUCTIONS:\n"
            "1. Ground all answers strictly in the provided TravelLord database context and verified Indian travel knowledge.\n"
            "2. NEVER declare any road, highway, or trip '100% safe' or 'guaranteed safe'. Explicitly maintain the TravelLord principle: absence of reported incidents in public feeds is NOT a guarantee of safety.\n"
            "3. NEVER invent fictitious accidents, road closures, or imaginary advisories. If information is unavailable in the context, explicitly state that no active alerts are documented in the system.\n"
            "4. Clearly distinguish between Official Statutory Bulletins (Tier 1: IMD, CWC, NHAI, State Police) and Citizen Community Observations (Tier 2/unverified). Never present unverified citizen claims as official government orders.\n"
            "5. Cite issuing source authorities (e.g. IMD, NHAI, CWC) and timestamps when referencing incidents.\n"
            "6. When users ask about highway emergencies or breakdown assistance, always highlight 1033 (NHAI) and 112.\n"
            "7. Keep your tone informative, concise, respectful, and well-structured with markdown headings and bullet points."
        )

        user_content = (
            f"VERIFIED CONTEXT FROM TRAVELLORD PLATFORM:\n"
            f"----------------------------------------\n"
            f"{grounding_context}\n"
            f"----------------------------------------\n\n"
            f"USER QUERY: {query}\n\n"
            f"Please respond thoroughly and responsibly based on the verified context above."
        )

        # Assemble messages including recent conversation history
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for item in history[-6:]: # Include up to last 6 conversational turns
                role = "assistant" if item.role == "assistant" else "user"
                messages.append({"role": role, "content": item.content[:1000]})
        messages.append({"role": "user", "content": user_content})

        model_name = settings.GROQ_MODEL.strip() if settings.GROQ_MODEL else "openai/gpt-oss-120b"

        completion = await client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.2, # Low temperature ensures factual adherence
            max_tokens=1024
        )

        if completion.choices and completion.choices[0].message:
            return completion.choices[0].message.content
        return None

    def _generate_grounded_fallback(
        self,
        clean_q: str,
        q_lower: str,
        route: Optional[Route],
        relevant_incidents: List[Incident],
        community_reports: List[CommunityReport],
        matched_destinations: List[Dict[str, Any]]
    ) -> str:
        """Deterministic evidence-grounded template when LLM provider is inactive or offline."""
        if "safe" in q_lower or "is it safe" in q_lower:
            answer = (
                "**TravelLord Safety Assessment Principle**:\n"
                "TravelLord AI does not issue absolute 'safe' declarations. Road conditions across India can evolve rapidly due to mountain weather, localized blockades, or unforeseen events.\n\n"
            )
            if relevant_incidents:
                answer += f"Currently, our database records **{len(relevant_incidents)} documented hazard(s)** in the queried corridor:\n\n"
                for inc in relevant_incidents[:3]:
                    answer += f"- **{inc.title}** ({inc.source_name}, severity: {inc.source_severity})\n"
                answer += "\nWe advise reviewing these advisories before departure and checking local highway helplines (**1033** for National Highways)."
            else:
                answer += (
                    "There are currently **no officially reported active blockades or extreme warnings** in our database matching this query. "
                    "However, absence of an alert is not a guarantee of safety. Exercise standard situational awareness, especially on rural or night stretches."
                )
            return answer

        if not relevant_incidents and not community_reports and not matched_destinations:
            return (
                f"Based on currently ingested records from official authorities (IMD, NDMA, GSI, NHAI) and verified community submissions, "
                f"there are no active hazard advisories matching your specific query: *\"{clean_q}\"*.\n\n"
                f"**Important Operational Note**: Absence of reported incidents in public data does not guarantee hazard-free conditions. "
                f"For roadside breakdown assistance on National Highways, dial **1033**. For emergency dispatch pan-India, dial **112**."
            )

        ans_lines = [
            f"### Evidence-Grounded Travel Briefing: *\"{clean_q}\"*\n"
        ]

        if relevant_incidents:
            ans_lines.append("**Documented Official Advisories:**\n")
            for idx, inc in enumerate(relevant_incidents[:4], start=1):
                pub_date = inc.published_time.strftime("%b %d, %H:%M UTC")
                fuzz_notice = " *(Coordinates fuzzed for wildlife protection)*" if inc.fuzzed_coordinates else ""
                ans_lines.append(
                    f"{idx}. **{inc.title}**\n"
                    f"   - **Authority**: {inc.source_name} ({inc.verification_status.replace('_', ' ')})\n"
                    f"   - **Published**: {pub_date}{fuzz_notice}\n"
                    f"   - **Details**: {inc.description}\n"
                )

        if community_reports:
            ans_lines.append("\n**Recent Citizen Community Observations:**\n")
            for rep in community_reports[:2]:
                ans_lines.append(
                    f"- **{rep.title or rep.category.title()}**: {rep.description} "
                    f"*(Observed near {rep.location_name or 'corridor'}, status: {rep.moderation_state})*\n"
                )

        if matched_destinations:
            ans_lines.append("\n**Corridor & Regulatory Notes:**\n")
            for d in matched_destinations:
                ans_lines.append(f"- **{d['name']}**: {d.get('highways', '')}. {d.get('permits', '')} {d.get('curfew', '')}\n")

        ans_lines.append(
            "\n*Attribution: Data ingested from IMD, CWC, NHAI, GSI and corroborated citizen observers. "
            "In emergencies, dial **1033** (NHAI) or **112** (Pan-India).*"
        )

        return "".join(ans_lines)


assistant_service = GroundedAssistantService()
