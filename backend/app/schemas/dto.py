from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ----------------- AUTH SCHEMAS -----------------
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str
    role: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    account_status: str
    created_at: datetime
    preferences: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    preferred_language: Optional[str] = None
    preferred_travel_mode: Optional[str] = None
    notification_preferences: Optional[Dict[str, Any]] = None
    hazard_categories: Optional[List[str]] = None
    privacy_settings: Optional[Dict[str, Any]] = None


# ----------------- ROUTE & RISK SCHEMAS -----------------
class Coordinates(BaseModel):
    lat: float
    lon: float

class GeocodeItem(BaseModel):
    display_name: str
    lat: float
    lon: float
    type: Optional[str] = None
    importance: Optional[float] = None

class RouteCalculateRequest(BaseModel):
    origin_label: str
    origin_lat: float = Field(..., ge=-90.0, le=90.0)
    origin_lon: float = Field(..., ge=-180.0, le=180.0)
    destination_label: str
    destination_lat: float = Field(..., ge=-90.0, le=90.0)
    destination_lon: float = Field(..., ge=-180.0, le=180.0)
    travel_mode: str = "driving"
    avoid_hazards: bool = True

class RouteSaveRequest(BaseModel):
    title: str
    origin_label: str
    origin_lat: float
    origin_lon: float
    destination_label: str
    destination_lat: float
    destination_lon: float
    travel_mode: str = "driving"
    geometry: Optional[List[List[float]]] = None
    distance_meters: float = 0.0
    duration_seconds: float = 0.0

class IncidentReference(BaseModel):
    id: str
    title: str
    category: str
    severity: str
    distance_meters: float
    verification_status: str
    source_name: str
    published_time: datetime

class SegmentRiskDTO(BaseModel):
    segment_index: int
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    risk_index: float # 0 to 100
    risk_level: str # 'low', 'moderate', 'high', 'critical'
    evidence_quality: str
    threats: List[IncidentReference] = []

class AlternativeRouteDTO(BaseModel):
    name: str
    distance_meters: float
    duration_seconds: float
    risk_index: float
    risk_level: str
    trade_off_explanation: str
    geometry: List[List[float]] = []

class RouteAnalysisResponse(BaseModel):
    analysis_id: str
    route_id: Optional[str] = None
    origin_label: str
    destination_label: str
    distance_meters: float
    duration_seconds: float
    overall_risk_index: float
    overall_risk_level: str
    evidence_coverage: str
    uncertainty_summary: str
    contributing_reasons: List[str]
    segments: List[SegmentRiskDTO]
    intersecting_incidents: List[IncidentReference]
    alternatives: List[AlternativeRouteDTO]
    geometry: List[List[float]] # [[lon, lat], ...]
    is_safe_claim: bool = False # explicitly False; platform never claims guaranteed safety
    disclaimer: str = "Absence of reported active alerts is not proof of safety. Stay vigilant and verify current local conditions."


# ----------------- INCIDENT SCHEMAS -----------------
class IncidentDTO(BaseModel):
    id: str
    hazard_category: str
    title: str
    description: str
    latitude: float
    longitude: float
    affected_radius_meters: float
    observed_time: datetime
    published_time: datetime
    source_name: str
    source_url: Optional[str] = None
    source_severity: str
    platform_severity: str
    verification_status: str
    status: str
    is_sample_data: bool
    evidence_quality: str
    fuzzed_coordinates: bool

    model_config = ConfigDict(from_attributes=True)

class ThreatSummaryResponse(BaseModel):
    total_active: int
    by_category: Dict[str, int]
    by_severity: Dict[str, int]
    verified_count: int
    community_count: int
    sample_data_count: int
    last_updated: datetime


# ----------------- COMMUNITY REPORT SCHEMAS -----------------
class CommunityReportCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    category: str
    description: str = Field(..., min_length=10, max_length=2000)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    location_name: Optional[str] = None
    observation_time: Optional[datetime] = None
    media_url: Optional[str] = None

class CommunityReportDTO(BaseModel):
    id: str
    incident_id: Optional[str] = None
    title: Optional[str] = None
    category: str
    description: str
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    observation_time: datetime
    media_url: Optional[str] = None
    moderation_state: str
    moderation_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    corroborations_count: int = 0
    disputes_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CorroborationRequest(BaseModel):
    notes: Optional[str] = Field(None, max_length=500)

class DisputeRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=200)
    notes: Optional[str] = Field(None, max_length=500)

class ModerationActionRequest(BaseModel):
    action: str = Field(..., description="'approve', 'corroborate', 'reject', 'resolve', 'dispute'")
    rejection_reason: Optional[str] = None
    moderation_notes: Optional[str] = None


# ----------------- AI ASSISTANT SCHEMAS -----------------
class EvidenceCitation(BaseModel):
    incident_id: str
    title: str
    category: str
    source_name: str
    timestamp: datetime
    verification: str
    relevance_reason: str

class ChatMessageItem(BaseModel):
    role: str = "user" # 'user' or 'assistant'
    content: str = Field(..., max_length=2000)

class AssistantQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1500)
    route_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    history: Optional[List[ChatMessageItem]] = None

class AssistantQueryResponse(BaseModel):
    answer: str
    evidence_citations: List[EvidenceCitation] = []
    data_freshness_status: str
    confidence_level: str
    is_synthesized_safety_guarantee: bool = False # Always False
    provider: Optional[str] = None # 'groq' or 'grounded_rag'


# ----------------- NOTIFICATION SCHEMAS -----------------
class NotificationDTO(BaseModel):
    id: str
    category: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------- SUPPORT SCHEMAS -----------------
class SupportTicketCreate(BaseModel):
    subject: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=3000)
    email: Optional[str] = None

class SupportTicketResponse(BaseModel):
    id: str
    ticket_reference: str
    subject: str
    status: str
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

