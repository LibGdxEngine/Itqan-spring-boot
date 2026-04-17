<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# instructor

## Purpose
Instructor-facing form components for course creation, lesson management, and coupon administration.

## Key Files

| File | Description |
|------|-------------|
| `CourseCreatorForm.tsx` | Form to create/edit courses — title, description, price, level, category, thumbnail |
| `LessonCreatorForm.tsx` | Form to create/edit lessons — title, type, video upload with multipart progress |
| `CouponManager.tsx` | Coupon management — create coupons with discount %, usage limits, expiration |

## For AI Agents

### Working In This Directory
- Forms use react-hook-form + Zod validation
- Video upload in LessonCreatorForm uses multipart S3 upload service
- CouponManager handles both creation and listing of existing coupons
- All forms require INSTRUCTOR role authentication

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
