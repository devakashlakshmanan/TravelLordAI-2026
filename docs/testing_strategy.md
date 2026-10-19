# TravelLord AI — Testing Strategy & Quality Assurance

## 1. Testing Pyramid
1. **Unit Tests (Backend & Frontend)**:
   - Python `pytest`: Test auth tokens, password hashing, spatial distance logic, risk index calculation, Pydantic validation, and adapter parsing.
   - Frontend Vitest: Unit tests for design tokens, form validation, risk badge formatting, and state management.
2. **Integration Tests**:
   - Database operations (CRUD, user isolation, foreign key constraints, migration smoke tests).
   - Route calculation with fallback to mock data when external OSRM is offline.
   - Spatial buffer intersection tests comparing points against route corridors.
3. **End-to-End & Acceptance Verification**:
   - Browser navigation, route search, incident filtering, community reporting workflow, and admin moderation.

## 2. Test Isolation & Reproducibility
- In-memory SQLite async test database (`sqlite+aiosqlite:///:memory:`) ensures rapid execution without requiring live PostgreSQL during unit and CI runs.
- External API calls (OSRM, Nominatim, IMD) use dedicated mock fixtures and timeout fallbacks so tests remain 100% deterministic and runnable offline.

## 3. Verification Protocol
- All tests must pass before declaring a task complete.
- Every major release requires verifying:
  - Account isolation (User A cannot read/modify User B's saved routes or reports).
  - Admin endpoint authorization (Unauthorized users receive 403 Forbidden).
  - Risk index calculations do not return negative or over-100 scores.
  - Zero-incident routes do not display "Verified Safe".
