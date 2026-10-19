import uuid
import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False) # 'user' or 'admin'
    account_status = Column(String(20), default="active", nullable=False) # 'active', 'suspended'
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    routes = relationship("Route", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("CommunityReport", back_populates="reporter", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    preferred_language = Column(String(10), default="en", nullable=False)
    preferred_travel_mode = Column(String(20), default="driving", nullable=False)
    notification_preferences = Column(JSON, default=dict)
    hazard_categories = Column(JSON, default=list) # preferred categories to be alerted for
    privacy_settings = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="preferences")


class Route(Base):
    __tablename__ = "routes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(200), nullable=False)
    origin_label = Column(String(255), nullable=False)
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    destination_label = Column(String(255), nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lon = Column(Float, nullable=False)
    travel_mode = Column(String(20), default="driving", nullable=False)
    departure_time = Column(DateTime(timezone=True), nullable=True)
    distance_meters = Column(Float, default=0.0)
    duration_seconds = Column(Float, default=0.0)
    geometry = Column(JSON, nullable=True) # GeoJSON LineString coordinates [[lon, lat], ...]
    is_saved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="routes")
    analyses = relationship("RouteAnalysis", back_populates="route", cascade="all, delete-orphan")


class RouteAnalysis(Base):
    __tablename__ = "route_analyses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    route_id = Column(String(36), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    analysis_time = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    requested_travel_window = Column(String(100), nullable=True)
    route_provider = Column(String(50), default="osrm", nullable=False)
    risk_methodology_version = Column(String(20), default="1.0.0", nullable=False)
    analysis_status = Column(String(20), default="completed", nullable=False) # 'completed', 'insufficient_data'
    overall_risk_index = Column(Float, default=0.0, nullable=False) # 0 to 100
    overall_risk_level = Column(String(20), default="low", nullable=False) # 'low', 'moderate', 'high', 'critical', 'insufficient_data'
    evidence_coverage = Column(String(50), default="moderate", nullable=False)
    uncertainty_summary = Column(Text, nullable=True)
    contributing_reasons = Column(JSON, default=list) # List of explanations
    alternatives = Column(JSON, default=list) # List of alternative route analyses
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    route = relationship("Route", back_populates="analyses")
    segments = relationship("RouteSegment", back_populates="analysis", cascade="all, delete-orphan")


class RouteSegment(Base):
    __tablename__ = "route_segments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    analysis_id = Column(String(36), ForeignKey("route_analyses.id", ondelete="CASCADE"), nullable=False)
    segment_index = Column(Integer, nullable=False)
    start_lat = Column(Float, nullable=False)
    start_lon = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lon = Column(Float, nullable=False)
    segment_polyline = Column(JSON, nullable=True)
    segment_risk_index = Column(Float, default=0.0, nullable=False)
    segment_risk_level = Column(String(20), default="low", nullable=False)
    evidence_quality = Column(String(20), default="high", nullable=False)
    threat_references = Column(JSON, default=list) # IDs and titles of intersecting threats

    analysis = relationship("RouteAnalysis", back_populates="segments")


class Source(Base):
    __tablename__ = "sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False) # 'weather', 'geotechnical', 'disaster', 'routing', 'community'
    official_url = Column(String(255), nullable=False)
    licensing_notes = Column(Text, nullable=True)
    adapter_type = Column(String(50), nullable=False)
    refresh_policy = Column(String(100), default="every 30 minutes")
    last_successful_retrieval = Column(DateTime(timezone=True), nullable=True)
    last_observed_update = Column(DateTime(timezone=True), nullable=True)
    health_status = Column(String(20), default="healthy", nullable=False) # 'healthy', 'degraded', 'unavailable'
    consecutive_failures = Column(Integer, default=0, nullable=False)


class SourceObservation(Base):
    __tablename__ = "source_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_id = Column(String(36), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False)
    source_record_id = Column(String(100), nullable=True)
    raw_payload = Column(JSON, nullable=True)
    hazard_category = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    observed_time = Column(DateTime(timezone=True), nullable=True)
    published_time = Column(DateTime(timezone=True), nullable=True)
    retrieval_time = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    source_severity = Column(String(50), nullable=True)
    parsing_status = Column(String(20), default="parsed", nullable=False)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    hazard_category = Column(String(50), nullable=False) # 'weather', 'landslide', 'wildlife', 'social_disruption', 'road_infrastructure'
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    affected_radius_meters = Column(Float, default=5000.0, nullable=False)
    observed_time = Column(DateTime(timezone=True), nullable=False)
    published_time = Column(DateTime(timezone=True), nullable=False)
    source_name = Column(String(100), nullable=False)
    source_url = Column(String(255), nullable=True)
    source_severity = Column(String(50), nullable=False) # e.g. "IMD Red Alert", "Severe", "Moderate"
    platform_severity = Column(String(20), default="moderate", nullable=False) # 'low', 'moderate', 'high', 'critical'
    verification_status = Column(String(30), default="unverified", nullable=False) # 'official', 'verified_community', 'unverified', 'historical_susceptibility'
    status = Column(String(20), default="active", nullable=False) # 'active', 'resolved', 'expired', 'stale'
    is_sample_data = Column(Boolean, default=False, nullable=False)
    evidence_quality = Column(String(20), default="moderate", nullable=False) # 'high', 'moderate', 'low'
    fuzzed_coordinates = Column(Boolean, default=False, nullable=False) # Anti-poaching protection for wildlife
    expiry_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    evidence_records = relationship("IncidentEvidence", back_populates="incident", cascade="all, delete-orphan")


class IncidentEvidence(Base):
    __tablename__ = "incident_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    evidence_type = Column(String(50), nullable=False) # 'official_cap', 'citizen_report', 'sensor_reading', 'satellite'
    reference_id = Column(String(100), nullable=True)
    confidence = Column(Float, default=0.9, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    incident = relationship("Incident", back_populates="evidence_records")


class CommunityReport(Base):
    __tablename__ = "community_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reporter_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=True)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    observation_time = Column(DateTime(timezone=True), nullable=False)
    media_url = Column(String(255), nullable=True)
    moderation_state = Column(String(30), default="unverified", nullable=False)
    # 'unverified', 'corroborated', 'officially_confirmed', 'disputed', 'resolved', 'expired', 'rejected'
    moderation_notes = Column(Text, nullable=True)
    rejection_reason = Column(String(100), nullable=True)
    corroborator_ids = Column(JSON, default=list) # List of user IDs who corroborated this report
    dispute_records = Column(JSON, default=list) # List of disputes: [{user_id, reason, notes, timestamp}]
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    reporter = relationship("User", back_populates="reports")
    incident = relationship("Incident", foreign_keys=[incident_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), default="route_alert", nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="notifications")


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    admin_id = Column(String(36), nullable=False)
    admin_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False) # e.g. "APPROVE_REPORT", "UPDATE_INCIDENT_STATUS"
    target_entity = Column(String(50), nullable=False)
    target_id = Column(String(36), nullable=False)
    change_metadata = Column(JSON, default=dict)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ticket_reference = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=True)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), default="open", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

