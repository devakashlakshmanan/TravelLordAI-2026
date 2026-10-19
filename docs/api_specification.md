# TravelLord AI — API Specification (v1)

Base URL: `/api/v1`

---

## 1. Authentication & User Profile
- `POST /api/v1/auth/register`: Create a new user account (Name, Email, Password).
- `POST /api/v1/auth/login`: Authenticate user, set secure HttpOnly session cookie, return JWT token and user profile.
- `POST /api/v1/auth/logout`: Invalidate session cookie and revoke token.
- `POST /api/v1/auth/forgot-password`: Request password recovery link (generic response to prevent email enumeration).
- `GET /api/v1/users/me`: Return authenticated user profile and roles.
- `PATCH /api/v1/users/me`: Update profile details and travel preferences.

---

## 2. Route Planning & Risk Intelligence
- `GET /api/v1/routes/geocode`: Location search/autocomplete powered by Nominatim with caching.
- `POST /api/v1/routes/calculate`: Fetch primary and alternative driving routes from OSRM.
- `POST /api/v1/routes/analyze`: Run multi-threat corridor analysis on selected route and persist analysis results.
- `GET /api/v1/routes`: Retrieve user's saved routes.
- `POST /api/v1/routes`: Save a route to user's dashboard.
- `GET /api/v1/routes/{id}`: Get specific saved route with latest threat analysis.
- `DELETE /api/v1/routes/{id}`: Delete a saved route.

---

## 3. Threat Center & Public Alerts
- `GET /api/v1/incidents`: Query active hazards and incidents with filters (category, severity, verification, bounding box).
- `GET /api/v1/incidents/{id}`: Detailed incident information with evidence provenance and coordinates.
- `GET /api/v1/alerts`: Official national and regional emergency bulletins.
- `GET /api/v1/threats/summary`: Aggregate statistics and threat counts across India.

---

## 4. Community Hazard Reporting
- `POST /api/v1/reports`: Submit a citizen hazard report with category, coordinates, description, and optional photo.
- `GET /api/v1/reports/mine`: List reports submitted by the authenticated user.
- `GET /api/v1/reports/{id}`: Fetch status and moderation lifecycle of a report.

---

## 5. Evidence-Grounded AI Assistant
- `POST /api/v1/assistant/query`: Ask travel risk questions grounded in current database incidents, weather alerts, and corridor exposures.

---

## 6. Personalization & Notifications
- `GET /api/v1/notifications`: List user's notifications.
- `PATCH /api/v1/notifications/{id}`: Mark notification as read.
- `POST /api/v1/trusted-contacts/share`: Generate a secure shareable journey link for trusted contacts.

---

## 7. Operational & Administration
- `GET /health`: Health check (database, memory, uptime).
- `GET /ready`: Readiness check for containerized orchestrators.
- `GET /api/v1/sources/status`: Status, freshness, and last ingestion time for external feeds.
- `GET /api/v1/admin/reports`: List community submissions requiring moderation.
- `PATCH /api/v1/admin/reports/{id}`: Moderate/approve/reject community report.
- `GET /api/v1/admin/audit-logs`: Audit logs of administrative actions.
