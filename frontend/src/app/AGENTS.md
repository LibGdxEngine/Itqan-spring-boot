<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# app

## Purpose
Next.js App Router pages, layouts, and route handlers. Defines all application routes using file-system routing with route groups, dynamic segments, and catch-all patterns.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | Root layout — next-intl provider, auth context, toast provider, font imports |
| `page.tsx` | Homepage — hero section, stats, features, CTA |
| `globals.css` | Global CSS styles and Tailwind directives |
| `favicon.ico` | Site favicon |
| `robots.ts` | SEO robots.txt configuration |
| `sitemap.ts` | Dynamic sitemap generation |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `(auth)/` | Auth route group — login, register, forgot/reset password (see `(auth)/AGENTS.md`) |
| `courses/` | Course browsing, details, payment success/cancel (see `courses/AGENTS.md`) |
| `learn/` | Learning interface — video player, lesson navigation (see `learn/AGENTS.md`) |
| `dashboard/` | Student dashboard — enrolled courses, payments overview |
| `my-courses/` | Student's enrolled courses listing |
| `profile/` | User profile management |
| `instructor/` | Instructor tools — course and lesson management (see `instructor/AGENTS.md`) |
| `instructors/` | Public instructors listing page |
| `admin/` | Admin dashboard — students, courses, admin management |
| `[locale]/` | Locale-specific routes (video demo) |

## For AI Agents

### Working In This Directory
- Each route folder contains `page.tsx` (required) and optionally `layout.tsx`, `loading.tsx`
- Route groups `(auth)` don't create URL segments
- Dynamic routes use `[param]` syntax (e.g., `[id]`, `[courseId]`, `[lessonId]`)
- Use `useTranslations` hook for all user-facing strings
- Protected routes check auth state via `auth-context.tsx`

### Testing Requirements
- Start dev server and manually verify page rendering
- Check both EN and AR locales for new/modified pages
- Verify responsive layout on mobile and desktop

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
