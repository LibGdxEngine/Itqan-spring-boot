<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# courses

## Purpose
Course-related display and interaction components used across course listing, detail, and dashboard pages.

## Key Files

| File | Description |
|------|-------------|
| `CourseCard.tsx` | Course preview card — thumbnail, title, level badge, price, instructor |
| `EnrolledCourseCard.tsx` | Card for enrolled courses — includes progress bar and continue button |
| `CourseCurriculum.tsx` | Expandable course curriculum — modules and lessons tree view |
| `EnrollButton.tsx` | Enrollment trigger — handles free enroll or Stripe checkout redirect |

## For AI Agents

### Working In This Directory
- `CourseCard` is used on the public courses listing page
- `EnrolledCourseCard` is used on the student dashboard and my-courses pages
- `EnrollButton` handles both free and paid enrollment flows
- Components consume data from the generated API models (CourseResponse, EnrollmentResponse)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
