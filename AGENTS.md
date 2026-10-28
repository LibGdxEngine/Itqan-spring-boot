<!-- Generated: 2026-04-12 | Updated: 2026-10-28 -->

# Itqan Education Platform

## Purpose
A monorepo for a professional education platform built with Spring Boot (Java 21) backend and Next.js (TypeScript) frontend. Supports course management, video streaming, quizzes, enrollments, payments (Stripe), search (Meilisearch), and bilingual UI (EN/AR).

## Key Files

| File | Description |
|------|-------------|
| `compose.yaml` | Docker Compose with profiles: `dev`, `prod` (includes backups), `monitoring`, `backup`, `pgadmin` |
| `scripts/` | `deploy.sh`, `db-backup.sh`, `db-restore.sh`, `minio-backup.sh` (rclone), `run-daily.sh` (scheduler) |
| `monitoring/` | Prometheus config + alert rules and Grafana provisioning for the `monitoring` profile |
| `.gitattributes` | Forces LF for shell scripts (they are bind-mounted into Linux containers) |
| `.env.example` | Environment variable template for all services |
| `.gitignore` | Git ignore rules |
| `.dockerignore` | Docker ignore rules |
| `README.md` | Project overview and setup instructions (Arabic) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `backend/` | Spring Boot 3 REST API — auth, courses, payments, video, analytics (see `backend/AGENTS.md`) |
| `frontend/` | Next.js 16 web app — pages, components, generated API client (see `frontend/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Run `cp .env.example .env` before first use
- Use `COMPOSE_PROFILES=dev docker compose up --build` for full-stack development
- Backend runs on `:8080`, frontend on `:3000`, Postgres on `:5433`, MinIO on `:9000`, Meilisearch on `:7700`
- Do not hand-edit generated files in `frontend/src/lib/api/`

### Testing Requirements
- Backend: `cd backend && mvn test` (JUnit 5 on H2, fast)
- Backend on real PostgreSQL: `cd backend && mvn -Ppostgres test` (Testcontainers; applies the Flyway
  migrations and runs Hibernate `validate`, so it catches migration/entity drift). Needs Docker.
  No local Maven? Run it in `maven:3.9-eclipse-temurin-21` with the Docker socket mounted and
  `TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal`.
- Frontend: `cd frontend && npm run lint && npm run typecheck && npm run test:run` (Vitest + Testing Library)
- End-to-end smoke: `cd frontend && npx playwright install chromium && npm run test:e2e`. Needs a running
  backend and frontend, plus `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` for the backend super admin
  (`E2E_BASE_URL`, `E2E_API_URL` default to localhost:3000 / :8080). It seeds its own course.
- After backend API changes: `cd frontend && npm run generate-api`
- New schema changes need a Flyway migration in `backend/src/main/resources/db/migration` (`V7__...sql`);
  prod runs `ddl-auto=validate`

### Operations
- **Backups**: with the `prod` profile, `postgres-backup` dumps the DB daily (`BACKUP_DB_TIME`, kept
  `BACKUP_RETENTION_DAYS`) and `minio-backup` copies the video bucket (`BACKUP_FILES_TIME`) into the
  `backup_data` volume. Set `BACKUP_S3_*` for an off-site copy. Restore: `scripts/db-restore.sh <file>`.
- **Metrics**: `/actuator/prometheus` (admin JWT, or Basic `prometheus:$METRICS_SCRAPE_TOKEN`). Caddy
  blocks `/actuator` from the internet. `COMPOSE_PROFILES=prod,monitoring` starts Prometheus (:9090)
  and Grafana (:3001, needs `GRAFANA_ADMIN_PASSWORD`), both bound to `PORT_BIND_HOST`.
- **Errors**: Sentry, off until `SENTRY_DSN` (backend) / `SENTRY_DSN_FRONTEND` (frontend, build arg) are set.
  The backend reports unhandled 500s from `GlobalExceptionHandler`; the frontend reports from
  `instrumentation.ts`, `instrumentation-client.ts` and the error boundaries.

### Common Patterns
- Backend uses **Vertical Slice Architecture** — each feature is self-contained under `features/`
- Shared concerns live in `common/` (security, config, exceptions)
- Frontend auto-generates API client from backend OpenAPI spec
- Bilingual support via next-intl (EN/AR with RTL)

## Dependencies

### External Services (Docker Compose)
- **PostgreSQL 16** — primary database (schema owned by Flyway)
- **Redis 7** — cache and rate limiting
- **MinIO** — S3-compatible video storage. Note: the `quay.io/minio/*` images are no longer publicly
  pullable; existing local images still work, new hosts need another source or an S3-compatible replacement
- **Meilisearch v1.12** — full-text course search
- **Caddy** — HTTPS reverse proxy (prod)
- **Prometheus + Grafana** — optional (`monitoring` profile)
- **pgAdmin** — optional DB admin UI (`pgadmin` profile)

### Key Technology Stack
- Java 21, Spring Boot 3.5.7, Spring Security, JPA/Hibernate, Flyway migrations, Micrometer, Sentry
- Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, next-intl, Vitest, Playwright
- JWT authentication, Stripe payments, MapStruct, Lombok

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
