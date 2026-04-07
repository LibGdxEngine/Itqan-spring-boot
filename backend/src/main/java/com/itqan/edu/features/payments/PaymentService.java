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
import com.itqan.edu.features.payments.stripe.StripeGateway;
import com.itqan.edu.features.payments.stripe.StripeWebhookEvent;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

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

    private Enrollment enrollIfNeeded(Student student, Course course) {
        return enrollmentRepository.findByStudentIdAndCourseId(student.getId(), course.getId())
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
