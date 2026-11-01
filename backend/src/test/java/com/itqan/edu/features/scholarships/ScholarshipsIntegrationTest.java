package com.itqan.edu.features.scholarships;

import com.itqan.edu.common.security.JwtTokenProvider;
import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.payments.CouponRedemptionRepository;
import com.itqan.edu.features.payments.PaymentRepository;
import com.itqan.edu.features.payments.ProcessedStripeEventRepository;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.itqan.edu.features.payments.paymob.PaymobCheckout;
import com.itqan.edu.features.payments.paymob.PaymobGateway;
import com.itqan.edu.features.payments.paymob.PaymobHmac;
import com.itqan.edu.features.payments.paymob.PaymobIntentionRequest;
import org.mockito.ArgumentCaptor;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ScholarshipsIntegrationTest extends BaseIntegrationTest {

    @Autowired private AuthRepository authRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private ProcessedStripeEventRepository processedStripeEventRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private CouponRedemptionRepository couponRedemptionRepository;
    @Autowired private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private PaymobGateway paymobGateway;

    private User admin;
    private User studentUser;
    private Student student;
    private Course course;

    @BeforeEach
    void setUp() {
        scholarshipApplicationRepository.deleteAll();
        donationRepository.deleteAll();
        processedStripeEventRepository.deleteAll();
        couponRedemptionRepository.deleteAll();
        paymentRepository.deleteAll();
        enrollmentRepository.deleteAll();
        courseRepository.deleteAll();
        studentRepository.deleteAll();
        authRepository.deleteAll();

        admin = createUser("admin@test.com", User.Role.ADMIN);
        studentUser = createUser("needy@test.com", User.Role.STUDENT);
        student = studentRepository.save(Student.builder()
                .email(studentUser.getEmail()).firstName("Needy").lastName("Student").active(true).build());
        course = courseRepository.save(Course.builder()
                .title("Tafseer Juz Amma").description("d").instructor("Teacher").ownerUserId(admin.getId())
                .price(300.0).duration(10).level("BEGINNER").category("TAFSIR").active(true).build());
    }

    @Test
    @DisplayName("Apply, then approve from the fund: student is enrolled and the fund balance goes down")
    void applyAndApproveFromFund() {
        recordManualDonation(500.0);
        Long applicationId = apply();

        ResponseEntity<Map> approve = post("/api/admin/scholarships/" + applicationId + "/approve",
                Map.of("fundingSource", "FUND", "note", "بالتوفيق"), adminToken());
        assertThat(approve.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(approve.getBody().get("status")).isEqualTo("APPROVED");
        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())).isTrue();

        ResponseEntity<Map> fund = get("/api/admin/scholarships/fund", adminToken());
        assertThat(((Number) fund.getBody().get("received")).doubleValue()).isEqualTo(500.0);
        assertThat(((Number) fund.getBody().get("used")).doubleValue()).isEqualTo(300.0);
        assertThat(((Number) fund.getBody().get("balance")).doubleValue()).isEqualTo(200.0);

        // A decided request cannot be decided again.
        ResponseEntity<Map> again = post("/api/admin/scholarships/" + applicationId + "/reject", Map.of(), adminToken());
        assertThat(again.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Approval from the fund is refused when the balance is too low; academy-funded approval works")
    void fundTooLow() {
        recordManualDonation(100.0);
        Long applicationId = apply();

        ResponseEntity<Map> fromFund = post("/api/admin/scholarships/" + applicationId + "/approve",
                Map.of("fundingSource", "FUND"), adminToken());
        assertThat(fromFund.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())).isFalse();

        ResponseEntity<Map> byAcademy = post("/api/admin/scholarships/" + applicationId + "/approve",
                Map.of("fundingSource", "ACADEMY"), adminToken());
        assertThat(byAcademy.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())).isTrue();
    }

    @Test
    @DisplayName("A second pending request for the same course is refused")
    void duplicatePendingRefused() {
        apply();
        ResponseEntity<Map> second = post("/api/scholarships/applications", applyBody(), studentToken());
        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        ResponseEntity<Object[]> mine = restTemplate.exchange("/api/scholarships/applications/me", HttpMethod.GET,
                authEntity(null, studentToken()), Object[].class);
        assertThat(mine.getBody()).hasSize(1);
    }

    @Test
    @DisplayName("Guest Paymob donation completes through a signed callback, once")
    void guestDonationPaymobCallback() throws Exception {
        when(paymobGateway.createIntention(any())).thenReturn(
                new PaymobCheckout("pi_1", "https://accept.paymob.com/unifiedcheckout/?publicKey=pk&clientSecret=cs"));

        HttpHeaders json = new HttpHeaders();
        json.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> checkout = restTemplate.exchange("/api/donations/checkout", HttpMethod.POST,
                new HttpEntity<>(Map.of("amount", 250, "donorEmail", "Donor@Example.com"), json), Map.class);
        assertThat(checkout.getStatusCode()).isEqualTo(HttpStatus.OK);
        String reference = (String) checkout.getBody().get("sessionId");
        assertThat(reference).startsWith("DON-");

        ArgumentCaptor<PaymobIntentionRequest> sent = ArgumentCaptor.forClass(PaymobIntentionRequest.class);
        verify(paymobGateway).createIntention(sent.capture());
        assertThat(sent.getValue().getAmountCents()).isEqualTo(25_000);
        assertThat(sent.getValue().getNotificationUrl()).isEqualTo("https://itqan.test/api/payments/webhook/paymob");

        // A forged callback is refused and changes nothing.
        ResponseEntity<Map> forged = paymobCallback(transaction(9001, reference, true), "bad-signature");
        assertThat(forged.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(donationRepository.findByGatewayReference(reference).orElseThrow().getStatus())
                .isEqualTo(DonationStatus.PENDING);

        ObjectNode tx = transaction(9001, reference, true);
        String hmac = PaymobHmac.compute(tx, "test_hmac_secret");
        for (int i = 0; i < 2; i++) {
            assertThat(paymobCallback(tx, hmac).getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        Donation donation = donationRepository.findByGatewayReference(reference).orElseThrow();
        assertThat(donation.getStatus()).isEqualTo(DonationStatus.COMPLETED);
        assertThat(donation.getGatewayTransactionId()).isEqualTo("9001");
        assertThat(donation.getDonorEmail()).isEqualTo("donor@example.com");
        assertThat(processedStripeEventRepository.count()).isEqualTo(1);

        ResponseEntity<Map> status = restTemplate.getForEntity("/api/donations/checkout/" + reference, Map.class);
        assertThat(status.getBody().get("status")).isEqualTo("COMPLETED");
        assertThat(status.getBody()).doesNotContainKey("donorEmail");
    }

    @Test
    @DisplayName("Course bought through Paymob: paid callback enrolls the student")
    void coursePaymobCheckout() throws Exception {
        when(paymobGateway.createIntention(any())).thenReturn(new PaymobCheckout("pi_2", "https://accept.paymob.com/x"));

        ResponseEntity<Map> checkout = post("/api/payments/paymob/checkout", Map.of("courseId", course.getId()), studentToken());
        assertThat(checkout.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(checkout.getBody().get("mode")).isEqualTo("REDIRECT");
        String reference = (String) checkout.getBody().get("sessionId");
        assertThat(reference).startsWith("PAY-");
        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())).isFalse();

        ObjectNode failed = transaction(7001, reference, false);
        paymobCallback(failed, PaymobHmac.compute(failed, "test_hmac_secret"));
        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())).isFalse();

        // Starting again after a failed card replaces the old attempt.
        ResponseEntity<Map> retry = post("/api/payments/paymob/checkout", Map.of("courseId", course.getId()), studentToken());
        String retryRef = (String) retry.getBody().get("sessionId");
        ObjectNode paid = transaction(7002, retryRef, true);
        assertThat(paymobCallback(paid, PaymobHmac.compute(paid, "test_hmac_secret")).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())).isTrue();

        ResponseEntity<Map> status = get("/api/payments/checkout-sessions/" + retryRef, studentToken());
        assertThat(status.getBody().get("status")).isEqualTo("COMPLETED");
    }

    private ObjectNode transaction(long id, String reference, boolean success) {
        ObjectNode tx = objectMapper.createObjectNode();
        tx.put("id", id);
        tx.put("amount_cents", 25000);
        tx.put("created_at", "2026-11-01T22:10:00.000000");
        tx.put("currency", "EGP");
        tx.put("error_occured", false);
        tx.put("has_parent_transaction", false);
        tx.put("integration_id", 111);
        tx.put("is_3d_secure", true);
        tx.put("is_auth", false);
        tx.put("is_capture", false);
        tx.put("is_refunded", false);
        tx.put("is_standalone_payment", true);
        tx.put("is_voided", false);
        tx.put("owner", 42);
        tx.put("pending", false);
        tx.put("success", success);
        ObjectNode order = tx.putObject("order");
        order.put("id", id + 100);
        order.put("merchant_order_id", reference);
        ObjectNode source = tx.putObject("source_data");
        source.put("pan", "2346");
        source.put("sub_type", "MasterCard");
        source.put("type", "card");
        return tx;
    }

    private ResponseEntity<Map> paymobCallback(ObjectNode tx, String hmac) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("type", "TRANSACTION");
        payload.set("obj", tx);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return restTemplate.exchange("/api/payments/webhook/paymob?hmac=" + hmac, HttpMethod.POST,
                new HttpEntity<>(payload.toString(), headers), Map.class);
    }

    @Test
    @DisplayName("Admin endpoints are closed to students")
    void adminEndpointsForbiddenForStudents() {
        assertThat(get("/api/admin/scholarships", studentToken()).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(get("/api/admin/scholarships/fund", studentToken()).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    private Long apply() {
        ResponseEntity<Map> response = post("/api/scholarships/applications", applyBody(), studentToken());
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("status")).isEqualTo("PENDING");
        return ((Number) response.getBody().get("id")).longValue();
    }

    private Map<String, Object> applyBody() {
        Map<String, Object> body = new HashMap<>();
        body.put("courseId", course.getId());
        body.put("reason", "أرغب في دراسة التفسير ولكن لا أستطيع دفع الرسوم حاليًا.");
        return body;
    }

    private void recordManualDonation(double amount) {
        ResponseEntity<Map> response = post("/api/admin/donations/manual",
                Map.of("amount", amount, "currency", "EGP", "method", "INSTAPAY"), adminToken());
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    private String adminToken() {
        return jwtTokenProvider.generateToken(admin);
    }

    private String studentToken() {
        return jwtTokenProvider.generateToken(studentUser);
    }

    private ResponseEntity<Map> post(String url, Object body, String token) {
        return restTemplate.exchange(url, HttpMethod.POST, authEntity(body, token), Map.class);
    }

    private ResponseEntity<Map> get(String url, String token) {
        return restTemplate.exchange(url, HttpMethod.GET, authEntity(null, token), Map.class);
    }

    private HttpEntity<Object> authEntity(Object body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return new HttpEntity<>(body, headers);
    }

    private User createUser(String email, User.Role role) {
        return authRepository.save(User.builder()
                .email(email).password("password").firstName("First").lastName("Last")
                .role(role).enabled(true).authProvider(User.AuthProvider.LOCAL).build());
    }
}
