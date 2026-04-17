<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# admins

## Purpose
Admin user management — CRUD operations for admin accounts and super admin initialization on application startup.

## Key Files

| File | Description |
|------|-------------|
| `AdminController.java` | Admin CRUD — create, list, update, delete admin users |
| `AdminService.java` | Admin management business logic |
| `SuperAdminInitializer.java` | Creates default super admin on first startup using env var credentials |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `dto/` | AdminCreateRequest, AdminResponse, AdminUpdateRequest |

## For AI Agents

### Working In This Directory
- Super admin credentials come from `APP_SUPER_ADMIN_*` env vars
- `SuperAdminInitializer` runs on startup — creates admin only if not exists
- Admin users are stored in the same `User` entity (auth feature) with `ADMIN` role

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
