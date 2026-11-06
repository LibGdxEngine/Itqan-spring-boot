package com.itqan.edu.features.payments;

import com.itqan.edu.common.config.StripeProperties;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.Enrollment;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.payments.dto.CheckoutMode;
import com.itqan.edu.features.payments.dto.CheckoutSessionStatusResponse;
import com.itqan.edu.features.payments.dto.CreateCheckoutSessionRequest;
import com.itqan.edu.features.payments.dto.CreateCheckoutSessionResponse;
import com.itqan.edu.features.payments.dto.PaymentResponse;
import com.itqan.edu.features.payments.stripe.StripeCheckoutSessionRequest;
import com.itqan.edu.features.payments.stripe.StripeCheckoutSessionResult;
import com.itqan.edu.features.audit.AuditLogService;
import com.itqan.edu.features.payments.stripe.StripeGateway;
import com.itqan.edu.features.payments.stripe.StripeWebhookEvent;
import com.itqan.edu.features.payments.paymob.PaymobCheckout;
import com.itqan.edu.features.payments.paymob.PaymobGateway;
import com.itqan.edu.features.payments.paymob.PaymobIntentionRequest;
import com.itqan.edu.features.payments.paymob.PaymobOutcome;
import com.itqan.edu.features.payments.paymob.PaymobProperties;
import com.itqan.edu.features.payments.paymob.PaymobWebhookService;
import com.itqan.edu.features.payments.dto.CouponPricingResponse;
import com.itqan.edu.features.payments.easykash.EasyKashGateway;
import com.itqan.edu.features.payments.easykash.EasyKashMobile;
import com.itqan.edu.features.payments.easykash.EasyKashPayRequest;
import com.itqan.edu.features.payments.easykash.EasyKashProperties;
import com.itqan.edu.features.payments.easykash.EasyKashResult;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    public static final String EASYKASH_GATEWAY = "EASYKASH";

    private final PaymentRepository paymentRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CouponService couponService;
    private final CouponRepository couponRepository;
    private final CouponRedemptionRepository couponRedemptionRepository;
    private final ProcessedStripeEventRepository processedStripeEventRepository;
    private final StripeGateway stripeGateway;
    private final StripeProperties stripeProperties;
    private final AuditLogService auditLogService;
    private final PaymobGateway paymobGateway;
    private final PaymobProperties paymobProperties;
    private final EasyKashGateway easyKashGateway;
    private final EasyKashProperties easyKashProperties;

    @Transactional
    public CreateCheckoutSessionResponse createCheckoutSession(CreateCheckoutSessionRequest request, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, course.getId())) {
            throw new BusinessException(ErrorCode.ENROLLMENT_ALREADY_EXISTS);
        }

        if (paymentRepository.hasCompletedPayment(studentId, course.getId())) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_PROCESSED);
        }

        if (paymentRepository.existsByStudentIdAndCourseIdAndStatus(studentId, course.getId(), PaymentStatus.PENDING)) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_PROCESSED, "There is already a pending checkout for this course");
        }

        CouponService.CouponValidationResult couponValidation = couponService.validateForCheckout(
                course.getId(),
                request.getCouponCode(),
                studentId);

        Coupon coupon = couponValidation.getCoupon();
        var pricing = couponValidation.getPricing();

        Payment payment = Payment.builder()
                .student(student)
                .course(course)
                .amount(pricing.getFinalAmount())
                .originalAmount(pricing.getOriginalAmount())
                .discountAmount(pricing.getDiscountAmount())
                .currency(stripeProperties.getCurrency().toUpperCase())
                .status(PaymentStatus.PENDING)
                .paymentGateway("STRIPE")
                .paymentMethod("STRIPE_CHECKOUT")
                .coupon(coupon)
                .build();
        payment = paymentRepository.save(payment);

        if (Boolean.TRUE.equals(pricing.getFree())) {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setCompletedAt(LocalDateTime.now());
            payment.setNotes("Completed by 100% coupon or free price");
            paymentRepository.save(payment);

            Enrollment enrollment = enrollIfNeeded(student, course);
            if (coupon != null) {
                markCouponAsRedeemed(payment, null);
            }

            auditLogService.recordSuccess("PAYMENT_COMPLETED", "PAYMENT", String.valueOf(payment.getId()),
                    Map.of("amount", payment.getAmount(), "currency", payment.getCurrency(),
                            "studentId", payment.getStudent().getId()));

            return CreateCheckoutSessionResponse.builder()
                    .mode(CheckoutMode.FREE_ENROLLED)
                    .paymentId(payment.getId())
                    .enrollmentId(enrollment != null ? enrollment.getId() : null)
                    .pricing(pricing)
                    .build();
        }

        Map<String, String> metadata = new HashMap<>();
        metadata.put("paymentId", String.valueOf(payment.getId()));
        metadata.put("courseId", String.valueOf(course.getId()));
        metadata.put("studentId", String.valueOf(student.getId()));
        if (coupon != null) {
            metadata.put("couponId", String.valueOf(coupon.getId()));
        }

        StripeCheckoutSessionResult session = stripeGateway.createCheckoutSession(
                StripeCheckoutSessionRequest.builder()
                        .amountInCents(toMinorUnit(pricing.getFinalAmount()))
                        .currency(stripeProperties.getCurrency())
                        .productName(course.getTitle())
                        .successUrl(withSessionParam(stripeProperties.getSuccessUrl()))
                        .cancelUrl(withSessionParam(stripeProperties.getCancelUrl()))
                        .metadata(metadata)
                        .build());

        payment.setStripeCheckoutSessionId(session.getSessionId());
        paymentRepository.save(payment);

        if (coupon != null) {
            couponRedemptionRepository.save(CouponRedemption.builder()
                    .coupon(coupon)
                    .student(student)
                    .payment(payment)
                    .status(CouponRedemptionStatus.RESERVED)
                    .stripeCheckoutSessionId(session.getSessionId())
                    .build());
        }

        return CreateCheckoutSessionResponse.builder()
                .mode(CheckoutMode.REDIRECT)
                .checkoutUrl(session.getCheckoutUrl())
                .sessionId(session.getSessionId())
                .paymentId(payment.getId())
                .pricing(pricing)
                .build();
    }

    @Transactional
    public void processStripeWebhook(String payload, String signatureHeader) {
        StripeWebhookEvent event = stripeGateway.parseWebhookEvent(payload, signatureHeader);
        if (processedStripeEventRepository.existsByEventId(event.getEventId())) {
            return;
        }

        String eventType = event.getEventType();
        if ("checkout.session.completed".equals(eventType)) {
            processCompletedSession(event);
        } else if ("checkout.session.expired".equals(eventType)) {
            processExpiredSession(event);
        } else if ("charge.refunded".equals(eventType)) {
            processRefundedCharge(event);
        }

        processedStripeEventRepository.save(ProcessedStripeEvent.builder()
                .eventId(event.getEventId())
                .eventType(eventType)
                .processedAt(LocalDateTime.now())
                .build());
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentHistory(Long studentId) {
        return paymentRepository.findHistoryForStudent(studentId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CheckoutSessionStatusResponse getCheckoutSessionStatus(String sessionId, Long studentId) {
        Payment payment = paymentRepository.findByStripeCheckoutSessionId(sessionId)
                .or(() -> paymentRepository.findByGatewayReference(sessionId))
                .orElseThrow(() -> new BusinessException(ErrorCode.CHECKOUT_SESSION_NOT_FOUND));
        if (!payment.getStudent().getId().equals(studentId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        return CheckoutSessionStatusResponse.builder()
                .sessionId(sessionId)
                .status(payment.getStatus())
                .paymentId(payment.getId())
                .courseId(payment.getCourse().getId())
                .build();
    }

    /**
     * Starts a Paymob checkout for a course. Same checks and coupon handling as the Stripe flow;
     * free (or 100%-coupon) purchases enroll at once without a redirect.
     */
    @Transactional
    public CreateCheckoutSessionResponse createPaymobCheckout(CreateCheckoutSessionRequest request, Long studentId) {
        if (!paymobProperties.isConfigured()) {
            throw new BusinessException(ErrorCode.ONLINE_PAYMENT_DISABLED);
        }
        HostedCheckout started = openHostedPayment(request, studentId, "PAYMOB", "PAYMOB_CHECKOUT",
                paymobProperties.getCurrency());
        Payment payment = started.payment();
        Student student = started.student();
        Course course = started.course();
        var pricing = started.pricing();
        if (Boolean.TRUE.equals(pricing.getFree())) {
            return completeFreePayment(started);
        }

        String reference = PaymobWebhookService.PAYMENT_PREFIX + payment.getId() + "-"
                + java.util.UUID.randomUUID().toString().substring(0, 8);
        payment.setGatewayReference(reference);
        paymentRepository.save(payment);

        String origin = paymobProperties.publicOrigin();
        PaymobCheckout checkout = paymobGateway.createIntention(PaymobIntentionRequest.builder()
                .amountCents(toMinorUnit(pricing.getFinalAmount()))
                .currency(paymobProperties.getCurrency().toUpperCase())
                .itemName(course.getTitle())
                .reference(reference)
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .email(student.getEmail())
                .phone(student.getPhoneNumber())
                .redirectionUrl(origin + "/courses/success?session_id=" + reference)
                .notificationUrl(origin + "/api/payments/webhook/paymob")
                .build());

        reserveCoupon(started);

        return CreateCheckoutSessionResponse.builder()
                .mode(CheckoutMode.REDIRECT)
                .checkoutUrl(checkout.checkoutUrl())
                .sessionId(reference)
                .paymentId(payment.getId())
                .pricing(pricing)
                .build();
    }

    /** Applies a verified Paymob callback to the course payment it refers to. */
    @Transactional
    public void applyPaymobTransaction(String reference, String transactionId, PaymobOutcome outcome) {
        Payment payment = paymentRepository.findByGatewayReference(reference).orElse(null);
        if (payment == null) {
            log.warn("Paymob callback for unknown payment reference {}", reference);
            return;
        }
        switch (outcome) {
            case PAID -> {
                if (payment.getStatus() == PaymentStatus.COMPLETED) {
                    return;
                }
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setCompletedAt(LocalDateTime.now());
                payment.setTransactionId(transactionId);
                paymentRepository.save(payment);
                enrollIfNeeded(payment.getStudent(), payment.getCourse());
                if (payment.getCoupon() != null) {
                    markCouponAsRedeemed(payment, null);
                }
                auditLogService.recordSuccess("PAYMENT_COMPLETED", "PAYMENT", String.valueOf(payment.getId()),
                        Map.of("amount", payment.getAmount(), "currency", payment.getCurrency(),
                                "studentId", payment.getStudent().getId(), "gateway", "PAYMOB"));
            }
            case FAILED -> {
                if (payment.getStatus() == PaymentStatus.PENDING) {
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setNotes("Paymob transaction " + transactionId + " failed");
                    paymentRepository.save(payment);
                    releaseReservedCoupon(payment);
                    auditLogService.recordFailure("PAYMENT_FAILED", "PAYMENT", String.valueOf(payment.getId()),
                            "Paymob transaction failed");
                }
            }
            case REFUNDED -> {
                if (payment.getStatus() == PaymentStatus.REFUNDED) {
                    return;
                }
                payment.setStatus(PaymentStatus.REFUNDED);
                paymentRepository.save(payment);
                enrollmentRepository.findByStudentIdAndCourseId(payment.getStudent().getId(), payment.getCourse().getId())
                        .ifPresent(enrollment -> {
                            enrollment.setStatus(EnrollmentStatus.DROPPED);
                            enrollmentRepository.save(enrollment);
                        });
                auditLogService.recordSuccess("PAYMENT_REFUNDED", "PAYMENT", String.valueOf(payment.getId()),
                        Map.of("source", "paymob-callback"));
            }
            default -> {
            }
        }
    }

    /**
     * Starts an EasyKash Direct Pay checkout for a course. Free (or 100%-coupon) purchases enroll at
     * once without a redirect. EasyKash requires a mobile number, which students may not have on file.
     */
    @Transactional
    public CreateCheckoutSessionResponse createEasyKashCheckout(CreateCheckoutSessionRequest request, Long studentId) {
        if (!easyKashProperties.isConfigured()) {
            throw new BusinessException(ErrorCode.ONLINE_PAYMENT_DISABLED);
        }
        HostedCheckout started = openHostedPayment(request, studentId, EASYKASH_GATEWAY, "EASYKASH_CHECKOUT",
                easyKashProperties.getCurrency());
        Payment payment = started.payment();
        Student student = started.student();
        var pricing = started.pricing();
        if (Boolean.TRUE.equals(pricing.getFree())) {
            return completeFreePayment(started);
        }

        String mobile = EasyKashMobile.normalize(request.getPhone() != null ? request.getPhone() : student.getPhoneNumber());
        if (mobile == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "A valid mobile number is required");
        }

        // Letters and digits only, and no query on the redirect URL: EasyKash appends its own
        // "?status=...&customerReference=..." to it, which is how the return page finds this payment.
        String reference = "ITQ" + payment.getId() + "X"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        payment.setGatewayReference(reference);
        paymentRepository.save(payment);

        String checkoutUrl = easyKashGateway.createPayLink(new EasyKashPayRequest(
                BigDecimal.valueOf(pricing.getFinalAmount()).setScale(2, RoundingMode.HALF_UP),
                payment.getCurrency(),
                (student.getFirstName() + " " + student.getLastName()).trim(),
                student.getEmail(),
                mobile,
                easyKashProperties.publicOrigin() + "/courses/success",
                reference));

        reserveCoupon(started);

        return CreateCheckoutSessionResponse.builder()
                .mode(CheckoutMode.REDIRECT)
                .checkoutUrl(checkoutUrl)
                .sessionId(reference)
                .paymentId(payment.getId())
                .pricing(pricing)
                .build();
    }

    /**
     * Applies what EasyKash reports about a payment. Money received always wins: a voucher paid after
     * the student started a newer attempt still enrolls them. A replay after a refund does not.
     */
    @Transactional
    public void applyEasyKashResult(String reference, EasyKashResult result) {
        Payment payment = paymentRepository.findLockedByGatewayReference(reference)
                .filter(p -> EASYKASH_GATEWAY.equals(p.getPaymentGateway()))
                .orElse(null);
        if (payment == null) {
            // Other sales on the same EasyKash account also reach the callback URL.
            log.warn("EasyKash result for unknown payment reference '{}'", reference);
            return;
        }
        switch (result.outcome()) {
            case PAID -> {
                if (payment.getStatus() == PaymentStatus.COMPLETED || payment.getStatus() == PaymentStatus.REFUNDED) {
                    return;
                }
                warnIfUnderpaid(payment, result.amount());
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setCompletedAt(LocalDateTime.now());
                if (!result.easykashRef().isBlank()) {
                    payment.setTransactionId(result.easykashRef());
                }
                if (!result.paymentMethod().isBlank()) {
                    payment.setPaymentMethod(result.paymentMethod());
                }
                payment.setNotes("EasyKash reported amount: " + result.amount());
                paymentRepository.save(payment);
                enrollIfNeeded(payment.getStudent(), payment.getCourse());
                if (payment.getCoupon() != null) {
                    markCouponAsRedeemed(payment, null);
                }
                auditLogService.recordSuccess("PAYMENT_COMPLETED", "PAYMENT", String.valueOf(payment.getId()),
                        Map.of("amount", payment.getAmount(), "currency", payment.getCurrency(),
                                "studentId", payment.getStudent().getId(), "gateway", EASYKASH_GATEWAY));
            }
            case FAILED -> {
                if (payment.getStatus() == PaymentStatus.PENDING) {
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setNotes("EasyKash reported the payment as not completed");
                    paymentRepository.save(payment);
                    releaseReservedCoupon(payment);
                    auditLogService.recordFailure("PAYMENT_FAILED", "PAYMENT", String.valueOf(payment.getId()),
                            "EasyKash payment not completed");
                }
            }
            case PENDING -> {
            }
        }
    }

    /** Closes an attempt EasyKash never reported on, past the voucher lifetime, and frees its coupon. */
    @Transactional
    public void abandonEasyKashPayment(String reference) {
        paymentRepository.findLockedByGatewayReference(reference)
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.CANCELLED);
                    payment.setNotes("Abandoned: no payment reported by EasyKash");
                    paymentRepository.save(payment);
                    releaseReservedCoupon(payment);
                });
    }

    /**
     * Logged rather than refused: the callback is signed and the amount was set server-side, so the
     * buyer can't change it, while fee settings on the EasyKash account can legitimately alter it.
     */
    private void warnIfUnderpaid(Payment payment, String reported) {
        if (!"EGP".equalsIgnoreCase(payment.getCurrency())) {
            return; // EasyKash reports EGP; other currencies aren't comparable without the exchange rate.
        }
        try {
            if (new BigDecimal(reported).compareTo(BigDecimal.valueOf(payment.getAmount())) < 0) {
                log.warn("EasyKash reported {} for payment {} which costs {}", reported, payment.getId(), payment.getAmount());
            }
        } catch (NumberFormatException e) {
            log.warn("EasyKash reported a non-numeric amount for payment {}", payment.getId());
        }
    }

    /** What a Paymob or EasyKash checkout needs once the shared checks have passed. */
    private record HostedCheckout(Student student, Course course, Coupon coupon, CouponPricingResponse pricing,
                                  Payment payment) {
    }

    private HostedCheckout openHostedPayment(CreateCheckoutSessionRequest request, Long studentId, String gateway,
                                             String method, String currency) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (enrollmentRepository.findByStudentIdAndCourseId(studentId, course.getId())
                .filter(e -> e.getStatus() != EnrollmentStatus.DROPPED).isPresent()) {
            throw new BusinessException(ErrorCode.ENROLLMENT_ALREADY_EXISTS);
        }
        // A student who abandoned an earlier payment page can start again: the old attempt is cancelled.
        paymentRepository.findByStudentIdAndCourseIdAndStatus(studentId, course.getId(), PaymentStatus.PENDING)
                .forEach(this::cancelPendingAttempt);

        CouponService.CouponValidationResult couponValidation = couponService.validateForCheckout(
                course.getId(), request.getCouponCode(), studentId);
        Coupon coupon = couponValidation.getCoupon();
        CouponPricingResponse pricing = couponValidation.getPricing();

        Payment payment = paymentRepository.save(Payment.builder()
                .student(student)
                .course(course)
                .amount(pricing.getFinalAmount())
                .originalAmount(pricing.getOriginalAmount())
                .discountAmount(pricing.getDiscountAmount())
                .currency(currency.toUpperCase(Locale.ROOT))
                .status(PaymentStatus.PENDING)
                .paymentGateway(gateway)
                .paymentMethod(method)
                .coupon(coupon)
                .build());
        return new HostedCheckout(student, course, coupon, pricing, payment);
    }

    private CreateCheckoutSessionResponse completeFreePayment(HostedCheckout started) {
        Payment payment = started.payment();
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setCompletedAt(LocalDateTime.now());
        payment.setNotes("Completed by 100% coupon or free price");
        paymentRepository.save(payment);
        Enrollment enrollment = enrollIfNeeded(started.student(), started.course());
        if (started.coupon() != null) {
            markCouponAsRedeemed(payment, null);
        }
        auditLogService.recordSuccess("PAYMENT_COMPLETED", "PAYMENT", String.valueOf(payment.getId()),
                Map.of("amount", payment.getAmount(), "currency", payment.getCurrency(),
                        "studentId", started.student().getId()));
        return CreateCheckoutSessionResponse.builder()
                .mode(CheckoutMode.FREE_ENROLLED)
                .paymentId(payment.getId())
                .enrollmentId(enrollment != null ? enrollment.getId() : null)
                .pricing(started.pricing())
                .build();
    }

    private void reserveCoupon(HostedCheckout started) {
        if (started.coupon() != null) {
            couponRedemptionRepository.save(CouponRedemption.builder()
                    .coupon(started.coupon())
                    .student(started.student())
                    .payment(started.payment())
                    .status(CouponRedemptionStatus.RESERVED)
                    .build());
        }
    }

    private void cancelPendingAttempt(Payment pending) {
        pending.setStatus(PaymentStatus.CANCELLED);
        pending.setNotes("Replaced by a new checkout attempt");
        paymentRepository.save(pending);
        releaseReservedCoupon(pending);
    }

    private void releaseReservedCoupon(Payment payment) {
        couponRedemptionRepository.findByPaymentId(payment.getId())
                .filter(r -> r.getStatus() == CouponRedemptionStatus.RESERVED)
                .ifPresent(r -> {
                    r.setStatus(CouponRedemptionStatus.RELEASED);
                    couponRedemptionRepository.save(r);
                });
    }

    private void processCompletedSession(StripeWebhookEvent event) {
        if (event.getCheckoutSessionId() == null) {
            return;
        }

        Payment payment = paymentRepository.findByStripeCheckoutSessionId(event.getCheckoutSessionId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CHECKOUT_SESSION_NOT_FOUND));

        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            return;
        }

        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setCompletedAt(LocalDateTime.now());
        payment.setStripePaymentIntentId(event.getPaymentIntentId());
        payment.setTransactionId(event.getPaymentIntentId());
        paymentRepository.save(payment);

        enrollIfNeeded(payment.getStudent(), payment.getCourse());
        if (payment.getCoupon() != null) {
            markCouponAsRedeemed(payment, event.getCheckoutSessionId());
        }

        auditLogService.recordSuccess("PAYMENT_COMPLETED", "PAYMENT", String.valueOf(payment.getId()),
                Map.of("amount", payment.getAmount(), "currency", payment.getCurrency(),
                        "studentId", payment.getStudent().getId()));

        log.info("Stripe checkout completed for payment {}", payment.getId());
    }

    private void processExpiredSession(StripeWebhookEvent event) {
        if (event.getCheckoutSessionId() == null) {
            return;
        }

        Payment payment = paymentRepository.findByStripeCheckoutSessionId(event.getCheckoutSessionId()).orElse(null);
        if (payment == null) {
            return;
        }

        if (payment.getStatus() == PaymentStatus.PENDING) {
            payment.setStatus(PaymentStatus.CANCELLED);
            payment.setNotes("Stripe checkout session expired");
            paymentRepository.save(payment);
            auditLogService.recordFailure("PAYMENT_FAILED", "PAYMENT", String.valueOf(payment.getId()),
                    "Stripe checkout session expired");
        }

        couponRedemptionRepository.findByStripeCheckoutSessionId(event.getCheckoutSessionId())
                .filter(redemption -> redemption.getStatus() == CouponRedemptionStatus.RESERVED)
                .ifPresent(redemption -> {
                    redemption.setStatus(CouponRedemptionStatus.RELEASED);
                    couponRedemptionRepository.save(redemption);
                });
    }

    private void markCouponAsRedeemed(Payment payment, String sessionId) {
        Coupon coupon = payment.getCoupon();
        CouponRedemption redemption = sessionId != null
                ? couponRedemptionRepository.findByStripeCheckoutSessionId(sessionId).orElse(null)
                : couponRedemptionRepository.findByPaymentId(payment.getId()).orElse(null);

        boolean shouldIncrementUsage = false;
        if (redemption == null) {
            redemption = CouponRedemption.builder()
                    .coupon(coupon)
                    .student(payment.getStudent())
                    .payment(payment)
                    .status(CouponRedemptionStatus.REDEEMED)
                    .stripeCheckoutSessionId(sessionId)
                    .build();
            shouldIncrementUsage = true;
        } else if (redemption.getStatus() != CouponRedemptionStatus.REDEEMED) {
            redemption.setStatus(CouponRedemptionStatus.REDEEMED);
            redemption.setPayment(payment);
            shouldIncrementUsage = true;
        }

        if (shouldIncrementUsage) {
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }

        couponRedemptionRepository.save(redemption);
    }

    /** Refunds issued from the Stripe dashboard (or confirmed for admin-initiated ones) revoke access. */
    private void processRefundedCharge(StripeWebhookEvent event) {
        if (event.getPaymentIntentId() == null) {
            return;
        }
        paymentRepository.findFirstByStripePaymentIntentId(event.getPaymentIntentId()).ifPresent(payment -> {
            if (payment.getStatus() == PaymentStatus.REFUNDED) {
                return;
            }
            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
            enrollmentRepository.findByStudentIdAndCourseId(payment.getStudent().getId(), payment.getCourse().getId())
                    .ifPresent(enrollment -> {
                        enrollment.setStatus(EnrollmentStatus.DROPPED);
                        enrollmentRepository.save(enrollment);
                    });
            auditLogService.recordSuccess("PAYMENT_REFUNDED", "PAYMENT", String.valueOf(payment.getId()),
                    Map.of("source", "stripe-webhook"));
        });
    }

    private Enrollment enrollIfNeeded(Student student, Course course) {
        return enrollmentRepository.findByStudentIdAndCourseId(student.getId(), course.getId())
                .map(existing -> {
                    if (existing.getStatus() == EnrollmentStatus.DROPPED) {
                        existing.setStatus(EnrollmentStatus.ACTIVE);
                        return enrollmentRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> enrollmentRepository.save(Enrollment.builder()
                        .student(student)
                        .course(course)
                        .status(EnrollmentStatus.ACTIVE)
                        .progress(0)
                        .build()));
    }

    private PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .courseId(payment.getCourse().getId())
                .courseTitle(payment.getCourse().getTitle())
                .amount(payment.getAmount())
                .originalAmount(payment.getOriginalAmount())
                .discountAmount(payment.getDiscountAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .paymentGateway(payment.getPaymentGateway())
                .transactionId(payment.getTransactionId())
                .couponCode(payment.getCoupon() != null ? payment.getCoupon().getCode() : null)
                .checkoutSessionId(payment.getStripeCheckoutSessionId())
                .createdAt(payment.getCreatedAt())
                .completedAt(payment.getCompletedAt())
                .build();
    }

    private Long toMinorUnit(Double amount) {
        return Math.round(amount * 100);
    }

    private String withSessionParam(String url) {
        if (url.contains("{CHECKOUT_SESSION_ID}") || url.contains("session_id=")) {
            return url;
        }
        String separator = url.contains("?") ? "&" : "?";
        return url + separator + "session_id={CHECKOUT_SESSION_ID}";
    }
}
