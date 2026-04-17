<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# common

## Purpose
Shared kernel containing cross-cutting concerns used by all feature modules: security (JWT), configuration (Spring beans), exception handling, email services, and utilities.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `config/` | Spring configuration beans — Security, OpenAPI, S3 storage, Stripe, Meilisearch (see `config/AGENTS.md`) |
| `exception/` | Global exception handler, BusinessException, ErrorCode enum (see `exception/AGENTS.md`) |
| `security/` | JWT token provider, auth filter, current user service (see `security/AGENTS.md`) |
| `service/` | Shared services — EmailService (see `service/AGENTS.md`) |
| `utils/` | Utility classes |

## For AI Agents

### Working In This Directory
- Code here is shared across all features — changes have wide blast radius
- New configuration beans go in `config/`
- New error codes go in `exception/ErrorCode.java`
- Security changes require careful testing of all protected endpoints

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
