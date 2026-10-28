package com.itqan.edu.features.admin;

import com.itqan.edu.common.security.JwtTokenProvider;
import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.payments.EnrollmentCodeRepository;
import com.itqan.edu.features.payments.PaymentRepository;
import com.itqan.edu.features.payments.PaymentStatus;
import com.itqan.edu.features.settings.SiteSettingRepository;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class AdminManagementIntegrationTest extends BaseIntegrationTest {

    @Autowired private AuthRepository authRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private EnrollmentCodeRepository enrollmentCodeRepository;
    @Autowired private SiteSettingRepository siteSettingRepository;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private PasswordEncoder passwordEncoder;

    private final List<Long> userIds = new ArrayList<>();
    private final List<Long> studentIds = new ArrayList<>();

    private User admin;
    private Course course;

    @BeforeEach
    void setUp() {
        admin = createUser(User.Role.ADMIN, true);
        course = courseRepository.save(Course.builder()
                .title("Admin test course " + UUID.randomUUID())
                .description("desc")
                .instructor("Someone")
                .price(250.0)
                .duration(5)
                .level("BEGINNER")
                .category("GENERAL")
                .active(true)
                .build());
    }

    @AfterEach
    void tearDown() {
        paymentRepository.deleteAll();
        enrollmentCodeRepository.deleteAll();
        enrollmentRepository.deleteAll();
        siteSettingRepository.deleteAll();
        courseRepository.deleteById(course.getId());
        studentRepository.deleteAllById(studentIds);
        authRepository.deleteAllById(userIds);
        userIds.clear();
        studentIds.clear();
    }

    @Test
    @DisplayName("Admin endpoints are forbidden to students")
    void studentsCannotUseAdminEndpoints() {
        String token = token(createStudent());
        for (String url : List.of("/api/admin/users", "/api/admin/payments", "/api/admin/enrollments",
                "/api/admin/courses", "/api/admin/enrollment-codes", "/api/admin/analytics/summary")) {
            assertThat(call(HttpMethod.GET, url, null, token).getStatusCode()).as(url).isEqualTo(HttpStatus.FORBIDDEN);
        }
    }

    @Test
    @DisplayName("User search filters by role and text; suspending a student blocks their token")
    void userSearchAndSuspend() {
        User student = createStudent();
        String studentToken = token(student);

        ResponseEntity<Map> page = call(HttpMethod.GET,
                "/api/admin/users?role=STUDENT&q=" + student.getEmail(), null, token(admin));
        assertThat(page.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((List<?>) page.getBody().get("content")).hasSize(1);

        ResponseEntity<Map> suspended = call(HttpMethod.PATCH, "/api/admin/users/" + student.getId() + "/status",
                Map.of("enabled", false), token(admin));
        assertThat(suspended.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(suspended.getBody().get("enabled")).isEqualTo(false);
        assertThat(studentRepository.findByEmail(student.getEmail()).orElseThrow().getActive()).isFalse();
        assertThat(call(HttpMethod.GET, "/api/students/profile", null, studentToken).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Admin cannot suspend their own account")
    void cannotSuspendSelf() {
        ResponseEntity<Map> response = call(HttpMethod.PATCH, "/api/admin/users/" + admin.getId() + "/status",
                Map.of("enabled", false), token(admin));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Manual payment enrolls the student; refund revokes access")
    void manualPaymentThenRefund() {
        User student = createStudent();

        ResponseEntity<Map> payment = call(HttpMethod.POST, "/api/admin/payments/manual", Map.of(
                "studentEmail", student.getEmail(),
                "courseId", course.getId(),
                "amount", 250.0,
                "currency", "egp",
                "method", "VODAFONE_CASH",
                "reference", "TX-123"), token(admin));
        assertThat(payment.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(payment.getBody().get("status")).isEqualTo("COMPLETED");
        assertThat(payment.getBody().get("currency")).isEqualTo("EGP");
        Long studentId = studentRepository.findByEmail(student.getEmail()).orElseThrow().getId();
        assertThat(enrollmentRepository.findByStudentIdAndCourseId(studentId, course.getId()).orElseThrow().getStatus())
                .isEqualTo(EnrollmentStatus.ACTIVE);

        Number paymentId = (Number) payment.getBody().get("id");
        ResponseEntity<Map> refunded = call(HttpMethod.POST, "/api/admin/payments/" + paymentId + "/refund",
                Map.of("reason", "Requested by student"), token(admin));
        assertThat(refunded.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(paymentRepository.findById(paymentId.longValue()).orElseThrow().getStatus())
                .isEqualTo(PaymentStatus.REFUNDED);
        assertThat(enrollmentRepository.findByStudentIdAndCourseId(studentId, course.getId()).orElseThrow().getStatus())
                .isEqualTo(EnrollmentStatus.DROPPED);

        ResponseEntity<Map> again = call(HttpMethod.POST, "/api/admin/payments/" + paymentId + "/refund",
                null, token(admin));
        assertThat(again.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Admin grants access manually and can list it")
    void grantEnrollment() {
        User student = createStudent();

        ResponseEntity<Map> granted = call(HttpMethod.POST, "/api/admin/enrollments",
                Map.of("studentEmail", student.getEmail(), "courseId", course.getId()), token(admin));
        assertThat(granted.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<Map> list = call(HttpMethod.GET, "/api/admin/enrollments?courseId=" + course.getId(), null, token(admin));
        assertThat((List<?>) list.getBody().get("content")).hasSize(1);
    }

    @Test
    @DisplayName("Generated enrollment code can be redeemed once by a student")
    void enrollmentCodes() {
        ResponseEntity<List> codes = restTemplate.exchange("/api/admin/enrollment-codes", HttpMethod.POST,
                entity(Map.of("courseId", course.getId(), "quantity", 2, "usageLimit", 1), token(admin)), List.class);
        assertThat(codes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(codes.getBody()).hasSize(2);
        String code = (String) ((Map<?, ?>) codes.getBody().get(0)).get("code");

        User student = createStudent();
        ResponseEntity<Map> redeemed = call(HttpMethod.POST, "/api/enrollment-codes/redeem",
                Map.of("code", code.toLowerCase()), token(student));
        assertThat(redeemed.getStatusCode()).isEqualTo(HttpStatus.OK);

        User other = createStudent();
        ResponseEntity<Map> reused = call(HttpMethod.POST, "/api/enrollment-codes/redeem", Map.of("code", code), token(other));
        assertThat(reused.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Settings: admin updates known keys, public can read, unknown keys rejected")
    void siteSettings() {
        ResponseEntity<Map> updated = call(HttpMethod.PUT, "/api/admin/settings",
                Map.of("contactEmail", "hello@itqan.test", "whatsappNumber", "201000000000"), token(admin));
        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> publicSettings = restTemplate.getForEntity("/api/settings", Map.class);
        assertThat(publicSettings.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(publicSettings.getBody().get("contactEmail")).isEqualTo("hello@itqan.test");
        assertThat(publicSettings.getBody()).containsKey("siteName");

        ResponseEntity<Map> rejected = call(HttpMethod.PUT, "/api/admin/settings", Map.of("evil", "x"), token(admin));
        assertThat(rejected.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Analytics summary and zero-filled series cover the requested range")
    void analyticsRange() {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(13);
        String range = "?from=" + from + "&to=" + to;

        assertThat(call(HttpMethod.GET, "/api/admin/analytics/summary" + range, null, token(admin)).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> enrollments = call(HttpMethod.GET,
                "/api/admin/analytics/enrollment-series" + range + "&granularity=DAILY", null, token(admin));
        assertThat(enrollments.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((List<?>) enrollments.getBody().get("points")).hasSize(14);

        ResponseEntity<Map> tooLong = call(HttpMethod.GET,
                "/api/admin/analytics/summary?from=" + to.minusDays(400) + "&to=" + to, null, token(admin));
        assertThat(tooLong.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Admin course search finds drafts and can publish them")
    void courseSearchAndPublish() {
        call(HttpMethod.PATCH, "/api/admin/courses/" + course.getId() + "/status", Map.of("active", false), token(admin));

        ResponseEntity<Map> drafts = call(HttpMethod.GET,
                "/api/admin/courses?active=false&q=" + course.getTitle().substring(0, 17), null, token(admin));
        assertThat((List<?>) drafts.getBody().get("content")).isNotEmpty();

        ResponseEntity<Map> published = call(HttpMethod.PATCH, "/api/admin/courses/" + course.getId() + "/status",
                Map.of("active", true), token(admin));
        assertThat(published.getBody().get("active")).isEqualTo(true);
    }

    // --- helpers ---

    private User createUser(User.Role role, boolean superAdmin) {
        User user = authRepository.save(User.builder()
                .email(role.name().toLowerCase() + "-" + UUID.randomUUID() + "@test.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Test")
                .lastName(role.name())
                .role(role)
                .superAdmin(superAdmin)
                .enabled(true)
                .authProvider(User.AuthProvider.LOCAL)
                .build());
        userIds.add(user.getId());
        return user;
    }

    private User createStudent() {
        User user = createUser(User.Role.STUDENT, false);
        Student student = studentRepository.save(Student.builder()
                .email(user.getEmail())
                .firstName("Test")
                .lastName("Student")
                .active(true)
                .build());
        studentIds.add(student.getId());
        return user;
    }

    private String token(User user) {
        return jwtTokenProvider.generateToken(user);
    }

    private HttpEntity<Object> entity(Object body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    private ResponseEntity<Map> call(HttpMethod method, String url, Object body, String token) {
        return restTemplate.exchange(url, method, entity(body, token), Map.class);
    }
}
