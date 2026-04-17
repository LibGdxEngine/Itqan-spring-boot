<!-- Parent: ../../../../../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# com.itqan.edu

## Purpose
Root Java package for the Itqan education platform backend. Contains the Spring Boot application entry point and organizes code into shared concerns (`common/`) and feature modules (`features/`).

## Key Files

| File | Description |
|------|-------------|
| `Application.java` | Spring Boot main class with `@SpringBootApplication` — application entry point |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `common/` | Shared kernel — security, configuration, exceptions, utilities (see `common/AGENTS.md`) |
| `features/` | Vertical slice feature modules — each feature is self-contained (see `features/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- New features go under `features/<feature-name>/` with their own Controller/Service/Repository/Entity/DTO/Mapper
- Cross-cutting concerns go in `common/`
- Follow the existing vertical slice pattern — avoid cross-feature dependencies where possible

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
