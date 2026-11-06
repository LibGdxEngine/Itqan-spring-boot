<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# payments

## Purpose
Payment processing via Stripe — checkout sessions, webhook handling, coupon/discount management, and enrollment code generation.

## Key Files

| File | Description |
|------|-------------|
| `PaymentController.java` | Create checkout session, check payment status, Stripe webhook receiver |
| `CouponController.java` | Coupon CRUD — create, list, validate, redeem |
| `PaymentService.java` | Payment processing, order creation, webhook event handling, enrollment creation on success |
| `CouponService.java` | Coupon creation, validation, redemption tracking |
| `EnrollmentCodeService.java` | Direct enrollment code generation and validation (bypass payment) |
| `Payment.java` | JPA entity — studentId, courseId, amounts, status, Stripe session/intent IDs, couponId |
| `Coupon.java` | JPA entity — code, courseId, discountPercent, usageLimit, usedCount, expiresAt |
| `CouponRedemption.java` | JPA entity — couponId, studentId, paymentId, status |
| `EnrollmentCode.java` | JPA entity — code, courseId, usageLimit, usedCount, expiresAt |
| `ProcessedStripeEvent.java` | JPA entity — eventId for webhook idempotency |
| `PaymentStatus.java` | Enum — PENDING, COMPLETED, FAILED, REFUNDED |
| `CouponRedemptionStatus.java` | Enum — PENDING, CONFIRMED, FAILED |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `dto/` | Checkout session, payment response, coupon request/response, pricing DTOs |
| `stripe/` | StripeGateway interface and StripeGatewayImpl — Stripe API abstraction |
| `paymob/` | Paymob gateway and callback — now used by scholarship donations |
| `easykash/` | EasyKash Direct Pay for course payments — gateway, signed callback (`/api/payments/webhook/easykash`), inquiry-based reconciliation |

## For AI Agents

### Working In This Directory
- Stripe integration uses the Gateway pattern (`StripeGateway` interface) for testability
- Webhook handler uses `ProcessedStripeEvent` for idempotency — never process same event twice
- Successful payment triggers enrollment creation via `EnrollmentService`
- Coupons support percentage discounts with usage limits and expiration
- Enrollment codes allow direct course access without payment

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
