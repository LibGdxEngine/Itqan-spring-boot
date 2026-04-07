package com.itqan.edu.features.payments;

import com.itqan.edu.common.security.JwtTokenProvider;
import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.payments.stripe.StripeCheckoutSessionResult;
import com.itqan.edu.features.payments.stripe.StripeGateway;
import com.itqan.edu.features.payments.stripe.StripeWebhookEvent;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.*;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class PaymentsAndCouponsIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthRepository authRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CouponRedemptionRepository couponRedemptionRepository;

    @Autowired
    private ProcessedStripeEventRepository processedStripeEventRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private StripeGateway stripeGateway;

    @BeforeEach
    void setUp() {
        processedStripeEventRepository.deleteAll();
        couponRedemptionRepository.deleteAll();
        paymentRepository.deleteAll();
        couponRepository.deleteAll();
        enrollmentRepository.deleteAll();
        courseRepository.deleteAll();
        studentRepository.deleteAll();
        authRepository.deleteAll();
    }

    @Test
    @DisplayName("Checkout with 100% coupon enrolls immediately without Stripe redirect")
    void checkoutWithHundredPercentCoupon_EnrollsImmediately() {
        User instructor = createUser("instructor@test.com", User.Role.INSTRUCTOR);
        User studentUser = createUser("student1@test.com", User.Role.STUDENT);
        Student student = createStudent(studentUser);
        Course course = createCourse(instructor, 200.0);
        Coupon coupon = createCoupon(course, instructor.getId(), "FREE100", 100, 10);

        String token = jwtTokenProvider.generateToken(studentUser);

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/payments/checkout-sessions",
                HttpMethod.POST,
                authEntity(Map.of(
                        "courseId", course.getId(),
                        "couponCode", coupon.getCode()), token),
                Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("mode")).isEqualTo("FREE_ENROLLED");
        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())).isTrue();

        Payment payment = paymentRepository.findByStudentIdAndCourseId(student.getId(), course.getId()).get(0);
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(payment.getAmount()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("Checkout without coupon creates pending payment and Stripe redirect session")
    void checkoutWithoutCoupon_ReturnsRedirectSession() {
        User instructor = createUser("instructor@test.com", User.Role.INSTRUCTOR);
        User studentUser = createUser("student2@test.com", User.Role.STUDENT);
        Student student = createStudent(studentUser);
        Course course = createCourse(instructor, 150.0);

        when(stripeGateway.createCheckoutSession(any())).thenReturn(
                StripeCheckoutSessionResult.builder()
                        .sessionId("cs_test_123")
                        .checkoutUrl("https://checkout.stripe.com/pay/cs_test_123")
                        .build());

        String token = jwtTokenProvider.generateToken(studentUser);
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/payments/checkout-sessions",
                HttpMethod.POST,
                authEntity(Map.of("courseId", course.getId()), token),
                Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("mode")).isEqualTo("REDIRECT");
        assertThat(response.getBody().get("sessionId")).isEqualTo("cs_test_123");

        Payment payment = paymentRepository.findByStripeCheckoutSessionId("cs_test_123").orElseThrow();
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())).isFalse();
    }

    @Test
    @DisplayName("Stripe completed webhook is idempotent and enrolls once")
    void stripeWebhookCompleted_IsIdempotent() {
        User instructor = createUser("instructor@test.com", User.Role.INSTRUCTOR);
        User studentUser = createUser("student3@test.com", User.Role.STUDENT);
        Student student = createStudent(studentUser);
        Course course = createCourse(instructor, 100.0);
        Coupon coupon = createCoupon(course, instructor.getId(), "SAVE50", 50, 5);

        Payment payment = paymentRepository.save(Payment.builder()
                .student(student)
                .course(course)
                .amount(50.0)
                .originalAmount(100.0)
                .discountAmount(50.0)
                .currency("USD")
                .status(PaymentStatus.PENDING)
                .paymentGateway("STRIPE")
                .paymentMethod("STRIPE_CHECKOUT")
                .stripeCheckoutSessionId("cs_webhook_1")
                .coupon(coupon)
                .build());

        couponRedemptionRepository.save(CouponRedemption.builder()
                .coupon(coupon)
                .student(student)
                .payment(payment)
                .status(CouponRedemptionStatus.RESERVED)
                .stripeCheckoutSessionId("cs_webhook_1")
                .build());

        when(stripeGateway.parseWebhookEvent(anyString(), eq("sig_test")))
                .thenReturn(StripeWebhookEvent.builder()
                        .eventId("evt_webhook_1")
                        .eventType("checkout.session.completed")
                        .checkoutSessionId("cs_webhook_1")
                        .paymentIntentId("pi_webhook_1")
                        .build());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Stripe-Signature", "sig_test");
        HttpEntity<String> request = new HttpEntity<>("{\"type\":\"checkout.session.completed\"}", headers);

        ResponseEntity<Map> firstResponse = restTemplate.postForEntity("/api/payments/webhook/stripe", request, Map.class);
        ResponseEntity<Map> secondResponse = restTemplate.postForEntity("/api/payments/webhook/stripe", request, Map.class);

        assertThat(firstResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(secondResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        Payment updatedPayment = paymentRepository.findById(payment.getId()).orElseThrow();
        Coupon updatedCoupon = couponRepository.findById(coupon.getId()).orElseThrow();

        assertThat(updatedPayment.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(updatedCoupon.getUsedCount()).isEqualTo(1);
        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())).isTrue();
        assertThat(processedStripeEventRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Instructor cannot create coupon for a course they do not own")
    void instructorCannotCreateCouponForOtherInstructorCourse() {
        User ownerInstructor = createUser("owner@test.com", User.Role.INSTRUCTOR);
        User otherInstructor = createUser("other@test.com", User.Role.INSTRUCTOR);
        Course course = createCourse(ownerInstructor, 120.0);

        String token = jwtTokenProvider.generateToken(otherInstructor);
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/coupons",
                HttpMethod.POST,
                authEntity(Map.of(
                        "courseId", course.getId(),
                        "discountPercent", 20,
                        "code", "NOPE20"), token),
                Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Coupon usage limit is enforced across students")
    void couponUsageLimit_EnforcedAcrossStudents() {
        User instructor = createUser("instructor@test.com", User.Role.INSTRUCTOR);
        User studentUser1 = createUser("student4@test.com", User.Role.STUDENT);
        User studentUser2 = createUser("student5@test.com", User.Role.STUDENT);
        Student student1 = createStudent(studentUser1);
        Student student2 = createStudent(studentUser2);
        Course course = createCourse(instructor, 90.0);
        Coupon coupon = createCoupon(course, instructor.getId(), "ONCE100", 100, 1);

        String token1 = jwtTokenProvider.generateToken(studentUser1);
        ResponseEntity<Map> firstCheckout = restTemplate.exchange(
                "/api/payments/checkout-sessions",
                HttpMethod.POST,
                authEntity(Map.of(
                        "courseId", course.getId(),
                        "couponCode", coupon.getCode()), token1),
                Map.class);

        assertThat(firstCheckout.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student1.getId(), course.getId())).isTrue();

        String token2 = jwtTokenProvider.generateToken(studentUser2);
        ResponseEntity<Map> validateResponse = restTemplate.exchange(
                "/api/coupons/validate",
                HttpMethod.POST,
                authEntity(Map.of(
                        "courseId", course.getId(),
                        "couponCode", coupon.getCode()), token2),
                Map.class);

        assertThat(validateResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(validateResponse.getBody()).isNotNull();
        assertThat(validateResponse.getBody().get("code")).isEqualTo("CPN_003");
        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student2.getId(), course.getId())).isFalse();
    }

    private HttpEntity<Map<String, Object>> authEntity(Map<String, Object> body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return new HttpEntity<>(body, headers);
    }

    private User createUser(String email, User.Role role) {
        return authRepository.save(User.builder()
                .email(email)
                .password("password")
                .firstName("First")
                .lastName("Last")
                .role(role)
                .enabled(true)
                .authProvider(User.AuthProvider.LOCAL)
                .build());
    }

    private Student createStudent(User user) {
        return studentRepository.save(Student.builder()
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .active(true)
                .build());
    }

    private Course createCourse(User owner, double price) {
        return courseRepository.save(Course.builder()
                .title("Course " + owner.getId())
                .description("Course Description")
                .instructor(owner.getFirstName() + " " + owner.getLastName())
                .ownerUserId(owner.getId())
                .price(price)
                .duration(12)
                .level("BEGINNER")
                .category("GENERAL")
                .active(true)
                .build());
    }

    private Coupon createCoupon(Course course, Long creatorId, String code, int discountPercent, Integer usageLimit) {
        return couponRepository.save(Coupon.builder()
                .code(code)
                .course(course)
                .discountPercent(discountPercent)
                .usageLimit(usageLimit)
                .usedCount(0)
                .createdByUserId(creatorId)
                .isActive(true)
                .build());
    }
}
