package com.itqan.edu.features.certificates;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.courses.Lesson;
import com.itqan.edu.features.courses.Module;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.enrollments.LessonEnrollmentRepository;
import com.itqan.edu.features.quizzes.Quiz;
import com.itqan.edu.features.quizzes.QuizAttemptRepository;
import com.itqan.edu.features.students.Student;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Issues a certificate once a student has completed every visible lesson of a course and
 * passed every quiz in it.
 */
@Service
@RequiredArgsConstructor
public class CertificateService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CertificateRepository certificateRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonEnrollmentRepository lessonEnrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public record CertificateResponse(String code, Long courseId, String courseTitle, String studentName,
                                      String instructorName, LocalDateTime issuedAt) {
    }

    /** What is still missing before the certificate can be issued. */
    public record Eligibility(boolean eligible, int lessonsRemaining, int quizzesRemaining) {
    }

    @Transactional(readOnly = true)
    public Eligibility eligibility(Student student, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        return eligibility(student, course);
    }

    private Eligibility eligibility(Student student, Course course) {
        boolean enrolled = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), course.getId())
                .filter(e -> e.getStatus() != EnrollmentStatus.DROPPED)
                .isPresent();
        if (!enrolled) {
            return new Eligibility(false, -1, -1);
        }
        Set<Long> completed = lessonEnrollmentRepository
                .findByStudent_IdAndLesson_Module_Course_Id(student.getId(), course.getId()).stream()
                .filter(le -> Boolean.TRUE.equals(le.getIsCompleted()))
                .map(le -> le.getLesson().getId())
                .collect(Collectors.toSet());

        int lessonsRemaining = 0;
        List<Quiz> quizzes = new ArrayList<>();
        for (Module module : course.getModules()) {
            if (Boolean.FALSE.equals(module.getActive())) {
                continue;
            }
            if (module.getQuiz() != null) {
                quizzes.add(module.getQuiz());
            }
            for (Lesson lesson : module.getLessons()) {
                if (Boolean.FALSE.equals(lesson.getActive())) {
                    continue;
                }
                if (!completed.contains(lesson.getId())) {
                    lessonsRemaining++;
                }
                if (lesson.getQuiz() != null && !lesson.getQuiz().getQuestions().isEmpty()) {
                    quizzes.add(lesson.getQuiz());
                }
            }
        }
        int quizzesRemaining = (int) quizzes.stream()
                .filter(q -> !quizAttemptRepository.existsByStudent_IdAndQuiz_IdAndPassedTrue(student.getId(), q.getId()))
                .count();
        boolean hasLessons = course.getModules().stream().anyMatch(m -> !m.getLessons().isEmpty());
        return new Eligibility(hasLessons && lessonsRemaining == 0 && quizzesRemaining == 0,
                lessonsRemaining, quizzesRemaining);
    }

    /** Returns the existing certificate or issues one if the student has earned it. */
    @Transactional
    public CertificateResponse claim(Student student, Long courseId) {
        var existing = certificateRepository.findByStudentIdAndCourseId(student.getId(), courseId);
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        if (!eligibility(student, course).eligible()) {
            throw new BusinessException(ErrorCode.CERTIFICATE_NOT_EARNED);
        }
        Certificate certificate = certificateRepository.save(Certificate.builder()
                .code(newCode())
                .student(student)
                .course(course)
                .studentName(fullName(student))
                .courseTitle(course.getTitle())
                .instructorName(course.getInstructor())
                .issuedAt(LocalDateTime.now())
                .build());
        return toResponse(certificate);
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> mine(Student student) {
        return certificateRepository.findByStudentIdOrderByIssuedAtDesc(student.getId()).stream()
                .map(CertificateService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CertificateResponse verify(String code) {
        return certificateRepository.findByCode(code.trim().toUpperCase())
                .map(CertificateService::toResponse)
                .orElseThrow(() -> new BusinessException(ErrorCode.CERTIFICATE_NOT_FOUND));
    }

    private String newCode() {
        while (true) {
            StringBuilder code = new StringBuilder();
            for (int i = 0; i < 12; i++) {
                if (i > 0 && i % 4 == 0) {
                    code.append('-');
                }
                code.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            if (certificateRepository.findByCode(code.toString()).isEmpty()) {
                return code.toString();
            }
        }
    }

    private static String fullName(Student student) {
        String name = ((student.getFirstName() == null ? "" : student.getFirstName()) + " "
                + (student.getLastName() == null ? "" : student.getLastName())).trim();
        return name.isEmpty() ? student.getEmail() : name;
    }

    private static CertificateResponse toResponse(Certificate c) {
        return new CertificateResponse(c.getCode(), c.getCourse().getId(), c.getCourseTitle(), c.getStudentName(),
                c.getInstructorName(), c.getIssuedAt());
    }
}
