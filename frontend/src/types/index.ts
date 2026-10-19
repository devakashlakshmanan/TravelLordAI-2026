export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  account_status: string;
  created_at: string;
  preferences?: {
    preferred_language?: string;
    preferred_travel_mode?: string;
    notification_preferences?: Record<string, boolean>;
    hazard_categories?: string[];
    privacy_settings?: Record<string, any>;
  };
}

export interface GeocodeItem {
  display_name: string;
  lat: number;
  lon: number;
  type?: string;
  importance?: number;
}

export interface IncidentReference {
  id: string;
  title: string;
  category: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  distance_meters: number;
  verification_status: 'official' | 'verified_community' | 'historical_susceptibility' | 'unverified';
  source_name: string;
  published_time: string;
}

export interface SegmentRisk {
  segment_index: number;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  risk_index: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  evidence_quality: string;
  threats: IncidentReference[];
}

export interface AlternativeRoute {
  name: string;
  distance_meters: number;
  duration_seconds: number;
  risk_index: number;
  risk_level: string;
  trade_off_explanation: string;
  geometry: [number, number][]; // [lon, lat]
}

export interface RouteAnalysis {
  analysis_id: string;
  route_id?: string;
  origin_label: string;
  destination_label: string;
  distance_meters: number;
  duration_seconds: number;
  overall_risk_index: number;
  overall_risk_level: 'low' | 'moderate' | 'high' | 'critical';
  evidence_coverage: string;
  uncertainty_summary: string;
  contributing_reasons: string[];
  segments: SegmentRisk[];
  intersecting_incidents: IncidentReference[];
  alternatives: AlternativeRoute[];
  geometry: [number, number][]; // [lon, lat]
  is_safe_claim: boolean;
  disclaimer: string;
}

export interface Incident {
  id: string;
  hazard_category: 'weather' | 'landslide' | 'wildlife' | 'social_disruption' | 'road_infrastructure';
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  affected_radius_meters: number;
  observed_time: string;
  published_time: string;
  source_name: string;
  source_url?: string;
  source_severity: string;
  platform_severity: 'low' | 'moderate' | 'high' | 'critical';
  verification_status: 'official' | 'verified_community' | 'historical_susceptibility' | 'unverified';
  status: 'active' | 'resolved' | 'expired' | 'stale';
  is_sample_data: boolean;
  evidence_quality: string;
  fuzzed_coordinates: boolean;
  location_name?: string;
  state_province?: string;
}

export interface ThreatSummary {
  total_active: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  verified_count: number;
  community_count: number;
  sample_data_count: number;
  last_updated: string;
}

export interface CommunityReport {
  id: string;
  category: string;
  title?: string;
  description: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  observation_time: string;
  media_url?: string;
  moderation_state: 'pending_review' | 'unverified' | 'corroborated' | 'officially_confirmed' | 'disputed' | 'resolved' | 'rejected' | 'expired';
  moderation_notes?: string;
  rejection_reason?: string;
  created_at: string;
  corroborations_count?: number;
  disputes_count?: number;
  incident_id?: string;
}

export interface DestinationItem {
  id: string;
  name: string;
  state: string;
  region: 'North' | 'South' | 'West' | 'East' | 'Northeast' | 'Central';
  tag: string;
  description: string;
  connectivity: {
    highway: string;
    airport: string;
    railway: string;
  };
  best_season: string;
  tourism_url: string;
  coordinates: [number, number]; // [lat, lon]
  terrain_type: string;
}

export interface TravelWiseItem {
  id: string;
  region: string;
  category: 'permit' | 'restriction' | 'eco_rule' | 'scam_alert';
  title: string;
  summary: string;
  rules: string[];
  official_links: { name: string; url: string }[];
  caution_notes: string;
}

export interface HazardGuideItem {
  id: string;
  hazard_type: string;
  title: string;
  icon: string;
  high_risk_corridors: string[];
  signs_to_watch: string[];
  precautions: string[];
  emergency_actions: string[];
  non_diagnosis_disclaimer: string;
}

export interface EmergencyContactItem {
  id: string;
  name: string;
  number: string;
  category: 'national' | 'highway' | 'medical' | 'disaster' | 'state';
  description: string;
  availability: string;
  jurisdiction: string;
}

export interface EvidenceCitation {
  incident_id: string;
  title: string;
  category: string;
  source_name: string;
  timestamp: string;
  verification: string;
  relevance_reason: string;
}

export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantResponse {
  answer: string;
  evidence_citations: EvidenceCitation[];
  data_freshness_status: string;
  confidence_level: string;
  is_synthesized_safety_guarantee: boolean;
  provider?: string;
}

export interface NotificationItem {
  id: string;
  category: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface SourceStatus {
  id: string;
  name: string;
  category: string;
  official_url: string;
  licensing_notes?: string;
  adapter_type: string;
  refresh_policy: string;
  last_successful_retrieval?: string;
  last_observed_update?: string;
  health_status: 'healthy' | 'degraded' | 'unavailable';
}

export interface SavedRoute {
  id: string;
  title: string;
  origin_label: string;
  destination_label: string;
  distance_meters: number;
  duration_seconds: number;
  is_saved: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_email: string;
  action: string;
  target_entity: string;
  target_id: string;
  change_metadata: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}
