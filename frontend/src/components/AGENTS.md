<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# components

## Purpose
Reusable React components organized by feature domain. Includes a base UI kit (Radix/shadcn primitives), feature-specific components, and shared layout elements.

## Key Files

| File | Description |
|------|-------------|
| `Navbar.tsx` | Fixed top navigation — logo, links, auth menu, language switcher |
| `auth-context.tsx` | React Context for authentication state (login, logout, user info, token management) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `ui/` | Base UI primitives — Button, Input, Card, Dialog, Toast, etc. (see `ui/AGENTS.md`) |
| `courses/` | Course-related components — CourseCard, EnrolledCourseCard, Curriculum, EnrollButton (see `courses/AGENTS.md`) |
| `video/` | Video player, bookmarks, transcript (see `video/AGENTS.md`) |
| `instructor/` | Instructor tools — course/lesson forms, coupon manager (see `instructor/AGENTS.md`) |
| `learning/` | Learning interface — sidebar navigation (see `learning/AGENTS.md`) |
| `icons/` | SVG icon components (social media icons) |

## For AI Agents

### Working In This Directory
- Each component lives in its own file, named in PascalCase
- Use Radix UI primitives from `ui/` as building blocks
- Style with Tailwind CSS utility classes
- Use `clsx` + `tailwind-merge` via `cn()` for conditional classes
- Export shared components via barrel `index.ts` files where they exist
- Use `useTranslations` for any user-facing text

### Common Patterns
- Props interfaces defined above component declaration
- `forwardRef` for components that expose DOM refs
- `class-variance-authority` (cva) for component variants (see Button)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
