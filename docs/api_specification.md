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
- `GET /api/v1/routes/geocode`: Pan-India location and landmark search, or direct coordinate parsing (`q`).
- `GET /api/v1/routes/reverse-geocode`: Reverse geocode coordinates (`lat`, `lon`) to Indian town/city context.
- `POST /api/v1/routes/calculate`: Fetch primary and alternative driving routes from OSRM.
- `POST /api/v1/routes/analyze`: Run multi-threat corridor analysis on selected route and persist analysis results.
- `GET /api/v1/routes/analyses/{analysis_id}`: Retrieve a stored route risk analysis by its unique ID.
- `GET /api/v1/routes`: Retrieve user's saved routes.
- `POST /api/v1/routes`: Save a route to user's dashboard.
- `GET /api/v1/routes/{id}`: Get specific saved route with latest threat analysis.
- `DELETE /api/v1/routes/{id}`: Delete a saved route.

---

## 3. Threat Center & Public Alerts
- `GET /api/v1/incidents`: Query active hazards across India with filters: `category`, `severity`, `verification`, `state`, `search`, and viewport bounding-box (`min_lat`, `max_lat`, `min_lon`, `max_lon`).
- `GET /api/v1/incidents/{id}`: Detailed incident information with evidence provenance and coordinates.
- `GET /api/v1/alerts`: Official national and regional emergency bulletins.
- `GET /api/v1/threats/summary`: Aggregate statistics and threat counts across India.

---

## 4. Community Hazard Reporting & Observation Lifecycle
- `POST /api/v1/reports`: Submit a citizen hazard report with category, title, coordinates, description, and optional photo (Authenticated). Automatically links to shared Incident record and clusters duplicates within 1500m.
- `GET /api/v1/reports/feed`: Shared cross-account community incident feed with filters (`category`, `status`, `search`, `limit`).
- `GET /api/v1/reports/mine`: List reports submitted by the authenticated user with private tracking status.
- `GET /api/v1/reports/{id}`: Fetch status and moderation lifecycle of a report.
- `POST /api/v1/reports/{id}/corroborate`: Witness corroboration by fellow travellers. Promotes report to `corroborated` and linked incident to `verified_community`. Explicitly prevents self-corroboration.
- `POST /api/v1/reports/{id}/dispute`: Record dispute against inaccurate or cleared reports with reason and observational notes.
- `POST /api/v1/reports/{id}/resolve`: Mark an observation as resolved/cleared (permitted for original reporter or admin).

---

## 5. Evidence-Grounded AI Assistant
- `POST /api/v1/assistant/query`: Ask travel risk questions grounded in current database incidents, weather alerts, and corridor exposures (Authenticated, user route data isolated).

---

## 6. Personalization & Notifications
- `GET /api/v1/notifications`: List user's notifications.
- `PATCH /api/v1/notifications/{id}`: Mark notification as read.
- `POST /api/v1/trusted-contacts/share`: Generate a secure shareable journey link for trusted contacts.

---

## 7. Support & Feedback
- `POST /api/v1/support/tickets`: Submit support or inquiry ticket, returning authentic reference ID (`TL-SUP-XXXXX`).
- `GET /api/v1/support/tickets`: List submitted support tickets with email, subject, status (Admin only).

---

## 8. Operational & Administration
- `GET /health`: Health check (database, memory, uptime).
- `GET /ready`: Readiness check for containerized orchestrators.
- `GET /api/v1/sources/status`: Status, freshness, and last ingestion time for external feeds.
- `POST /api/v1/sources/sync`: Trigger on-demand national synchronization across official providers.
- `GET /api/v1/admin/reports`: List community submissions requiring moderation.
- `PATCH /api/v1/admin/reports/{id}`: Moderate/approve/reject community report.
- `GET /api/v1/admin/audit-logs`: Audit logs of administrative actions.
