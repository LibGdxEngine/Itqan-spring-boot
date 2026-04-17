<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# features

## Purpose
Vertical slice feature modules. Each feature is self-contained with its own Controller, Service, Repository, Entity, DTOs, and Mappers. Features should minimize cross-dependencies.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `auth/` | Authentication — registration, login, JWT, Google OAuth, password reset (see `auth/AGENTS.md`) |
| `students/` | Student profile CRUD (see `students/AGENTS.md`) |
| `courses/` | Course, module, and lesson management with video upload and search (see `courses/AGENTS.md`) |
| `enrollments/` | Student-course enrollments and lesson progress tracking (see `enrollments/AGENTS.md`) |
| `quizzes/` | Quiz creation, attempts, grading (see `quizzes/AGENTS.md`) |
| `payments/` | Stripe payments, coupons, enrollment codes (see `payments/AGENTS.md`) |
| `admins/` | Admin user management and super admin initialization (see `admins/AGENTS.md`) |
| `admin/` | Admin-specific features — content management and analytics (see `admin/AGENTS.md`) |
| `video/` | Video bookmark management for lessons (see `video/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Each new feature gets its own package with the standard structure:
  - `*Controller.java` — REST endpoints
  - `*Service.java` — business logic
  - `*Repository.java` — data access (Spring Data JPA)
  - `*.java` (entity) — JPA entity
  - `dto/` — request/response DTOs
  - `mapper/` — MapStruct mappers
- Use `@RestController` with `@RequestMapping("/api/<feature>")`
- Inject services via constructor injection (Lombok `@RequiredArgsConstructor`)
- Throw `BusinessException` with appropriate `ErrorCode` for error cases
- Add corresponding tests in `src/test/java/com/itqan/edu/features/<feature>/`

### Cross-Feature Dependencies
- `courses` → used by `enrollments`, `payments`, `quizzes`
- `auth` (User entity) → used by `enrollments`, `payments`, `admins`, `admin`
- `enrollments` → created by `payments` after successful checkout

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
