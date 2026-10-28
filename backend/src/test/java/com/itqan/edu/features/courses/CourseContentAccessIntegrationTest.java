package com.itqan.edu.features.courses;

import com.itqan.edu.common.security.JwtTokenProvider;
import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.enrollments.Enrollment;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.enrollments.LessonEnrollmentRepository;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Who can see and change course content: anonymous visitors, non-enrolled and enrolled students,
 * other instructors, the owning instructor and admins.
 */
class CourseContentAccessIntegrationTest extends BaseIntegrationTest {

    @Autowired private AuthRepository authRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private ModuleRepository moduleRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private LessonEnrollmentRepository lessonEnrollmentRepository;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private PasswordEncoder passwordEncoder;

    private final List<Long> createdUserIds = new ArrayList<>();
    private final List<Long> createdStudentIds = new ArrayList<>();

    private User owner;
    private User otherInstructor;
    private User admin;
    private Course course;
    private Module module;
    private Lesson paidLesson;
    private Lesson freeLesson;

    @BeforeEach
    void setUp() {
        owner = createUser(User.Role.INSTRUCTOR);
        otherInstructor = createUser(User.Role.INSTRUCTOR);
        admin = createUser(User.Role.ADMIN);

        course = courseRepository.save(Course.builder()
                .title("Paid course")
                .description("desc")
                .instructor("Owner")
                .ownerUserId(owner.getId())
                .price(100.0)
                .duration(10)
                .level("BEGINNER")
                .category("GENERAL")
                .active(true)
                .build());
        module = moduleRepository.save(Module.builder()
                .title("Module 1")
                .orderIndex(1)
                .active(true)
                .course(course)
                .build());
        paidLesson = lessonRepository.save(Lesson.builder()
                .title("Paid lesson")
                .type(LessonType.VIDEO)
                .videoUrl("https://videos.example.com/secret.mp4")
                .videoStatus(LessonVideoStatus.READY)
                .content("Secret paid content")
                .orderIndex(1)
                .isFree(false)
                .active(true)
                .module(module)
                .build());
        freeLesson = lessonRepository.save(Lesson.builder()
                .title("Free preview")
                .type(LessonType.VIDEO)
                .videoUrl("https://videos.example.com/preview.mp4")
                .videoStatus(LessonVideoStatus.READY)
                .content("Preview content")
                .orderIndex(2)
                .isFree(true)
                .active(true)
                .module(module)
                .build());
    }

    @AfterEach
    void tearDown() {
        lessonEnrollmentRepository.deleteAll();
        enrollmentRepository.deleteAll();
        courseRepository.deleteById(course.getId());
        studentRepository.deleteAllById(createdStudentIds);
        authRepository.deleteAllById(createdUserIds);
        createdStudentIds.clear();
        createdUserIds.clear();
    }

    @Test
    @DisplayName("Anonymous course detail shows the curriculum but no paid lesson content")
    void anonymousCourseDetailIsRedacted() {
        ResponseEntity<Map> response = restTemplate.getForEntity("/api/courses/{id}", Map.class, course.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> lesson = firstLesson(response.getBody());
        assertThat(lesson.get("title")).isEqualTo("Paid lesson");
        assertThat(lesson.get("videoUrl")).isNull();
        assertThat(lesson.get("content")).isNull();
        assertThat(lesson.get("videoObjectKey")).isNull();
    }

    @Test
    @DisplayName("Course catalog listing never includes paid lesson content")
    void catalogListingIsRedacted() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/courses/active?size=100", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).doesNotContain("secret.mp4").doesNotContain("Secret paid content");
    }

