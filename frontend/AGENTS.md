<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# frontend

## Purpose
Next.js 16 web application (React 19, TypeScript) for the Itqan education platform. Provides course browsing, video learning with bookmarks/transcripts, student dashboard, instructor tools, admin panel, payments, and bilingual (EN/AR) support with RTL.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | Dependencies and scripts (Next.js 16, React 19, Tailwind CSS 4, Radix UI) |
| `next.config.ts` | Next.js config — standalone output, next-intl plugin |
| `tsconfig.json` | TypeScript configuration |
| `postcss.config.mjs` | PostCSS with Tailwind CSS plugin |
| `eslint.config.mjs` | ESLint with eslint-config-next + TS rules |
| `Dockerfile` | Multi-stage build: deps, development, builder, production |
| `components.json` | shadcn/ui component configuration |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | Application source code (see `src/AGENTS.md`) |
| `messages/` | i18n translation files EN/AR (see `messages/AGENTS.md`) |
| `scripts/` | Build/generation scripts (see `scripts/AGENTS.md`) |
| `public/` | Static assets (SVGs, avatars) |

## For AI Agents

### Working In This Directory
- Run `npm install` then `npm run dev` to start dev server on `:3000`
- After backend API changes: `npm run generate-api` (backend must be running on `:8080`)
- Do **not** hand-edit files in `src/lib/api/` — they are auto-generated
- Components use PascalCase, variables/functions use camelCase
- Route folders use lowercase/kebab-case

### Testing Requirements
- Run `npm run lint` for ESLint checks and `npm run typecheck` for TypeScript
- Run `npm run test:run` for unit tests (Vitest + Testing Library; files in `src/**/__tests__/*.test.ts(x)`)
- Run `npm run build` for production build verification
- Run `npm run test:e2e` for the Playwright smoke tests in `e2e/` (needs a running backend and frontend;
  see the root AGENTS.md for the required env vars)

### Common Patterns
- App Router with route groups: `(auth)` for auth pages, `[locale]` for i18n
- Radix UI primitives wrapped as shadcn/ui components in `src/components/ui/`
- Form validation with Zod + react-hook-form
- Auth state managed via React Context (`auth-context.tsx`)
- API calls through Axios with JWT interceptors (`api-axios.ts`)
- Tailwind CSS 4 with design tokens in `src/styles/landing-theme.json`

## Dependencies

### Internal
- Consumes backend REST API (auto-generated client in `src/lib/api/`)
- Backend must be running for `generate-api` script

### External
- Next.js 16.1.1, React 19.2.3, TypeScript
- Tailwind CSS 4, @tailwindcss/postcss
- Radix UI (avatar, checkbox, dropdown-menu, label, progress, separator, slot, tooltip)
- lucide-react 0.562.0 (icons)
- next-intl 4.7.0 (i18n)
- react-hook-form 7.71.0, zod 4.3.5 (forms)
- clsx, class-variance-authority, tailwind-merge (styling utilities)
- openapi-typescript-codegen 0.30.0 (API client generation)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
