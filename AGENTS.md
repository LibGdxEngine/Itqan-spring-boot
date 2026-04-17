<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# Itqan Education Platform

## Purpose
A monorepo for a professional education platform built with Spring Boot (Java 21) backend and Next.js (TypeScript) frontend. Supports course management, video streaming, quizzes, enrollments, payments (Stripe), search (Meilisearch), and bilingual UI (EN/AR).

## Key Files

| File | Description |
|------|-------------|
| `compose.yaml` | Docker Compose orchestration with dev/prod profiles (Postgres, MinIO, Meilisearch, pgAdmin) |
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
- Backend: `cd backend && ./mvnw test` (JUnit 5 + H2)
- Frontend: `cd frontend && npm run lint` (no test runner yet)
- After backend API changes: `cd frontend && npm run generate-api`

### Common Patterns
- Backend uses **Vertical Slice Architecture** — each feature is self-contained under `features/`
- Shared concerns live in `common/` (security, config, exceptions)
- Frontend auto-generates API client from backend OpenAPI spec
- Bilingual support via next-intl (EN/AR with RTL)

## Dependencies

### External Services (Docker Compose)
- **PostgreSQL 16** — primary database
- **MinIO** — S3-compatible video storage
- **Meilisearch v1.12** — full-text course search
- **pgAdmin** — optional DB admin UI (pgadmin profile)

### Key Technology Stack
- Java 21, Spring Boot 3.5.7, Spring Security, JPA/Hibernate, Flyway migrations
- Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI
- JWT authentication, Stripe payments, MapStruct, Lombok

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
