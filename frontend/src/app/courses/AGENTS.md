<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# courses

## Purpose
Course browsing and enrollment routes — public course listing, course details with curriculum, and payment result pages.

## Key Files

| File | Description |
|------|-------------|
| `page.tsx` | Course listing — browse all active courses with filtering |
| `[id]/page.tsx` | Course detail — description, curriculum, instructor info, enroll/pay button |
| `[id]/layout.tsx` | Course detail layout |
| `success/page.tsx` | Payment success page — shown after Stripe checkout completion |
| `cancel/page.tsx` | Payment cancellation page — shown when user cancels Stripe checkout |

## For AI Agents

### Working In This Directory
- Course listing is public; enrollment requires authentication
- `[id]` is a dynamic route segment for course ID
- Success/cancel pages are Stripe redirect targets configured via `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL`
- Uses `CourseCard`, `CourseCurriculum`, and `EnrollButton` components

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
