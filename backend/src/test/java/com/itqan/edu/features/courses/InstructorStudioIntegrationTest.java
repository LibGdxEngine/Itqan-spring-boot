package com.itqan.edu.features.courses;

import com.itqan.edu.common.security.JwtTokenProvider;
import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.enrollments.Enrollment;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.quizzes.QuizRepository;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** Course builder, curriculum ordering, quiz builder and instructor analytics. */
class InstructorStudioIntegrationTest extends BaseIntegrationTest {

    @Autowired private AuthRepository authRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private ModuleRepository moduleRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private QuizRepository quizRepository;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private PasswordEncoder passwordEncoder;

    private final List<Long> createdUserIds = new ArrayList<>();
    private final List<Long> createdStudentIds = new ArrayList<>();
    private final List<Long> createdCourseIds = new ArrayList<>();

    private User owner;
    private User otherInstructor;
    private String ownerToken;

    @BeforeEach
    void setUp() {
        owner = createUser(User.Role.INSTRUCTOR);
        otherInstructor = createUser(User.Role.INSTRUCTOR);
        ownerToken = tokenFor(owner);
    }

    @AfterEach
    void tearDown() {
        enrollmentRepository.deleteAll();
        courseRepository.deleteAllById(createdCourseIds);
        studentRepository.deleteAllById(createdStudentIds);
        authRepository.deleteAllById(createdUserIds);
        createdCourseIds.clear();
        createdStudentIds.clear();
        createdUserIds.clear();
    }

