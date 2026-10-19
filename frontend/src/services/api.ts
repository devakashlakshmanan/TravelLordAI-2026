import {
  User,
  GeocodeItem,
  RouteAnalysis,
  Incident,
  ThreatSummary,
  CommunityReport,
  AssistantResponse,
  NotificationItem,
  SourceStatus,
  SavedRoute,
  AuditLog
} from '../types';

const API_BASE = '/api/v1';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('travellord_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = 'An error occurred';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorDetail;
      } catch {
        // Fallback to text
        errorDetail = response.statusText || errorDetail;
      }
      throw new Error(errorDetail);
    }

    return response.json() as Promise<T>;
  }

  // Auth
  async register(data: { name: string; email: string; password: string }) {
    const res = await this.request<{ access_token: string; role: 'user' | 'admin'; user_id: string; name: string; email: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(data) }
    );
    localStorage.setItem('travellord_token', res.access_token);
    return res;
  }

  async login(data: { email: string; password: string }) {
    const res = await this.request<{ access_token: string; role: 'user' | 'admin'; user_id: string; name: string; email: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(data) }
    );
    localStorage.setItem('travellord_token', res.access_token);
    return res;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('travellord_token');
    }
  }

  async getMe(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async updateMe(data: Partial<User['preferences']> & { name?: string }): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Routes & Geocoding
  async geocode(query: string): Promise<GeocodeItem[]> {
    return this.request<GeocodeItem[]>(`/routes/geocode?q=${encodeURIComponent(query)}`);
  }

  async analyzeRoute(data: {
    origin_label: string;
    origin_lat: number;
    origin_lon: number;
    destination_label: string;
    destination_lat: number;
    destination_lon: number;
    travel_mode?: string;
  }): Promise<RouteAnalysis> {
    return this.request<RouteAnalysis>('/routes/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listSavedRoutes(): Promise<SavedRoute[]> {
    return this.request<SavedRoute[]>('/routes');
  }

  async saveRoute(data: {
    title: string;
    origin_label: string;
    origin_lat: number;
    origin_lon: number;
    destination_label: string;
    destination_lat: number;
    destination_lon: number;
    travel_mode?: string;
    distance_meters?: number;
    duration_seconds?: number;
    geometry?: [number, number][];
  }) {
    return this.request<{ id: string; message: string }>('/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRouteById(id: string) {
    return this.request<any>(`/routes/${id}`);
  }

  async deleteSavedRoute(id: string) {
    return this.request<{ message: string }>(`/routes/${id}`, {
      method: 'DELETE',
    });
  }

  // Incidents
  async getIncidents(params: {
    category?: string;
    severity?: string;
    verification?: string;
    include_sample?: boolean;
  } = {}): Promise<Incident[]> {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.severity) query.set('severity', params.severity);
    if (params.verification) query.set('verification', params.verification);
    if (params.include_sample !== undefined) query.set('include_sample', String(params.include_sample));
    return this.request<Incident[]>(`/incidents?${query.toString()}`);
  }

  async getIncidentById(id: string): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}`);
  }

  async getThreatSummary(): Promise<ThreatSummary> {
    return this.request<ThreatSummary>('/threats/summary');
  }

  async getAlerts(): Promise<Incident[]> {
    return this.request<Incident[]>('/alerts');
  }

  // Community Reports
  async submitReport(data: {
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    location_name?: string;
    media_url?: string;
  }): Promise<CommunityReport> {
    return this.request<CommunityReport>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyReports(): Promise<CommunityReport[]> {
    return this.request<CommunityReport[]>('/reports/mine');
  }

  async getReportById(id: string): Promise<CommunityReport> {
    return this.request<CommunityReport>(`/reports/${id}`);
  }

  // Assistant
  async queryAssistant(query: string, routeId?: string): Promise<AssistantResponse> {
    return this.request<AssistantResponse>('/assistant/query', {
      method: 'POST',
      body: JSON.stringify({ query, route_id: routeId }),
    });
  }

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>('/notifications');
  }

  async markNotificationRead(id: string): Promise<NotificationItem> {
    return this.request<NotificationItem>(`/notifications/${id}`, {
      method: 'PATCH',
    });
  }

  // Sources & Status
  async getSourcesStatus(): Promise<SourceStatus[]> {
    return this.request<SourceStatus[]>('/sources/status');
  }

  // Admin
  async getAdminReports(state?: string): Promise<CommunityReport[]> {
    const q = state ? `?state=${encodeURIComponent(state)}` : '';
    return this.request<CommunityReport[]>(`/admin/reports${q}`);
  }

  async moderateReport(id: string, action: 'approve' | 'corroborate' | 'reject' | 'resolve', notes?: string, rejectionReason?: string) {
    return this.request<CommunityReport>(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        action,
        moderation_notes: notes,
        rejection_reason: rejectionReason,
      }),
    });
  }

  async getAdminAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    return this.request<AuditLog[]>(`/admin/audit-logs?limit=${limit}`);
  }

  async getAdminSources(): Promise<SourceStatus[]> {
    return this.request<SourceStatus[]>('/admin/sources');
  }
}

export const api = new ApiService();
