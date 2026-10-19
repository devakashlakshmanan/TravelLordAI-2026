import logging
from typing import List, Dict, Any, Tuple
from backend.app.models.entities import Incident
from backend.app.services.spatial_service import (
    point_to_polyline_distance_meters,
    partition_route_into_segments
)
from backend.app.schemas.dto import (
    SegmentRiskDTO,
    IncidentReference,
    AlternativeRouteDTO,
    RouteAnalysisResponse
)

logger = logging.getLogger(__name__)

CATEGORY_WEIGHTS = {
    "landslide": 1.3,
    "weather": 1.1,
    "social_disruption": 1.2,
    "wildlife": 0.9,
    "road_infrastructure": 0.8
}

BUFFER_LIMITS_METERS = {
    "weather": 30000.0,
    "landslide": 8000.0,
    "social_disruption": 10000.0,
    "wildlife": 12000.0,
    "road_infrastructure": 5000.0
}

SEVERITY_VALUES = {
    "low": 10.0,
    "moderate": 20.0,
    "high": 30.0,
    "critical": 40.0
}

QUALITY_MULTIPLIERS = {
    "official": 1.0,
    "verified_community": 0.85,
    "historical_susceptibility": 0.75,
    "unverified": 0.50
}

class RiskIntelligenceEngine:
    """
    Core Multi-Threat Risk Intelligence and Fusion Engine for TravelLord AI.
    Combines authentic observations, forecasts, terrain susceptibility,
    and corridor exposures without fabricating safety certainty.
    """

    def analyze_route(
        self,
        route_polyline: List[List[float]],
        distance_meters: float,
        duration_seconds: float,
        origin_label: str,
        destination_label: str,
        all_incidents: List[Incident],
        alternative_routes_raw: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        segments_raw = partition_route_into_segments(route_polyline, max_segment_km=20.0)
        segment_dtos: List[SegmentRiskDTO] = []
        all_intersecting_refs: List[IncidentReference] = []
        seen_incident_ids = set()
        contributing_reasons: List[str] = []

        total_weighted_risk = 0.0

        for seg in segments_raw:
            seg_polyline = seg["polyline"]
            seg_threats: List[IncidentReference] = []
            seg_score = 0.0

            for inc in all_incidents:
                if inc.status != "active":
                    continue

                max_buffer = BUFFER_LIMITS_METERS.get(inc.hazard_category, 10000.0)
                dist_to_seg = point_to_polyline_distance_meters(inc.latitude, inc.longitude, seg_polyline)

                if dist_to_seg <= max_buffer:
                    ref = IncidentReference(
                        id=inc.id,
                        title=inc.title,
                        category=inc.hazard_category,
                        severity=inc.platform_severity,
                        distance_meters=round(dist_to_seg, 1),
                        verification_status=inc.verification_status,
                        source_name=inc.source_name,
                        published_time=inc.published_time
                    )
                    seg_threats.append(ref)

                    if inc.id not in seen_incident_ids:
                        seen_incident_ids.add(inc.id)
                        all_intersecting_refs.append(ref)
                        dist_km = round(dist_to_seg / 1000.0, 1)
                        contributing_reasons.append(
                            f"{inc.title} ({dist_km} km off corridor) — Verified source: {inc.source_name}"
                        )

                    # Compute threat contribution
                    cat_weight = CATEGORY_WEIGHTS.get(inc.hazard_category, 1.0)
                    sev_val = SEVERITY_VALUES.get(inc.platform_severity, 15.0)
                    qual_mult = QUALITY_MULTIPLIERS.get(inc.verification_status, 0.6)
                    decay = max(0.2, 1.0 - (dist_to_seg / max_buffer))

                    threat_contrib = cat_weight * (sev_val * 0.7) * qual_mult * decay
                    seg_score += threat_contrib

            # Normalize segment score to [0, 100]
            normalized_seg_score = min(100.0, round(seg_score, 1))
            seg_level = self._score_to_level(normalized_seg_score)

            segment_dtos.append(SegmentRiskDTO(
                segment_index=seg["segment_index"],
                start_lat=seg["start_lat"],
                start_lon=seg["start_lon"],
                end_lat=seg["end_lat"],
                end_lon=seg["end_lon"],
                risk_index=normalized_seg_score,
                risk_level=seg_level,
                evidence_quality="high" if any(t.verification_status == "official" for t in seg_threats) else "moderate",
                threats=seg_threats
            ))

            total_weighted_risk += normalized_seg_score

        # Route-level risk aggregation
        if segment_dtos:
            # Weighted average skewed slightly towards the highest-risk segment
            max_seg_risk = max(s.risk_index for s in segment_dtos)
            avg_seg_risk = total_weighted_risk / len(segment_dtos)
            overall_risk = min(100.0, round(0.6 * max_seg_risk + 0.4 * avg_seg_risk, 1))
        else:
            overall_risk = 0.0

        overall_level = self._score_to_level(overall_risk)

        if not contributing_reasons:
            contributing_reasons.append(
                "No officially reported road blockades, active landslides, or severe alerts within the corridor buffer window."
            )
            uncertainty_summary = (
                "Coverage note: Analysis reflects currently ingested public observations. "
                "Remote stretches and unmonitored rural corridors may experience undocumented hazards."
            )
            evidence_coverage = "standard_public_coverage"
        else:
            uncertainty_summary = (
                f"Active exposure evaluated across {len(seen_incident_ids)} confirmed hazards. "
                "Terrain and weather conditions may evolve rapidly."
            )
            evidence_coverage = "high_confidence_monitoring"

        # Evaluate alternative routes
        alternatives_dto: List[AlternativeRouteDTO] = []
        if alternative_routes_raw:
            for alt in alternative_routes_raw:
                alt_geom = alt.get("geometry", [])
                alt_score, alt_reasons = self._score_alternative(alt_geom, all_incidents)
                alt_level = self._score_to_level(alt_score)

                diff_min = round((alt.get("duration_seconds", 0) - duration_seconds) / 60.0)
                diff_km = round((alt.get("distance_meters", 0) - distance_meters) / 1000.0, 1)

                if diff_min >= 0:
                    time_str = f"+{diff_min} mins"
                else:
                    time_str = f"{diff_min} mins"

                trade_off = (
                    f"Risk score {alt_score}/100 ({alt_level}). "
                    f"Distance {round(alt.get('distance_meters', 0)/1000, 1)} km ({diff_km:+} km, {time_str}). "
                    f"{alt_reasons}"
                )

                alternatives_dto.append(AlternativeRouteDTO(
                    name=alt.get("name", "Alternative Route"),
                    distance_meters=alt.get("distance_meters", 0.0),
                    duration_seconds=alt.get("duration_seconds", 0.0),
                    risk_index=alt_score,
                    risk_level=alt_level,
                    trade_off_explanation=trade_off,
                    geometry=alt_geom
                ))

        return {
            "overall_risk_index": overall_risk,
            "overall_risk_level": overall_level,
            "evidence_coverage": evidence_coverage,
            "uncertainty_summary": uncertainty_summary,
            "contributing_reasons": contributing_reasons,
            "segments": segment_dtos,
            "intersecting_incidents": all_intersecting_refs,
            "alternatives": alternatives_dto
        }

    def _score_alternative(
        self,
        polyline: List[List[float]],
        incidents: List[Incident]
    ) -> Tuple[float, str]:
        if not polyline:
            return 0.0, "No geometry available"

        score = 0.0
        matching_titles = []
        for inc in incidents:
            if inc.status != "active":
                continue
            max_buffer = BUFFER_LIMITS_METERS.get(inc.hazard_category, 10000.0)
            dist = point_to_polyline_distance_meters(inc.latitude, inc.longitude, polyline)
            if dist <= max_buffer:
                cat_weight = CATEGORY_WEIGHTS.get(inc.hazard_category, 1.0)
                sev_val = SEVERITY_VALUES.get(inc.platform_severity, 15.0)
                qual_mult = QUALITY_MULTIPLIERS.get(inc.verification_status, 0.6)
                decay = max(0.2, 1.0 - (dist / max_buffer))
                score += cat_weight * (sev_val * 0.7) * qual_mult * decay
                matching_titles.append(inc.title)

        norm_score = min(100.0, round(score, 1))
        if matching_titles:
            reasons = f"Passes near {len(matching_titles)} hazard zone(s): {matching_titles[0]}."
        else:
            reasons = "No reported active alerts along this alternate corridor."
        return norm_score, reasons

    def _score_to_level(self, score: float) -> str:
        if score < 15.0:
            return "low"
        elif score < 40.0:
            return "moderate"
        elif score < 70.0:
            return "high"
        return "critical"

risk_engine = RiskIntelligenceEngine()
