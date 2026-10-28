package com.itqan.edu.features;

import com.itqan.edu.common.security.JwtTokenProvider;
import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.certificates.CertificateRepository;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.courses.Lesson;
import com.itqan.edu.features.courses.LessonRepository;
import com.itqan.edu.features.courses.LessonType;
import com.itqan.edu.features.courses.Module;
import com.itqan.edu.features.courses.ModuleRepository;
import com.itqan.edu.features.enrollments.Enrollment;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.enrollments.LessonEnrollmentRepository;
import com.itqan.edu.features.quizzes.QuizAttemptRepository;
import com.itqan.edu.features.reviews.CourseReviewRepository;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import com.itqan.edu.features.wishlist.WishlistRepository;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** Catalog search, reviews, wishlist, resume points and certificates. */
class StudentExperienceIntegrationTest extends BaseIntegrationTest {

    @Autowired private AuthRepository authRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private ModuleRepository moduleRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private LessonEnrollmentRepository lessonEnrollmentRepository;
    @Autowired private CourseReviewRepository reviewRepository;
    @Autowired private WishlistRepository wishlistRepository;
    @Autowired private CertificateRepository certificateRepository;
    @Autowired private QuizAttemptRepository quizAttemptRepository;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private PasswordEncoder passwordEncoder;

    private final List<Long> userIds = new ArrayList<>();
    private final List<Long> studentIds = new ArrayList<>();
    private final List<Long> courseIds = new ArrayList<>();
    private final String marker = UUID.randomUUID().toString().substring(0, 8);

    private User owner;

    @BeforeEach
    void setUp() {
        owner = createUser(User.Role.INSTRUCTOR);
    }

    @AfterEach
    void tearDown() {
        quizAttemptRepository.deleteAll();
        certificateRepository.deleteAll();
        reviewRepository.deleteAll();
        wishlistRepository.deleteAll();
        lessonEnrollmentRepository.deleteAll();
        enrollmentRepository.deleteAll();
        courseRepository.deleteAllById(courseIds);
        studentRepository.deleteAllById(studentIds);
        authRepository.deleteAllById(userIds);
    }

    @Test
    @DisplayName("Catalog searches published courses only, filters by price and sorts")
    void catalogSearch() {
        Course paid = course("Arabic grammar " + marker, 200.0, true);
        Course free = course("Arabic calligraphy " + marker, 0.0, true);
        course("Arabic draft " + marker, 50.0, false);

        Map<String, Object> all = getAnon("/api/catalog?q=" + marker + "&sort=price_desc").getBody();
        assertThat(all.get("totalElements")).isEqualTo(2);
        List<Map<String, Object>> content = (List<Map<String, Object>>) all.get("content");
        assertThat(content).extracting(c -> c.get("id")).containsExactly(paid.getId().intValue(), free.getId().intValue());

        Map<String, Object> onlyFree = getAnon("/api/catalog?q=" + marker + "&price=free").getBody();
        assertThat((List<Map<String, Object>>) onlyFree.get("content")).singleElement()
                .satisfies(c -> assertThat(c.get("id")).isEqualTo(free.getId().intValue()));
    }

