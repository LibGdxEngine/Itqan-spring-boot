package com.itqan.edu.features.payments.easykash;

import com.fasterxml.jackson.databind.JsonNode;
import com.itqan.edu.common.security.JwtTokenProvider;
import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.payments.Coupon;
import com.itqan.edu.features.payments.CouponRedemptionRepository;
import com.itqan.edu.features.payments.CouponRedemptionStatus;
import com.itqan.edu.features.payments.CouponRepository;
import com.itqan.edu.features.payments.Payment;
import com.itqan.edu.features.payments.PaymentRepository;
import com.itqan.edu.features.payments.PaymentStatus;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EasyKashIntegrationTest extends BaseIntegrationTest {

    private static final String SECRET = "da9fe30575517d987762a859842b5631";
    private static final String PAY_URL = "https://www.easykash.net/DirectPayV1/ABC123";

    @Autowired private AuthRepository authRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private CouponRepository couponRepository;
    @Autowired private CouponRedemptionRepository couponRedemptionRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private EasyKashService easyKashService;

    @MockBean private EasyKashGateway gateway;

    private Student student;
    private Course course;
    private String token;

    @BeforeEach
    void setUp() {
        couponRedemptionRepository.deleteAll();
        paymentRepository.deleteAll();
        couponRepository.deleteAll();
        enrollmentRepository.deleteAll();
        courseRepository.deleteAll();
        studentRepository.deleteAll();
        authRepository.deleteAll();

        User instructor = user("instructor@test.com", User.Role.INSTRUCTOR);
        User studentUser = user("student@test.com", User.Role.STUDENT);
        student = studentRepository.save(Student.builder()
                .email(studentUser.getEmail()).firstName("Sara").lastName("Ali").active(true).build());
        course = courseRepository.save(Course.builder()
                .title("Tafseer").description("d").instructor("t").ownerUserId(instructor.getId())
                .price(150.0).duration(1).level("BEGINNER").category("GENERAL").active(true).build());
        token = jwtTokenProvider.generateToken(studentUser);
        when(gateway.createPayLink(any())).thenReturn(PAY_URL);
    }

    @Test
    void checkout_sendsTheBuyerAndServerSideAmountAndReturnsTheHostedPage() {
        ResponseEntity<JsonNode> response = checkout(Map.of("courseId", course.getId(), "phone", "+20 101 234 5678"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().path("checkoutUrl").asText()).isEqualTo(PAY_URL);

        ArgumentCaptor<EasyKashPayRequest> sent = ArgumentCaptor.forClass(EasyKashPayRequest.class);
        verify(gateway).createPayLink(sent.capture());
        assertThat(sent.getValue().amount()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(sent.getValue().currency()).isEqualTo("EGP");
        assertThat(sent.getValue().name()).isEqualTo("Sara Ali");
        assertThat(sent.getValue().mobile()).isEqualTo("01012345678");
        assertThat(sent.getValue().redirectUrl()).isEqualTo("https://itqan.test/courses/success");
        assertThat(sent.getValue().customerReference()).matches("[A-Z0-9]+")
                .isEqualTo(response.getBody().path("sessionId").asText());

        Payment payment = onlyPayment();
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(payment.getPaymentGateway()).isEqualTo("EASYKASH");
        assertThat(enrolled()).isFalse();
    }

    @Test
    void checkout_withoutAnyMobileNumberIsRefused() {
        assertThat(checkout(Map.of("courseId", course.getId())).getStatusCode().is4xxClientError()).isTrue();
        assertThat(checkout(Map.of("courseId", course.getId(), "phone", "abc")).getStatusCode().is4xxClientError()).isTrue();
    }

    @Test
    void checkout_usesTheNumberOnTheProfile() {
        student.setPhoneNumber("01098765432");
        studentRepository.save(student);

        assertThat(checkout(Map.of("courseId", course.getId())).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void validCallback_completesPaymentEnrollsAndIsIdempotent() {
        String reference = startCheckout();
        String callback = signed(reference, "PAID", "150.00", "2911105009");

        assertThat(postCallback(callback).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(postCallback(callback).getStatusCode()).isEqualTo(HttpStatus.OK);

        Payment payment = onlyPayment();
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(payment.getTransactionId()).isEqualTo("2911105009");
        assertThat(payment.getPaymentMethod()).isEqualTo("Mobile Wallet");
        assertThat(enrolled()).isTrue();
        assertThat(enrollmentRepository.findAll()).hasSize(1);
    }

    @Test
    void callback_withANumericAmountKeepsItsExactDigitsForTheSignature() throws Exception {
        String reference = startCheckout();
        Map<String, Object> fields = fields(reference, "PAID", "150.00", "1");
        fields.put("signatureHash", EasyKashSignature.compute(objectMapper.valueToTree(fields), SECRET));
        String numeric = objectMapper.writeValueAsString(fields).replace("\"Amount\":\"150.00\"", "\"Amount\":150.00");

        assertThat(postCallback(numeric).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(onlyPayment().getStatus()).isEqualTo(PaymentStatus.COMPLETED);
    }

    @Test
    void forgedCallback_isRejectedAndGrantsNothing() throws Exception {
        String reference = startCheckout();
        Map<String, Object> forged = fields(reference, "PAID", "150.00", "1");
        forged.put("signatureHash", "0".repeat(128));

        assertThat(postCallback(objectMapper.writeValueAsString(forged)).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(postCallback("not json").getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(onlyPayment().getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(enrolled()).isFalse();
    }

    @Test
    void callbackUrl_answersAvailabilityChecksAndRefusesAnEmptyPost() {
        assertThat(restTemplate.getForEntity("/api/payments/webhook/easykash", String.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(restTemplate.postForEntity("/api/payments/webhook/easykash", HttpEntity.EMPTY, String.class).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void callback_forAnotherSaleOnTheAccountIsAcknowledgedAndIgnored() {
        assertThat(postCallback(signed("SHOPIFY-1", "PAID", "10.00", "9")).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(paymentRepository.findAll()).isEmpty();
    }

    @Test
    void replayAfterRefund_doesNotGrantAccessAgain() {
        String reference = startCheckout();
        String callback = signed(reference, "PAID", "150.00", "5");
        postCallback(callback);
        Payment payment = onlyPayment();
        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);
        enrollmentRepository.deleteAll();

        postCallback(callback);

        assertThat(onlyPayment().getStatus()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(enrolled()).isFalse();
    }

    @Test
    void voucherPaidAfterANewerAttempt_stillEnrolls() {
        String firstAttempt = startCheckout();
        startCheckout();

        postCallback(signed(firstAttempt, "PAID", "150.00", "7"));

        assertThat(paymentRepository.findByGatewayReference(firstAttempt).orElseThrow().getStatus())
                .isEqualTo(PaymentStatus.COMPLETED);
        assertThat(enrolled()).isTrue();
    }

    @Test
    void statusCheck_recoversALostCallbackThroughTheInquiryApi() {
        String reference = startCheckout();
        when(gateway.inquire(reference)).thenReturn(Optional.of(
                new EasyKashResult(EasyKashResult.Outcome.PAID, "42", "Credit & Debit Card", "150.00")));

        ResponseEntity<JsonNode> status = checkoutStatus(reference);

        assertThat(status.getBody().path("status").asText()).isEqualTo("COMPLETED");
        assertThat(onlyPayment().getTransactionId()).isEqualTo("42");
        assertThat(enrolled()).isTrue();
    }

    @Test
    void statusCheck_staysPendingWhenEasyKashHasNoAnswerYet() {
        String reference = startCheckout();
        when(gateway.inquire(reference)).thenReturn(Optional.empty());

        assertThat(checkoutStatus(reference).getBody().path("status").asText()).isEqualTo("PENDING");
    }

    @Test
    void statusCheck_doesNotExposeAnotherStudentsPayment() {
        String reference = startCheckout();
        User other = user("other@test.com", User.Role.STUDENT);
        studentRepository.save(Student.builder()
                .email(other.getEmail()).firstName("O").lastName("T").active(true).build());
        when(gateway.inquire(reference)).thenReturn(Optional.empty());

        ResponseEntity<JsonNode> response = restTemplate.exchange("/api/payments/checkout-sessions/" + reference,
                HttpMethod.GET, entity(null, jwtTokenProvider.generateToken(other)), JsonNode.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void reconcile_closesExpiredAttemptsAndFreesTheCoupon() {
        Coupon coupon = couponRepository.save(Coupon.builder().code("TEN").course(course).discountPercent(10)
                .usageLimit(5).usedCount(0).isActive(true).createdByUserId(1L).build());
        checkout(Map.of("courseId", course.getId(), "phone", "01012345678", "couponCode", coupon.getCode()));
        Payment payment = onlyPayment();
        when(gateway.inquire(payment.getGatewayReference())).thenReturn(Optional.of(
                new EasyKashResult(EasyKashResult.Outcome.FAILED, "", "", "")));

        easyKashService.reconcilePendingPayments();

        assertThat(onlyPayment().getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(couponRedemptionRepository.findByPaymentId(payment.getId()).orElseThrow().getStatus())
                .isEqualTo(CouponRedemptionStatus.RELEASED);
    }

    @Test
    void reconcile_leavesARecentUnansweredAttemptButAbandonsAnOldOne() {
        String reference = startCheckout();
        when(gateway.inquire(reference)).thenReturn(Optional.empty());

        easyKashService.reconcilePendingPayments();
        assertThat(onlyPayment().getStatus()).isEqualTo(PaymentStatus.PENDING);

        Payment payment = onlyPayment();
        payment.setCreatedAt(LocalDateTime.now().minusDays(5));
        paymentRepository.save(payment);

        easyKashService.reconcilePendingPayments();
        assertThat(onlyPayment().getStatus()).isEqualTo(PaymentStatus.CANCELLED);
    }

    @Test
    void options_arePublicAndReportTheConfiguration() {
        ResponseEntity<JsonNode> response = restTemplate.getForEntity("/api/payments/options", JsonNode.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().path("easykashEnabled").asBoolean()).isTrue();
    }

    private String startCheckout() {
        return checkout(Map.of("courseId", course.getId(), "phone", "01012345678")).getBody().path("sessionId").asText();
    }

    private ResponseEntity<JsonNode> checkout(Map<String, Object> body) {
        return restTemplate.exchange("/api/payments/easykash/checkout", HttpMethod.POST, entity(body, token), JsonNode.class);
    }

    private ResponseEntity<JsonNode> checkoutStatus(String reference) {
        return restTemplate.exchange("/api/payments/checkout-sessions/" + reference, HttpMethod.GET, entity(null, token), JsonNode.class);
    }

    private ResponseEntity<String> postCallback(String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return restTemplate.postForEntity("/api/payments/webhook/easykash", new HttpEntity<>(body, headers), String.class);
    }

    private <T> HttpEntity<T> entity(T body, String bearer) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(bearer);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    private Map<String, Object> fields(String reference, String status, String amount, String ref) {
        Map<String, Object> fields = new HashMap<>();
        fields.put("ProductCode", "ABC123");
        fields.put("Amount", amount);
        fields.put("ProductType", "Direct Pay");
        fields.put("PaymentMethod", "Mobile Wallet");
        fields.put("status", status);
        fields.put("easykashRef", ref);
        fields.put("customerReference", reference);
        return fields;
    }

    private String signed(String reference, String status, String amount, String ref) {
        try {
            Map<String, Object> fields = fields(reference, status, amount, ref);
            fields.put("signatureHash", EasyKashSignature.compute(objectMapper.valueToTree(fields), SECRET));
            return objectMapper.writeValueAsString(fields);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private Payment onlyPayment() {
        return paymentRepository.findByStudentIdAndCourseId(student.getId(), course.getId()).get(0);
    }

    private boolean enrolled() {
        return enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId());
    }

    private User user(String email, User.Role role) {
        return authRepository.save(User.builder().email(email).password("x").firstName("F").lastName("L")
                .role(role).enabled(true).authProvider(User.AuthProvider.LOCAL).build());
    }
}
