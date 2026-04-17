<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# config

## Purpose
Spring configuration beans for security, API documentation, object storage, payments, and search infrastructure.

## Key Files

| File | Description |
|------|-------------|
| `SecurityConfig.java` | Spring Security filter chain — CORS, auth provider, BCrypt encoder, public/protected endpoint rules |
| `OpenApiConfig.java` | Swagger/OpenAPI config with JWT Bearer authentication scheme |
| `StorageConfig.java` | AWS S3 client and presigner beans for MinIO-compatible storage |
| `StorageProperties.java` | `@ConfigurationProperties` for S3 endpoint, region, credentials |
| `VideoStorageProperties.java` | Video-specific storage settings — max size, part size, presign expiry |
| `StripeProperties.java` | `@ConfigurationProperties` for Stripe API keys and URLs |
| `MeilisearchConfig.java` | Meilisearch client bean configuration |

## For AI Agents

### Working In This Directory
- Security rules are in `SecurityConfig.java` — update endpoint matchers when adding new public/protected routes
- Storage and payment configs use `@ConfigurationProperties` bound to `application.properties`
- Changes to security config affect all endpoints — test thoroughly

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
