package com.itqan.edu.features.admin.analytics;

import com.itqan.edu.common.security.JwtTokenProvider;
import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.admin.analytics.dto.AnalyticsOverviewResponse;
import com.itqan.edu.features.admin.analytics.dto.CoursePopularityResponse;
import com.itqan.edu.features.admin.analytics.dto.RevenueTrendResponse;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.Enrollment;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.payments.Payment;
import com.itqan.edu.features.payments.PaymentRepository;
import com.itqan.edu.features.payments.PaymentStatus;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AnalyticsControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthRepository authRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    @Autowired
    private CacheManager cacheManager;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        enrollmentRepository.deleteAll();
        courseRepository.deleteAll();
        studentRepository.deleteAll();
        authRepository.deleteAll();
        if (cacheManager.getCache("analytics") != null) {
            cacheManager.getCache("analytics").clear();
        }
    }

    @Test
    @DisplayName("Admin can fetch analytics overview with totals and revenue")
    void adminCanFetchOverview() {
        User admin = createUser("admin@test.com", User.Role.ADMIN);
        User instructor = createUser("instructor@test.com", User.Role.INSTRUCTOR);
        User studentUser = createUser("student@test.com", User.Role.STUDENT);
        Student student = createStudent(studentUser);
        Course course = createCourse(instructor, 100.0);
        createEnrollment(student, course, EnrollmentStatus.ACTIVE, 50);
        createPayment(student, course, 100.0, "USD", PaymentStatus.COMPLETED);
        createPayment(student, course, 50.0, "USD", PaymentStatus.PENDING); // should not be counted

        String token = jwtTokenProvider.generateToken(admin);

        ResponseEntity<AnalyticsOverviewResponse> response = restTemplate.exchange(
                "/api/admin/analytics/overview",
                HttpMethod.GET,
                authEntity(token),
                AnalyticsOverviewResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        AnalyticsOverviewResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getTotalStudents()).isEqualTo(1);
        assertThat(body.getTotalCourses()).isEqualTo(1);
        assertThat(body.getTotalEnrollments()).isEqualTo(1);
        assertThat(body.getRevenueByCurrency()).containsEntry("USD", 100.0);
        assertThat(body.getNewUsersThisMonth()).isGreaterThanOrEqualTo(3);
    }

    @Test
    @DisplayName("Admin can fetch revenue trend over given days")
    void adminCanFetchRevenueTrend() {
        User admin = createUser("admin@test.com", User.Role.ADMIN);
        User instructor = createUser("instructor@test.com", User.Role.INSTRUCTOR);
        User studentUser = createUser("student@test.com", User.Role.STUDENT);
        Student student = createStudent(studentUser);
        Course course = createCourse(instructor, 200.0);
        createPayment(student, course, 200.0, "USD", PaymentStatus.COMPLETED);
        createPayment(student, course, 75.0, "EGP", PaymentStatus.COMPLETED);

        String token = jwtTokenProvider.generateToken(admin);

        ResponseEntity<RevenueTrendResponse> response = restTemplate.exchange(
                "/api/admin/analytics/revenue-trend?days=7",
                HttpMethod.GET,
                authEntity(token),
                RevenueTrendResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        RevenueTrendResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getGranularity()).isEqualTo("DAILY");
        assertThat(body.getDataPoints()).hasSize(2);
        assertThat(body.getDataPoints())
                .extracting(RevenueTrendResponse.DataPoint::getCurrency)
                .containsExactlyInAnyOrder("USD", "EGP");
    }

    @Test
    @DisplayName("Admin can fetch top courses by enrollment")
    void adminCanFetchTopCourses() {
        User admin = createUser("admin@test.com", User.Role.ADMIN);
        User instructor = createUser("instructor@test.com", User.Role.INSTRUCTOR);
        User s1 = createUser("s1@test.com", User.Role.STUDENT);
        User s2 = createUser("s2@test.com", User.Role.STUDENT);
        Student student1 = createStudent(s1);
        Student student2 = createStudent(s2);
        Course popular = createCourse(instructor, 100.0, "Popular");
        Course quiet = createCourse(instructor, 100.0, "Quiet");
        createEnrollment(student1, popular, EnrollmentStatus.COMPLETED, 100);
        createEnrollment(student2, popular, EnrollmentStatus.ACTIVE, 50);
        createEnrollment(student1, quiet, EnrollmentStatus.ACTIVE, 25);

        String token = jwtTokenProvider.generateToken(admin);

        ResponseEntity<CoursePopularityResponse[]> response = restTemplate.exchange(
                "/api/admin/analytics/top-courses?limit=5",
                HttpMethod.GET,
                authEntity(token),
                CoursePopularityResponse[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<CoursePopularityResponse> top = List.of(response.getBody());
        assertThat(top).hasSize(2);
        assertThat(top.get(0).getTitle()).isEqualTo("Popular");
        assertThat(top.get(0).getEnrollmentCount()).isEqualTo(2);
        assertThat(top.get(0).getCompletionRate()).isEqualTo(50.0);
    }

    @Test
    @DisplayName("Non-admin cannot access analytics endpoints")
    void nonAdminForbidden() {
        User studentUser = createUser("student@test.com", User.Role.STUDENT);
        String token = jwtTokenProvider.generateToken(studentUser);

        ResponseEntity<String> overview = restTemplate.exchange(
                "/api/admin/analytics/overview",
                HttpMethod.GET,
                authEntity(token),
                String.class);

        assertThat(overview.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    private HttpEntity<Void> authEntity(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
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
        return createCourse(owner, price, "Course " + owner.getEmail());
    }

    private Course createCourse(User owner, double price, String title) {
        return courseRepository.save(Course.builder()
                .title(title)
                .description("Description")
                .instructor(owner.getFirstName() + " " + owner.getLastName())
                .ownerUserId(owner.getId())
                .price(price)
                .duration(10)
                .level("BEGINNER")
                .category("GENERAL")
                .active(true)
                .build());
    }

    private Enrollment createEnrollment(Student student, Course course, EnrollmentStatus status, int progress) {
        return enrollmentRepository.save(Enrollment.builder()
                .student(student)
                .course(course)
                .status(status)
                .progress(progress)
                .enrolledAt(LocalDateTime.now())
                .build());
    }

    private Payment createPayment(Student student, Course course, double amount, String currency, PaymentStatus status) {
        return paymentRepository.save(Payment.builder()
                .student(student)
                .course(course)
                .amount(amount)
                .originalAmount(amount)
                .discountAmount(0.0)
                .currency(currency)
                .status(status)
                .paymentGateway("STRIPE")
                .build());
    }
}
