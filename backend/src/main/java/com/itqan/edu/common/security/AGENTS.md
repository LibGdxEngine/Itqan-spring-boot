<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# security

## Purpose
JWT-based authentication infrastructure. Handles token generation/validation, request filtering, and access to the currently authenticated user.

## Key Files

| File | Description |
|------|-------------|
| `JwtTokenProvider.java` | JWT token generation (HS256), validation, and claim extraction using jjwt library |
| `JwtAuthenticationFilter.java` | `OncePerRequestFilter` — extracts JWT from Authorization header, validates, sets SecurityContext |
| `CurrentUserService.java` | Helper to retrieve the authenticated `User` entity from Spring SecurityContext |

## For AI Agents

### Working In This Directory
- JWT secret and expiration are configured via `JWT_SECRET` and `JWT_EXPIRATION` env vars
- Token is passed as `Authorization: Bearer <token>` header
- `CurrentUserService.getCurrentUser()` returns the authenticated `User` entity — use in service layer
- The filter runs on every request — keep it lightweight

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
