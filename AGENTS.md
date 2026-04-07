# Repository Guidelines

## Project Structure & Module Organization
This repository is a monorepo with two applications:
- `backend/`: Spring Boot (Java 21) API.
- `frontend/`: Next.js (TypeScript) web app.
- `compose.yaml`: local multi-service orchestration (Postgres, backend, frontend, optional pgAdmin).

Backend code follows a vertical-slice layout in `backend/src/main/java/com/itqan/edu/features/*`, with shared concerns under `backend/src/main/java/com/itqan/edu/common/*`. Database migrations live in `backend/src/main/resources/db/migration`. Backend tests are in `backend/src/test/java`.

Frontend routes are under `frontend/src/app`, reusable UI in `frontend/src/components`, and generated API client code in `frontend/src/lib/api`. Static assets are in `frontend/public`.

## Build, Test, and Development Commands
- `cp .env.example .env`: initialize environment variables.
- `COMPOSE_PROFILES=dev docker compose up --build`: run full stack in Docker.
- `cd backend && ./mvnw spring-boot:run`: run backend locally.
- `cd backend && ./mvnw test`: run backend tests.
- `cd frontend && npm install && npm run dev`: run frontend locally.
- `cd frontend && npm run lint`: run ESLint.
- `cd frontend && npm run build`: production build check.
- `cd frontend && npm run generate-api`: regenerate TS API client (backend must be running).

## Coding Style & Naming Conventions
Use 4 spaces in Java and standard Spring naming:
- Classes: `PascalCase`
- Methods/fields: `camelCase`
- Packages: lowercase, feature-oriented
- Suffixes: `*Controller`, `*Service`, `*Repository`; DTOs in `dto/`, mappers in `mapper/`

For TypeScript/React, follow `frontend/eslint.config.mjs` (`eslint-config-next` + TS rules):
- Components: `PascalCase`
- Variables/functions: `camelCase`
- Route folders in `src/app`: lowercase/kebab-case

Do not hand-edit generated client files in `frontend/src/lib/api`.

## Testing Guidelines
Backend tests use JUnit 5, Spring Boot Test, and AssertJ. Place tests in the matching feature package and prefer `*IntegrationTest.java` naming. Keep tests isolated and reset state in setup where needed.

Frontend test runner is not configured yet; for frontend PRs, run `npm run lint` and manually verify affected pages/flows.

## Commit & Pull Request Guidelines
Git history uses short, imperative commit messages (for example: `fix the compose for dev and make translations`). Keep each commit focused on one change.

PRs should include:
- concise summary and rationale
- verification steps (exact commands)
- linked issue/task
- screenshots for UI changes
- notes for config, migration, or API contract impacts
