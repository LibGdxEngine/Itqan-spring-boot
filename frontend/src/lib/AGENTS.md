<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# lib

## Purpose
API client layer, authentication utilities, and service modules. Contains both hand-written API helpers and auto-generated OpenAPI client code.

## Key Files

| File | Description |
|------|-------------|
| `api-axios.ts` | Axios instance with JWT auth interceptors, token refresh, and error handling |
| `auth.ts` | Authentication API functions — login, register, password reset, Google auth |
| `admins.ts` | Admin management API — CRUD operations on admin users |
| `payments-billing.ts` | Payment and billing API functions |
| `videoService.ts` | Video playback and bookmark service functions |
| `lessonVideoUploadService.ts` | Multipart video upload management (S3/MinIO) |
| `utils.ts` | Common utility functions (includes `cn()` for class merging) |
| `index.ts` | Library exports |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `api/` | Auto-generated OpenAPI TypeScript client — DO NOT EDIT (see `api/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `api-axios.ts` is the central HTTP client — all API calls should use it or the generated services
- **Never hand-edit** files in `api/` — regenerate with `npm run generate-api`
- Hand-written API helpers (`auth.ts`, `admins.ts`, etc.) supplement the generated client for custom flows
- JWT tokens are stored in localStorage and attached via Axios interceptors

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
