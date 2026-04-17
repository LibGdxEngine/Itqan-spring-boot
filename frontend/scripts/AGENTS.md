<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# scripts

## Purpose
Build and code generation scripts for the frontend application.

## Key Files

| File | Description |
|------|-------------|
| `generate-api.js` | Downloads OpenAPI spec from backend (`localhost:8080/v3/api-docs`) and generates TypeScript API client into `src/lib/api/` using openapi-typescript-codegen |

## For AI Agents

### Working In This Directory
- Run via `npm run generate-api` from the frontend root
- Backend must be running on `:8080` for the script to fetch the OpenAPI spec
- Output goes to `src/lib/api/` — do not hand-edit generated files

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