    @Test
    @DisplayName("Non-enrolled student cannot read a paid lesson or get its playback URL")
    void nonEnrolledStudentIsDenied() {
        String token = tokenFor(createStudentUser());

        assertThat(get("/api/lessons/" + paidLesson.getId(), token).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(get("/api/lessons/" + paidLesson.getId() + "/video/playback-url", token).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Any signed-in student can open a free preview lesson")
    void freeLessonIsOpenToSignedInUsers() {
        String token = tokenFor(createStudentUser());

        ResponseEntity<Map> response = get("/api/lessons/" + freeLesson.getId(), token);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("content")).isEqualTo("Preview content");
    }

    @Test
    @DisplayName("Enrolled student gets full lesson content and the full course")
    void enrolledStudentHasFullAccess() {
        User studentUser = createStudentUser();
        enroll(studentUser);
        String token = tokenFor(studentUser);

        ResponseEntity<Map> lesson = get("/api/lessons/" + paidLesson.getId(), token);
        assertThat(lesson.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(lesson.getBody().get("content")).isEqualTo("Secret paid content");

        ResponseEntity<Map> playback = get("/api/lessons/" + paidLesson.getId() + "/video/playback-url", token);
        assertThat(playback.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> courseResponse = get("/api/courses/" + course.getId(), token);
        assertThat(firstLesson(courseResponse.getBody()).get("content")).isEqualTo("Secret paid content");
    }

    @Test
    @DisplayName("Student cannot mark lessons complete in a course they are not enrolled in")
    void completeLessonRequiresEnrollment() {
        User studentUser = createStudentUser();
        Long studentId = studentRepository.findByEmail(studentUser.getEmail()).orElseThrow().getId();

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/enrollments/lessons/{lessonId}/complete?studentId={studentId}",
                HttpMethod.POST, auth(null, tokenFor(studentUser)), Map.class, paidLesson.getId(), studentId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Another instructor cannot edit the course content; the owner can")
    void onlyOwnerInstructorCanEditLessons() {
        Map<String, Object> update = Map.of(
                "title", "Renamed", "type", "VIDEO", "orderIndex", 1, "moduleId", module.getId());

        ResponseEntity<Map> denied = restTemplate.exchange("/api/lessons/{id}", HttpMethod.PUT,
                auth(update, tokenFor(otherInstructor)), Map.class, paidLesson.getId());
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> allowed = restTemplate.exchange("/api/lessons/{id}", HttpMethod.PUT,
                auth(update, tokenFor(owner)), Map.class, paidLesson.getId());
        assertThat(allowed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(allowed.getBody().get("title")).isEqualTo("Renamed");
    }

    @Test
    @DisplayName("Another instructor cannot delete a module; an admin can add one")
    void moduleManagementIsScopedToOwnerAndAdmin() {
        ResponseEntity<Map> denied = restTemplate.exchange("/api/modules/{id}", HttpMethod.DELETE,
                auth(null, tokenFor(otherInstructor)), Map.class, module.getId());
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        Map<String, Object> newModule = Map.of("title", "Admin module", "orderIndex", 2, "courseId", course.getId());
        ResponseEntity<Map> created = restTemplate.exchange("/api/modules", HttpMethod.POST,
                auth(newModule, tokenFor(admin)), Map.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @DisplayName("Students can read only their own student record")
    void studentRecordIsSelfOnly() {
        User alice = createStudentUser();
        User bob = createStudentUser();
        Long aliceStudentId = studentRepository.findByEmail(alice.getEmail()).orElseThrow().getId();

        assertThat(get("/api/students/" + aliceStudentId, tokenFor(bob)).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(get("/api/students/" + aliceStudentId, tokenFor(alice)).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Deactivated student loses API access and cannot log in")
    void deactivatedStudentIsLockedOut() {
        User studentUser = createStudentUser();
        String studentToken = tokenFor(studentUser);
        Long studentId = studentRepository.findByEmail(studentUser.getEmail()).orElseThrow().getId();

        ResponseEntity<Map> deactivated = restTemplate.exchange("/api/students/{id}/deactivate", HttpMethod.PATCH,
                auth(null, tokenFor(admin)), Map.class, studentId);
        assertThat(deactivated.getStatusCode()).isEqualTo(HttpStatus.OK);

        assertThat(get("/api/students/profile", studentToken).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> login = restTemplate.postForEntity("/api/auth/login",
                new HttpEntity<>(Map.of("email", studentUser.getEmail(), "password", "password123"), headers),
                Map.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(login.getBody().get("code")).isEqualTo("AUTH_010");
    }

    // --- helpers ---

    @SuppressWarnings("unchecked")
    private Map<String, Object> firstLesson(Map<String, Object> courseBody) {
        List<Map<String, Object>> modules = (List<Map<String, Object>>) courseBody.get("modules");
        List<Map<String, Object>> lessons = (List<Map<String, Object>>) modules.get(0).get("lessons");
        return lessons.stream().filter(l -> "Paid lesson".equals(l.get("title"))).findFirst().orElseThrow();
    }

    private User createUser(User.Role role) {
        User user = authRepository.save(User.builder()
                .email(role.name().toLowerCase() + "-" + UUID.randomUUID() + "@test.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Test")
                .lastName(role.name())
                .role(role)
                .superAdmin(false)
                .enabled(true)
                .authProvider(User.AuthProvider.LOCAL)
                .build());
        createdUserIds.add(user.getId());
        return user;
    }

    private User createStudentUser() {
        User user = createUser(User.Role.STUDENT);
        Student student = studentRepository.save(Student.builder()
                .email(user.getEmail())
                .firstName("Test")
                .lastName("Student")
                .active(true)
                .build());
        createdStudentIds.add(student.getId());
        return user;
    }

    private void enroll(User studentUser) {
        Student student = studentRepository.findByEmail(studentUser.getEmail()).orElseThrow();
        enrollmentRepository.save(Enrollment.builder()
                .student(student)
                .course(course)
                .status(EnrollmentStatus.ACTIVE)
                .build());
    }

    private String tokenFor(User user) {
        return jwtTokenProvider.generateToken(user);
    }

    private ResponseEntity<Map> get(String url, String token) {
        return restTemplate.exchange(url, HttpMethod.GET, auth(null, token), Map.class);
    }

    private HttpEntity<Object> auth(Object body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }
}
