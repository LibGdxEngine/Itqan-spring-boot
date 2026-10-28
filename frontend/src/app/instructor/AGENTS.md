<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-10-28 -->

# instructor

## Purpose
Instructor studio: build courses (drafts → publish), arrange the curriculum, write lessons and quizzes, and track enrollments, progress and revenue. Admins can use every page too.

## Key Files

| File | Description |
|------|-------------|
| `page.tsx` | Studio home — the caller's courses with status, students, 30-day KPIs |
| `courses/new/page.tsx` | Create a course (saved as a private draft) |
| `courses/[courseId]/layout.tsx` | Loads the course once, header with Publish/Unpublish, tabs; provides `useCourseStudio()` |
| `courses/[courseId]/lessons/page.tsx` | Curriculum board — drag and drop sections and lessons (`@dnd-kit`), lesson dialog |
| `courses/[courseId]/lessons/[lessonId]/quiz/page.tsx` | Quiz builder for a QUIZ lesson |
| `courses/[courseId]/settings/page.tsx` | Course details form (pricing, category, outcomes, requirements) |
| `courses/[courseId]/analytics/page.tsx` | Lesson-completion funnel and quiz results |
| `analytics/page.tsx` | Analytics across all the caller's courses |
| `coupons/page.tsx` | Coupon manager |
| `articles/` | Article editor |

## For AI Agents

### Working In This Directory
- Pages wrap content in `StudioShell` (`components/studio/StudioShell.tsx`), which guards INSTRUCTOR/ADMIN
- API calls go through `lib/studio-api.ts` (hand-written; the generated client predates these endpoints)
- Curriculum order is saved in one call: `PUT /api/courses/{id}/curriculum`
- Lesson types: VIDEO, TEXT (Markdown article), RESOURCE (uploaded file or link), QUIZ
- Video upload uses multipart flow: initiate → upload parts → complete

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
