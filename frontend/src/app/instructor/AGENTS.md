<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# instructor

## Purpose
Instructor dashboard and course management tools — create/edit courses, manage lessons, upload videos.

## Key Files

| File | Description |
|------|-------------|
| `page.tsx` | Instructor dashboard — list of instructor's courses with management actions |
| `courses/[courseId]/lessons/page.tsx` | Lesson management — add/edit/reorder lessons, upload videos, manage coupons |

## For AI Agents

### Working In This Directory
- Requires INSTRUCTOR role authentication
- Uses CourseCreatorForm, LessonCreatorForm, CouponManager components
- Video upload uses multipart flow: initiate → upload parts → complete
- Deeply nested route: `/instructor/courses/[courseId]/lessons`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
