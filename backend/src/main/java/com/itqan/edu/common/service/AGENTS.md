<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# service

## Purpose
Shared services used across multiple feature modules.

## Key Files

| File | Description |
|------|-------------|
| `EmailService.java` | Email sending via Gmail SMTP — password reset emails, notifications |

## For AI Agents

### Working In This Directory
- Email is configured via Spring Mail properties (Gmail SMTP)
- Use this service for any transactional emails across features
- Email credentials are configured in `application.properties` via env vars

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
