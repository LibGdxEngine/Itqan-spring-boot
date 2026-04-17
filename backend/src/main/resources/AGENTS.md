<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# resources

## Purpose
Application configuration files, localization messages, and Flyway database migration scripts.

## Key Files

| File | Description |
|------|-------------|
| `application.properties` | Main configuration — DB, JWT, CORS, email, storage, video, Meilisearch settings (uses env vars) |
| `messages_en.properties` | English validation and error messages |
| `messages_ar.properties` | Arabic localization strings |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `db/migration/` | Flyway SQL migration scripts (versioned V6–V9) |

## For AI Agents

### Working In This Directory
- Database schema changes **must** use Flyway migrations: create `V{next}__description.sql` in `db/migration/`
- Never modify existing migration files — create new versioned ones
- Configuration uses Spring's `${ENV_VAR:default}` pattern for environment variable overrides
- Both `messages_en.properties` and `messages_ar.properties` must be kept in sync

### Migration Files
| File | Description |
|------|-------------|
| `V6__add_lesson_progress_tracking.sql` | lesson_enrollments table with progress indexes |
| `V7__add_lesson_video_storage_fields.sql` | Video metadata columns on lessons table |
| `V8__add_payments_and_coupons.sql` | payments, coupons, coupon_redemptions, processed_stripe_events tables |
| `V9__add_analytics_support.sql` | Analytics indexes on payments, enrollments, users |

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