    @Test
    @DisplayName("Only enrolled students review; hidden reviews leave listings and averages")
    void reviews() {
        Course course = course("Reviewed " + marker, 100.0, true);
        User outsider = createStudentUser();
        User alice = createStudentUser();
        User bob = createStudentUser();
        enroll(alice, course);
        enroll(bob, course);
        String url = "/api/courses/" + course.getId() + "/reviews/mine";

        ResponseEntity<Map> denied = send(HttpMethod.PUT, url, Map.of("rating", 5), token(outsider));
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody().get("code")).isEqualTo("REV_001");
        assertThat(send(HttpMethod.PUT, url, Map.of("rating", 6), token(alice)).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        assertThat(send(HttpMethod.PUT, url, Map.of("rating", 5, "comment", "Excellent"), token(alice))
                .getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(send(HttpMethod.PUT, url, Map.of("rating", 2, "comment", "Too fast"), token(bob))
                .getStatusCode()).isEqualTo(HttpStatus.OK);
        // Editing replaces, it does not add a second review.
        send(HttpMethod.PUT, url, Map.of("rating", 3, "comment", "Bit fast"), token(bob));

        Map<String, Object> summary = getAnon("/api/courses/" + course.getId() + "/reviews/summary").getBody();
        assertThat(summary.get("count")).isEqualTo(2);
        assertThat(summary.get("average")).isEqualTo(4.0);

        Long bobReviewId = reviewRepository.findByCourseIdAndStudentId(course.getId(),
                studentRepository.findByEmail(bob.getEmail()).orElseThrow().getId()).orElseThrow().getId();
        User admin = createUser(User.Role.ADMIN);
        assertThat(send(HttpMethod.PATCH, "/api/admin/reviews/" + bobReviewId, Map.of("hidden", true), token(alice))
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(send(HttpMethod.PATCH, "/api/admin/reviews/" + bobReviewId, Map.of("hidden", true), token(admin))
                .getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        Map<String, Object> after = getAnon("/api/courses/" + course.getId() + "/reviews/summary").getBody();
        assertThat(after.get("count")).isEqualTo(1);
        assertThat(after.get("average")).isEqualTo(5.0);
        String list = restTemplate.getForEntity("/api/courses/" + course.getId() + "/reviews", String.class).getBody();
        assertThat(list).contains("Excellent").doesNotContain("Bit fast");
        Map<String, Object> card = getAnon("/api/catalog/courses/" + course.getId()).getBody();
        assertThat(card.get("rating")).isEqualTo(5.0);
        assertThat(card.get("studentCount")).isEqualTo(2);
    }

    @Test
    @DisplayName("Wishlist saves published courses only")
    void wishlist() {
        Course published = course("Saved " + marker, 10.0, true);
        Course draft = course("Unsaved " + marker, 10.0, false);
        String student = token(createStudentUser());

        assertThat(send(HttpMethod.PUT, "/api/wishlist/" + published.getId(), null, student).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        send(HttpMethod.PUT, "/api/wishlist/" + published.getId(), null, student);
        assertThat(send(HttpMethod.PUT, "/api/wishlist/" + draft.getId(), null, student).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(restTemplate.exchange("/api/wishlist/ids", HttpMethod.GET, auth(null, student), List.class).getBody())
                .containsExactly(published.getId().intValue());

        send(HttpMethod.DELETE, "/api/wishlist/" + published.getId(), null, student);
        assertThat(restTemplate.exchange("/api/wishlist", HttpMethod.GET, auth(null, student), List.class).getBody())
                .isEmpty();
    }

    @Test
    @DisplayName("Resume point, progress, quiz pass and certificate issue and verification")
    void resumeAndCertificate() {
        Course course = course("Certified " + marker, 100.0, true);
        Module module = moduleRepository.save(Module.builder().title("M").orderIndex(1).active(true).course(course).build());
        Lesson video = lessonRepository.save(Lesson.builder().title("Intro").type(LessonType.VIDEO)
                .videoUrl("https://videos.example.com/a.mp4").orderIndex(1).active(true).module(module).build());
        Lesson check = lessonRepository.save(Lesson.builder().title("Check").type(LessonType.QUIZ)
                .orderIndex(2).active(true).module(module).build());
        String ownerToken = token(owner);
        ResponseEntity<Map> quiz = send(HttpMethod.POST, "/api/quizzes", Map.of(
                "lessonId", check.getId(), "title", "Check", "passingScore", 100,
                "questions", List.of(Map.of("questionText", "1+1?", "questionType", "SHORT_ANSWER", "correctAnswer", "2"))),
                ownerToken);
        assertThat(quiz.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Number quizId = (Number) quiz.getBody().get("id");
        Number questionId = (Number) ((List<Map<String, Object>>) quiz.getBody().get("questions")).get(0).get("id");

        User user = createStudentUser();
        enroll(user, course);
        String student = token(user);
        Long studentId = studentRepository.findByEmail(user.getEmail()).orElseThrow().getId();

        assertThat(send(HttpMethod.PUT, "/api/learning/lessons/" + video.getId() + "/activity",
                Map.of("positionSeconds", 95), student).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        Map<String, Object> state = get("/api/learning/courses/" + course.getId(), student).getBody();
        assertThat(state.get("lastLessonId")).isEqualTo(video.getId().intValue());
        assertThat(((Map<String, Object>) state.get("positions")).get(String.valueOf(video.getId()))).isEqualTo(95);

        ResponseEntity<Map> early = send(HttpMethod.POST, "/api/certificates/courses/" + course.getId(), null, student);
        assertThat(early.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(early.getBody().get("code")).isEqualTo("CRT_001");

        for (Lesson lesson : List.of(video, check)) {
            assertThat(send(HttpMethod.POST, "/api/enrollments/lessons/" + lesson.getId() + "/complete?studentId=" + studentId,
                    null, student).getStatusCode()).isEqualTo(HttpStatus.OK);
        }
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, course.getId()).orElseThrow();
        assertThat(enrollment.getProgress()).isEqualTo(100);
        assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.COMPLETED);

        // Lessons done but quiz not passed yet.
        Map<String, Object> eligibility = get("/api/certificates/courses/" + course.getId() + "/eligibility", student).getBody();
        assertThat(eligibility.get("eligible")).isEqualTo(false);
        assertThat(eligibility.get("quizzesRemaining")).isEqualTo(1);

        Number attemptId = (Number) send(HttpMethod.POST, "/api/quizzes/" + quizId + "/attempts", null, student)
                .getBody().get("id");
        ResponseEntity<Map> graded = send(HttpMethod.POST, "/api/quizzes/attempts/" + attemptId + "/submit",
                Map.of("answers", List.of(Map.of("questionId", questionId, "answerText", " 2 "))), student);
        assertThat(graded.getBody().get("passed")).isEqualTo(true);

        ResponseEntity<Map> issued = send(HttpMethod.POST, "/api/certificates/courses/" + course.getId(), null, student);
        assertThat(issued.getStatusCode()).isEqualTo(HttpStatus.OK);
        String code = (String) issued.getBody().get("code");
        assertThat(code).matches("[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}");
        // Claiming again returns the same certificate.
        assertThat(send(HttpMethod.POST, "/api/certificates/courses/" + course.getId(), null, student).getBody().get("code"))
                .isEqualTo(code);

        Map<String, Object> verified = getAnon("/api/certificates/verify/" + code.toLowerCase()).getBody();
        assertThat(verified.get("courseTitle")).isEqualTo(course.getTitle());
        assertThat(verified.get("studentName")).isEqualTo("Test Student");
        assertThat(restTemplate.getForEntity("/api/certificates/verify/NOPE-NOPE-NOPE", Map.class).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);

        Map<String, Object> dashboard = get("/api/learning/me", student).getBody();
        Map<String, Object> stats = (Map<String, Object>) dashboard.get("stats");
        assertThat(stats.get("completed")).isEqualTo(1);
        assertThat(stats.get("certificates")).isEqualTo(1);
        assertThat(stats.get("lessonsThisWeek")).isEqualTo(2);
        assertThat(stats.get("streakDays")).isEqualTo(1);
        List<Map<String, Object>> courses = (List<Map<String, Object>>) dashboard.get("courses");
        assertThat(courses).singleElement().satisfies(c -> {
            assertThat(c.get("certificateCode")).isEqualTo(code);
            assertThat(c.get("completedLessons")).isEqualTo(2);
            assertThat(c.get("lastLessonTitle")).isEqualTo("Intro");
        });
    }

    private Course course(String title, double price, boolean active) {
        Course course = courseRepository.save(Course.builder()
                .title(title).description("About " + title).instructor("Owner").ownerUserId(owner.getId())
                .price(price).duration(2).level("BEGINNER").category("GENERAL").active(active).build());
        courseIds.add(course.getId());
        return course;
    }

    private User createUser(User.Role role) {
        User user = authRepository.save(User.builder()
                .email(role.name().toLowerCase() + "-" + UUID.randomUUID() + "@test.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Test").lastName(role.name()).role(role).superAdmin(false).enabled(true)
                .authProvider(User.AuthProvider.LOCAL).build());
        userIds.add(user.getId());
        return user;
    }

    private User createStudentUser() {
        User user = createUser(User.Role.STUDENT);
        Student student = studentRepository.save(Student.builder()
                .email(user.getEmail()).firstName("Test").lastName("Student").active(true).build());
        studentIds.add(student.getId());
        return user;
    }

    private void enroll(User user, Course course) {
        Student student = studentRepository.findByEmail(user.getEmail()).orElseThrow();
        enrollmentRepository.save(Enrollment.builder().student(student).course(course)
                .status(EnrollmentStatus.ACTIVE).build());
    }

    private String token(User user) {
        return jwtTokenProvider.generateToken(user);
    }

    private ResponseEntity<Map> getAnon(String url) {
        return restTemplate.getForEntity(url, Map.class);
    }

    private ResponseEntity<Map> get(String url, String token) {
        return restTemplate.exchange(url, HttpMethod.GET, auth(null, token), Map.class);
    }

    private ResponseEntity<Map> send(HttpMethod method, String url, Object body, String token) {
        return restTemplate.exchange(url, method, auth(body, token), Map.class);
    }

    private HttpEntity<Object> auth(Object body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }
}
