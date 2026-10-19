# TravelLord AI — Security, Privacy & Compliance Guidelines

## 1. Authentication & Session Security
- **Password Hashing**: Passwords are hashed using bcrypt with adaptive work factor (salt rounds >= 12). Plaintext passwords are never logged or stored.
- **Session Tokens**: JWT signed with HMAC-SHA256 and verified on every protected route. Session cookies are delivered with `HttpOnly`, `SameSite=Lax`, and `Secure` (in HTTPS production).
- **Brute-Force & Enumeration Defense**:
  - Authentication endpoints are rate-limited.
  - Password reset endpoints return generic 200 OK messages regardless of whether the email exists in the database.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `user` and `admin` roles, enforced strictly in the backend controller layer.

## 2. Geospatial Privacy & Sensitive Wildlife Protection
- **Wildlife Anti-Poaching Rule**: Precise GPS coordinates for endangered species (e.g. Tiger, Rhino, Elephant herd sightings) are strictly fuzzed to a broad regional corridor (minimum 10 km bounding box) in public feeds.
- **User Location Privacy**: Real-time GPS traces from users are processed in ephemeral memory for corridor matching and never permanently logged or tracked without explicit opt-in.
- **Trusted Contact Sharing**: Shareable trip links are restricted by time-to-live (TTL) tokens and can be revoked immediately by the user.

## 3. Data Protection & Input Sanitization
- **SQL Injection Prevention**: All database queries are executed via SQLAlchemy parameterized ORM or async text bindings. Raw SQL string concatenation is strictly prohibited.
- **Cross-Site Scripting (XSS)**: All user submissions (reports, descriptions, questions) are sanitized and validated via Pydantic schemas before storage and rendered safely in React.
- **Cross-Origin Resource Sharing (CORS)**: Configurable whitelist of trusted frontend domains.
