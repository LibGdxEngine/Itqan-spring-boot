<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# backend

## Purpose
Spring Boot 3.5.7 REST API (Java 21) for the Itqan education platform. Provides authentication (JWT + Google OAuth), course/module/lesson management, video storage (MinIO/S3), quizzes, enrollments, payments (Stripe), coupons, analytics, and full-text search (Meilisearch).

## Key Files

| File | Description |
|------|-------------|
| `pom.xml` | Maven project descriptor — Spring Boot 3.5.7, Java 21, all dependencies |
| `Dockerfile` | Multi-stage build: development (devtools), build (Maven), production (JRE Alpine) |
| `mvnw` / `mvnw.cmd` | Maven wrapper scripts |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | Application source and test code (see `src/AGENTS.md`) |
| `.mvn/wrapper/` | Maven wrapper JAR and properties |

## For AI Agents

### Working In This Directory
- Use `./mvnw spring-boot:run` to run locally (requires Postgres, MinIO, Meilisearch running)
- Use `./mvnw test` to run tests (uses H2 in-memory DB)
- Java code uses 4-space indentation
- Follow Spring naming: `*Controller`, `*Service`, `*Repository` suffixes
- DTOs go in `dto/` sub-packages, mappers in `mapper/`
- Entities use Lombok `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`
- MapStruct handles entity-to-DTO mapping

### Testing Requirements
- Tests use JUnit 5 + Spring Boot Test + AssertJ
- Prefer `*IntegrationTest.java` naming
- Tests run against H2 with `application-test.properties`
- Place tests in matching feature package under `src/test/`

### Common Patterns
- Vertical Slice Architecture: each feature has Controller/Service/Repository/Entity/DTO/Mapper
- Global exception handling via `BusinessException` + `ErrorCode` enum + `GlobalExceptionHandler`
- JWT auth filter on every request; `CurrentUserService` for authenticated user
- Flyway migrations in `src/main/resources/db/migration/`
- OpenAPI/Swagger auto-generated at `/swagger-ui.html`

## Dependencies

### Internal
- Depends on PostgreSQL, MinIO, and Meilisearch (see root `compose.yaml`)

### External
- Spring Boot 3.5.7 (Web, Security, Data JPA, Validation, Mail, DevTools)
- jjwt 0.12.3 (JWT tokens)
- MapStruct 1.5.5 (object mapping)
- Stripe 24.19.0 (payments)
- AWS SDK v2.25.67 (S3/MinIO)
- Meilisearch Java 0.14.2 (search)
- springdoc-openapi 2.8.0 (API docs)
- Lombok (boilerplate reduction)
- Google API Client 2.2.0 (OAuth)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
