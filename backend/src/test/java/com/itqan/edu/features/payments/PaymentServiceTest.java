package com.itqan.edu.features.payments;

import com.itqan.edu.common.config.StripeProperties;
import com.itqan.edu.features.audit.AuditLogService;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.Enrollment;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.payments.stripe.StripeGateway;
import com.itqan.edu.features.payments.stripe.StripeWebhookEvent;
import com.itqan.edu.features.payments.easykash.EasyKashGateway;
import com.itqan.edu.features.payments.easykash.EasyKashProperties;
import com.itqan.edu.features.payments.paymob.PaymobGateway;
import com.itqan.edu.features.payments.paymob.PaymobProperties;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private CouponService couponService;
    @Mock
    private CouponRepository couponRepository;
    @Mock
    private CouponRedemptionRepository couponRedemptionRepository;
    @Mock
    private ProcessedStripeEventRepository processedStripeEventRepository;
    @Mock
    private StripeGateway stripeGateway;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private PaymobGateway paymobGateway;
    @Mock
    private EasyKashGateway easyKashGateway;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        StripeProperties stripeProperties = new StripeProperties();
        stripeProperties.setCurrency("usd");
        stripeProperties.setSuccessUrl("http://localhost:3000/success");
        stripeProperties.setCancelUrl("http://localhost:3000/cancel");
        stripeProperties.setSecretKey("sk_test_dummy");
        stripeProperties.setWebhookSecret("whsec_dummy");

        paymentService = new PaymentService(
                paymentRepository,
                courseRepository,
                studentRepository,
                enrollmentRepository,
                couponService,
                couponRepository,
                couponRedemptionRepository,
                processedStripeEventRepository,
                stripeGateway,
                stripeProperties,
                auditLogService,
                paymobGateway,
                new PaymobProperties(),
                easyKashGateway,
                new EasyKashProperties());
    }

    @Test
    void processStripeWebhook_AlreadyProcessedEvent_SkipsProcessing() {
        StripeWebhookEvent event = StripeWebhookEvent.builder()
                .eventId("evt_1")
                .eventType("checkout.session.completed")
                .checkoutSessionId("cs_1")
                .paymentIntentId("pi_1")
                .build();

        when(stripeGateway.parseWebhookEvent("payload", "sig")).thenReturn(event);
        when(processedStripeEventRepository.existsByEventId("evt_1")).thenReturn(true);

        paymentService.processStripeWebhook("payload", "sig");

        verify(paymentRepository, never()).findByStripeCheckoutSessionId(any());
        verify(processedStripeEventRepository, never()).save(any());
    }

    @Test
    void processStripeWebhook_CompletedSession_MarksPaymentAndEnrollmentAndCoupon() {
        Student student = Student.builder().id(3L).email("student@test.com").firstName("A").lastName("B").active(true).build();
        Course course = Course.builder()
                .id(11L)
                .title("Course")
                .description("Desc")
                .instructor("Instructor")
                .price(100.0)
                .duration(10)
                .level("BEGINNER")
                .category("GENERAL")
                .active(true)
                .build();
        Coupon coupon = Coupon.builder()
                .id(8L)
                .code("SAVE20")
                .course(course)
                .discountPercent(20)
                .usedCount(0)
                .isActive(true)
                .createdByUserId(1L)
                .build();
        Payment payment = Payment.builder()
                .id(20L)
                .student(student)
                .course(course)
                .amount(80.0)
                .originalAmount(100.0)
                .discountAmount(20.0)
                .currency("USD")
                .status(PaymentStatus.PENDING)
                .paymentGateway("STRIPE")
                .paymentMethod("STRIPE_CHECKOUT")
                .stripeCheckoutSessionId("cs_123")
                .coupon(coupon)
                .build();
        CouponRedemption redemption = CouponRedemption.builder()
                .id(30L)
                .coupon(coupon)
                .student(student)
                .payment(payment)
                .stripeCheckoutSessionId("cs_123")
                .status(CouponRedemptionStatus.RESERVED)
                .build();

        StripeWebhookEvent event = StripeWebhookEvent.builder()
                .eventId("evt_123")
                .eventType("checkout.session.completed")
                .checkoutSessionId("cs_123")
                .paymentIntentId("pi_123")
                .build();

        when(stripeGateway.parseWebhookEvent("payload", "sig")).thenReturn(event);
        when(processedStripeEventRepository.existsByEventId("evt_123")).thenReturn(false);
        when(paymentRepository.findByStripeCheckoutSessionId("cs_123")).thenReturn(Optional.of(payment));
        when(enrollmentRepository.findByStudentIdAndCourseId(3L, 11L)).thenReturn(Optional.empty());
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(invocation -> {
            Enrollment enrollment = invocation.getArgument(0);
            enrollment.setId(777L);
            return enrollment;
        });
        when(couponRedemptionRepository.findByStripeCheckoutSessionId("cs_123")).thenReturn(Optional.of(redemption));

        paymentService.processStripeWebhook("payload", "sig");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(payment.getTransactionId()).isEqualTo("pi_123");
        assertThat(redemption.getStatus()).isEqualTo(CouponRedemptionStatus.REDEEMED);
        assertThat(coupon.getUsedCount()).isEqualTo(1);

        verify(paymentRepository, atLeastOnce()).save(payment);
        verify(couponRepository).save(coupon);
        verify(couponRedemptionRepository).save(redemption);
        verify(processedStripeEventRepository).save(any(ProcessedStripeEvent.class));
    }
}