    @Test
    @DisplayName("New courses are private drafts until published, and need a lesson to publish")
    void draftAndPublishWorkflow() {
        Long courseId = createCourse(0.0);

        Map<String, Object> created = get("/api/courses/" + courseId, ownerToken).getBody();
        assertThat(created.get("active")).isEqualTo(false);
        assertThat(created.get("instructor")).isEqualTo("Test INSTRUCTOR");
        assertThat(created.get("learningOutcomes")).isEqualTo(List.of("Build things", "Ship things"));
        assertThat(created.get("requirements")).isEqualTo(List.of("A laptop"));

        assertThat(restTemplate.getForEntity("/api/courses/" + courseId, Map.class).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(restTemplate.getForEntity("/api/courses?size=200", String.class).getBody())
                .doesNotContain("Studio course " + courseId);

        ResponseEntity<Map> notReady = send(HttpMethod.PATCH, "/api/courses/" + courseId + "/publish", null, ownerToken);
        assertThat(notReady.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(notReady.getBody().get("code")).isEqualTo("CRS_005");

        Long moduleId = createModule(courseId, "Intro", 1);
        createLesson(moduleId, "Welcome", "TEXT", Map.of("content", "Hello"));

        ResponseEntity<Map> denied = send(HttpMethod.PATCH, "/api/courses/" + courseId + "/publish", null,
                tokenFor(otherInstructor));
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<Map> published = send(HttpMethod.PATCH, "/api/courses/" + courseId + "/publish", null, ownerToken);
        assertThat(published.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(published.getBody().get("active")).isEqualTo(true);
        assertThat(restTemplate.getForEntity("/api/courses/" + courseId, Map.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Curriculum reorder moves lessons between modules and reorders modules atomically")
    void curriculumReorder() {
        Long courseId = createCourse(100.0);
        Long first = createModule(courseId, "First", 1);
        Long second = createModule(courseId, "Second", 2);
        Long a = createLesson(first, "A", "TEXT", Map.of());
        Long b = createLesson(first, "B", "TEXT", Map.of());
        Long c = createLesson(second, "C", "TEXT", Map.of());

        Map<String, Object> layout = Map.of("modules", List.of(
                Map.of("moduleId", second, "lessonIds", List.of(b, c)),
                Map.of("moduleId", first, "lessonIds", List.of(a))));

        assertThat(send(HttpMethod.PUT, "/api/courses/" + courseId + "/curriculum", layout, tokenFor(otherInstructor))
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(send(HttpMethod.PUT, "/api/courses/" + courseId + "/curriculum", layout, ownerToken)
                .getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        assertThat(moduleRepository.findById(second).orElseThrow().getOrderIndex()).isEqualTo(1);
        assertThat(moduleRepository.findById(first).orElseThrow().getOrderIndex()).isEqualTo(2);
        Lesson movedB = lessonRepository.findById(b).orElseThrow();
        assertThat(movedB.getModule().getId()).isEqualTo(second);
        assertThat(movedB.getOrderIndex()).isEqualTo(1);
        assertThat(lessonRepository.findById(c).orElseThrow().getOrderIndex()).isEqualTo(2);
        assertThat(lessonRepository.findByModuleIdOrderByOrderIndexAsc(first)).extracting(Lesson::getId).containsExactly(a);

        Map<String, Object> incomplete = Map.of("modules", List.of(
                Map.of("moduleId", second, "lessonIds", List.of(b)),
                Map.of("moduleId", first, "lessonIds", List.of(a))));
        ResponseEntity<Map> rejected = send(HttpMethod.PUT, "/api/courses/" + courseId + "/curriculum", incomplete, ownerToken);
        assertThat(rejected.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(rejected.getBody().get("code")).isEqualTo("CRS_004");
    }

    @Test
    @DisplayName("Hidden lessons are invisible to students but still listed for the owner")
    void hiddenLessons() {
        Long courseId = createCourse(100.0);
        Long moduleId = createModule(courseId, "M", 1);
        createLesson(moduleId, "Visible", "TEXT", Map.of("content", "Hi"));
        Long hidden = createLesson(moduleId, "Work in progress", "TEXT", Map.of("content", "Draft", "active", false));
        send(HttpMethod.PATCH, "/api/courses/" + courseId + "/publish", null, ownerToken);

        User student = createStudentUser();
        enroll(student, courseId);
        String studentToken = tokenFor(student);

        ResponseEntity<String> studentView = restTemplate.exchange("/api/courses/" + courseId, HttpMethod.GET,
                auth(null, studentToken), String.class);
        assertThat(studentView.getBody()).contains("Visible").doesNotContain("Work in progress");
        assertThat(restTemplate.getForEntity("/api/courses/" + courseId, String.class).getBody())
                .doesNotContain("Work in progress");
        assertThat(get("/api/lessons/" + hidden, studentToken).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        assertThat(restTemplate.exchange("/api/courses/" + courseId, HttpMethod.GET, auth(null, ownerToken), String.class)
                .getBody()).contains("Work in progress");
    }

    @Test
    @DisplayName("Resource lessons need an http(s) link")
    void resourceLessonValidation() {
        Long moduleId = createModule(createCourse(50.0), "M", 1);

        ResponseEntity<Map> missing = send(HttpMethod.POST, "/api/lessons",
                lessonBody(moduleId, "Slides", "RESOURCE", Map.of()), ownerToken);
        assertThat(missing.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(missing.getBody().get("code")).isEqualTo("CRS_006");

        ResponseEntity<Map> script = send(HttpMethod.POST, "/api/lessons",
                lessonBody(moduleId, "Slides", "RESOURCE", Map.of("resourceUrl", "javascript:alert(1)")), ownerToken);
        assertThat(script.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ResponseEntity<Map> ok = send(HttpMethod.POST, "/api/lessons",
                lessonBody(moduleId, "Slides", "RESOURCE", Map.of("resourceUrl", "https://files.example.com/a.pdf")),
                ownerToken);
        assertThat(ok.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(ok.getBody().get("type")).isEqualTo("RESOURCE");
    }

    @Test
    @DisplayName("Quiz builder: owner-only editing, answer key hidden from students, ids kept on edit")
    void quizBuilder() {
        Long courseId = createCourse(100.0);
        Long moduleId = createModule(courseId, "M", 1);
        Long lessonId = createLesson(moduleId, "Check", "QUIZ", Map.of());

        Map<String, Object> invalid = quizBody(lessonId, "Q", List.of(
                Map.of("questionText", "2+2?", "questionType", "MULTIPLE_CHOICE",
                        "options", List.of(Map.of("optionText", "3"), Map.of("optionText", "5")))));
        ResponseEntity<Map> rejected = send(HttpMethod.POST, "/api/quizzes", invalid, ownerToken);
        assertThat(rejected.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(rejected.getBody().get("code")).isEqualTo("QUZ_007");

        Map<String, Object> valid = quizBody(lessonId, "Arithmetic", List.of(
                Map.of("questionText", "2+2?", "questionType", "MULTIPLE_CHOICE",
                        "options", List.of(Map.of("optionText", "4", "isCorrect", true), Map.of("optionText", "5"))),
                Map.of("questionText", "Capital of Egypt?", "questionType", "SHORT_ANSWER", "correctAnswer", "Cairo")));
        assertThat(send(HttpMethod.POST, "/api/quizzes", valid, tokenFor(otherInstructor)).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        ResponseEntity<Map> created = send(HttpMethod.POST, "/api/quizzes", valid, ownerToken);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long quizId = ((Number) created.getBody().get("id")).longValue();

        // Lesson responses now point at the quiz.
        assertThat(get("/api/lessons/" + lessonId, ownerToken).getBody().get("quizId")).isEqualTo(quizId.intValue());

        User outsider = createStudentUser();
        assertThat(get("/api/quizzes/" + quizId, tokenFor(outsider)).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        User enrolled = createStudentUser();
        enroll(enrolled, courseId);
        ResponseEntity<String> studentView = restTemplate.exchange("/api/quizzes/" + quizId, HttpMethod.GET,
                auth(null, tokenFor(enrolled)), String.class);
        assertThat(studentView.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(studentView.getBody()).doesNotContain("\"isCorrect\":true").doesNotContain("Cairo");
        assertThat(get("/api/quizzes/" + quizId + "/edit", tokenFor(enrolled)).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        Map<String, Object> editor = get("/api/quizzes/" + quizId + "/edit", ownerToken).getBody();
        List<Map<String, Object>> questions = (List<Map<String, Object>>) editor.get("questions");
        assertThat(questions).hasSize(2);
        assertThat(questions.get(1).get("correctAnswer")).isEqualTo("Cairo");
        Number firstQuestionId = (Number) questions.get(0).get("id");
        List<Map<String, Object>> options = (List<Map<String, Object>>) questions.get(0).get("options");
        assertThat(options.get(0).get("isCorrect")).isEqualTo(true);

        // Edit: reword question 1 (same id), drop question 2, add a true/false question.
        Map<String, Object> edited = quizBody(lessonId, "Arithmetic v2", List.of(
                Map.of("id", firstQuestionId, "questionText", "What is 2+2?", "questionType", "MULTIPLE_CHOICE",
                        "options", List.of(
                                Map.of("id", options.get(0).get("id"), "optionText", "4", "isCorrect", true),
                                Map.of("id", options.get(1).get("id"), "optionText", "22"))),
                Map.of("questionText", "The sky is blue", "questionType", "TRUE_FALSE",
                        "options", List.of(Map.of("optionText", "True", "isCorrect", true), Map.of("optionText", "False")))));
        ResponseEntity<Map> updated = send(HttpMethod.PUT, "/api/quizzes/" + quizId, edited, ownerToken);
        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> updatedQuestions = (List<Map<String, Object>>) updated.getBody().get("questions");
        assertThat(updatedQuestions).hasSize(2);
        assertThat(((Number) updatedQuestions.get(0).get("id")).longValue()).isEqualTo(firstQuestionId.longValue());
        assertThat(updatedQuestions.get(0).get("questionText")).isEqualTo("What is 2+2?");
        assertThat(updatedQuestions.get(1).get("questionType")).isEqualTo("TRUE_FALSE");

        // Once a student has answered question 1, it can no longer be removed.
        String enrolledToken = tokenFor(enrolled);
        ResponseEntity<Map> attempt = send(HttpMethod.POST, "/api/quizzes/" + quizId + "/attempts", null, enrolledToken);
        assertThat(attempt.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Number attemptId = (Number) attempt.getBody().get("id");
        ResponseEntity<Map> submitted = send(HttpMethod.POST, "/api/quizzes/attempts/" + attemptId + "/submit",
                Map.of("answers", List.of(Map.of("questionId", firstQuestionId,
                        "selectedOptionIds", List.of(options.get(0).get("id"))))), enrolledToken);
        assertThat(submitted.getStatusCode()).isEqualTo(HttpStatus.OK);

        Map<String, Object> dropFirst = quizBody(lessonId, "Arithmetic v3", List.of(
                Map.of("id", updatedQuestions.get(1).get("id"), "questionText", "The sky is blue", "questionType", "TRUE_FALSE",
                        "options", List.of(
                                Map.of("id", ((List<Map<String, Object>>) updatedQuestions.get(1).get("options")).get(0).get("id"),
                                        "optionText", "True", "isCorrect", true),
                                Map.of("id", ((List<Map<String, Object>>) updatedQuestions.get(1).get("options")).get(1).get("id"),
                                        "optionText", "False")))));
        ResponseEntity<Map> refused = send(HttpMethod.PUT, "/api/quizzes/" + quizId, dropFirst, ownerToken);
        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(refused.getBody().get("code")).isEqualTo("QUZ_008");

        assertThat(send(HttpMethod.DELETE, "/api/quizzes/" + quizId, null, ownerToken).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(quizRepository.findById(quizId)).isEmpty();
        assertThat(lessonRepository.findById(lessonId)).isPresent();
    }

    @Test
    @DisplayName("Instructor analytics only covers the caller's own courses")
    void instructorAnalytics() {
        Long courseId = createCourse(100.0);
        Long moduleId = createModule(courseId, "M", 1);
        createLesson(moduleId, "L1", "TEXT", Map.of());
        enroll(createStudentUser(), courseId);

        ResponseEntity<Map> overview = get("/api/instructor/analytics", ownerToken);
        assertThat(overview.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> summary = (Map<String, Object>) overview.getBody().get("summary");
        assertThat(summary.get("totalCourses")).isEqualTo(1);
        assertThat(summary.get("totalStudents")).isEqualTo(1);
        assertThat(summary.get("newEnrollments")).isEqualTo(1);
        List<Map<String, Object>> courses = (List<Map<String, Object>>) overview.getBody().get("courses");
        assertThat(courses).singleElement().satisfies(row -> {
            assertThat(row.get("students")).isEqualTo(1);
            assertThat(row.get("lessons")).isEqualTo(1);
        });

        Map<String, Object> otherSummary = (Map<String, Object>) get("/api/instructor/analytics",
                tokenFor(otherInstructor)).getBody().get("summary");
        assertThat(otherSummary.get("totalCourses")).isEqualTo(0);

        ResponseEntity<Map> detail = get("/api/instructor/analytics/courses/" + courseId, ownerToken);
        assertThat(detail.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((List<?>) detail.getBody().get("lessons")).hasSize(1);
        assertThat(get("/api/instructor/analytics/courses/" + courseId, tokenFor(otherInstructor)).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    private Long createCourse(double price) {
        Map<String, Object> body = new HashMap<>();
        body.put("title", "Studio course " + UUID.randomUUID());
        body.put("description", "A course built in the studio");
        body.put("price", price);
        body.put("duration", 3);
        body.put("level", "BEGINNER");
        body.put("category", "GENERAL");
        body.put("learningOutcomes", List.of("Build things", " ", "Ship things"));
        body.put("requirements", List.of("A laptop"));
        ResponseEntity<Map> response = send(HttpMethod.POST, "/api/courses", body, ownerToken);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long id = ((Number) response.getBody().get("id")).longValue();
        createdCourseIds.add(id);
        return id;
    }

    private Long createModule(Long courseId, String title, int order) {
        ResponseEntity<Map> response = send(HttpMethod.POST, "/api/modules",
                Map.of("courseId", courseId, "title", title, "orderIndex", order), ownerToken);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return ((Number) response.getBody().get("id")).longValue();
    }

    private Long createLesson(Long moduleId, String title, String type, Map<String, Object> extra) {
        ResponseEntity<Map> response = send(HttpMethod.POST, "/api/lessons",
                lessonBody(moduleId, title, type, extra), ownerToken);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return ((Number) response.getBody().get("id")).longValue();
    }

    private static Map<String, Object> lessonBody(Long moduleId, String title, String type, Map<String, Object> extra) {
        Map<String, Object> body = new HashMap<>(extra);
        body.put("moduleId", moduleId);
        body.put("title", title);
        body.put("type", type);
        body.put("orderIndex", 1);
        return body;
    }

    private static Map<String, Object> quizBody(Long lessonId, String title, List<Map<String, Object>> questions) {
        Map<String, Object> body = new HashMap<>();
        body.put("lessonId", lessonId);
        body.put("title", title);
        body.put("passingScore", 60);
        body.put("questions", questions);
        return body;
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

    private void enroll(User studentUser, Long courseId) {
        Student student = studentRepository.findByEmail(studentUser.getEmail()).orElseThrow();
        enrollmentRepository.save(Enrollment.builder()
                .student(student)
                .course(courseRepository.findById(courseId).orElseThrow())
                .status(EnrollmentStatus.ACTIVE)
                .build());
    }

    private String tokenFor(User user) {
        return jwtTokenProvider.generateToken(user);
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
