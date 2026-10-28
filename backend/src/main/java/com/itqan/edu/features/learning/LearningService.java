package com.itqan.edu.features.learning;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.certificates.Certificate;
import com.itqan.edu.features.certificates.CertificateRepository;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.Lesson;
import com.itqan.edu.features.courses.LessonRepository;
import com.itqan.edu.features.enrollments.Enrollment;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.enrollments.LessonEnrollment;
import com.itqan.edu.features.enrollments.LessonEnrollmentRepository;
import com.itqan.edu.features.students.Student;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

/** Where a student is in their courses: completions, resume positions, last lesson, streaks. */
@Service
@RequiredArgsConstructor
public class LearningService {

    private final EnrollmentRepository enrollmentRepository;
    private final LessonEnrollmentRepository lessonEnrollmentRepository;
    private final LessonRepository lessonRepository;
    private final CertificateRepository certificateRepository;

    public record CourseState(Long courseId, boolean enrolled, int progress, Long lastLessonId,
                              List<Long> completedLessonIds, Map<Long, Integer> positions,
                              String certificateCode) {
    }

    public record MyCourse(Long courseId, String title, String thumbnailUrl, String instructor,
                           EnrollmentStatus status, int progress, int totalLessons, int completedLessons,
                           Long lastLessonId, String lastLessonTitle, LocalDateTime enrolledAt,
                           LocalDateTime lastAccessedAt, String certificateCode) {
    }

    public record Stats(int inProgress, int completed, int certificates, int lessonsThisWeek, int streakDays) {
    }

    public record Dashboard(Stats stats, MyCourse continueLearning, List<MyCourse> courses) {
    }

    @Transactional(readOnly = true)
    public CourseState courseState(Student student, Long courseId) {
        Optional<Enrollment> enrollment = activeEnrollment(student.getId(), courseId);
        List<LessonEnrollment> rows =
                lessonEnrollmentRepository.findByStudent_IdAndLesson_Module_Course_Id(student.getId(), courseId);
        List<Long> completed = rows.stream()
                .filter(le -> Boolean.TRUE.equals(le.getIsCompleted()))
                .map(le -> le.getLesson().getId())
                .toList();
        Map<Long, Integer> positions = new HashMap<>();
        rows.stream()
                .filter(le -> le.getPositionSeconds() != null && le.getPositionSeconds() > 0)
                .forEach(le -> positions.put(le.getLesson().getId(), le.getPositionSeconds()));
        String certificate = certificateRepository.findByStudentIdAndCourseId(student.getId(), courseId)
                .map(Certificate::getCode)
                .orElse(null);
        return new CourseState(courseId, enrollment.isPresent(),
                enrollment.map(Enrollment::getProgress).orElse(0),
                enrollment.map(Enrollment::getLastLessonId).orElse(null),
                completed, positions, certificate);
    }

    /**
     * Records that the student opened a lesson and, when given, how far into the video they got.
     * Ignored for visitors without an enrollment (free previews are not tracked).
     */
    @Transactional
    public void recordActivity(Student student, Long lessonId, Integer positionSeconds) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        Long courseId = lesson.getModule().getCourse().getId();
        Optional<Enrollment> enrollment = activeEnrollment(student.getId(), courseId);
        if (enrollment.isEmpty()) {
            return;
        }
        Enrollment e = enrollment.get();
        e.setLastLessonId(lessonId);
        e.setLastAccessedAt(LocalDateTime.now());
        enrollmentRepository.save(e);

        if (positionSeconds != null) {
            LessonEnrollment row = lessonEnrollmentRepository.findByStudent_IdAndLesson_Id(student.getId(), lessonId)
                    .orElseGet(() -> LessonEnrollment.builder().student(student).lesson(lesson).build());
            row.setPositionSeconds(Math.max(0, positionSeconds));
            row.setLastWatchedAt(LocalDateTime.now());
            lessonEnrollmentRepository.save(row);
        }
    }

    @Transactional(readOnly = true)
    public Dashboard dashboard(Student student) {
        Map<Long, String> certificates = certificateRepository.findByStudentIdOrderByIssuedAtDesc(student.getId())
                .stream()
                .collect(Collectors.toMap(c -> c.getCourse().getId(), Certificate::getCode, (a, b) -> a));
        Set<Long> completedLessonIds = lessonEnrollmentRepository.findByStudent(student).stream()
                .filter(le -> Boolean.TRUE.equals(le.getIsCompleted()))
                .map(le -> le.getLesson().getId())
                .collect(Collectors.toCollection(HashSet::new));

        List<MyCourse> courses = enrollmentRepository.findByStudentId(student.getId()).stream()
                .filter(e -> e.getStatus() != EnrollmentStatus.DROPPED)
                .map(e -> toMyCourse(e, completedLessonIds, certificates.get(e.getCourse().getId())))
                .sorted(Comparator.comparing(
                        (MyCourse c) -> c.lastAccessedAt() != null ? c.lastAccessedAt() : c.enrolledAt(),
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        MyCourse continueLearning = courses.stream()
                .filter(c -> c.status() != EnrollmentStatus.COMPLETED && c.totalLessons() > 0)
                .findFirst()
                .orElse(null);

        List<LocalDateTime> completions = lessonEnrollmentRepository.completionTimes(student.getId());
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        int lessonsThisWeek = (int) completions.stream().filter(t -> t.isAfter(weekAgo)).count();

        Stats stats = new Stats(
                (int) courses.stream().filter(c -> c.status() != EnrollmentStatus.COMPLETED).count(),
                (int) courses.stream().filter(c -> c.status() == EnrollmentStatus.COMPLETED).count(),
                certificates.size(),
                lessonsThisWeek,
                streak(completions));
        return new Dashboard(stats, continueLearning, courses);
    }

    /** Consecutive days with at least one completed lesson, ending today or yesterday. */
    static int streak(List<LocalDateTime> completions) {
        TreeSet<LocalDate> days = completions.stream()
                .map(LocalDateTime::toLocalDate)
                .collect(Collectors.toCollection(TreeSet::new));
        LocalDate day = LocalDate.now();
        if (!days.contains(day)) {
            day = day.minusDays(1);
        }
        int streak = 0;
        while (days.contains(day)) {
            streak++;
            day = day.minusDays(1);
        }
        return streak;
    }

    private MyCourse toMyCourse(Enrollment e, Set<Long> completedLessonIds, String certificateCode) {
        Course course = e.getCourse();
        List<Lesson> visible = course.getModules().stream()
                .filter(m -> !Boolean.FALSE.equals(m.getActive()))
                .flatMap(m -> m.getLessons().stream())
                .filter(l -> !Boolean.FALSE.equals(l.getActive()))
                .toList();
        int done = (int) visible.stream().filter(l -> completedLessonIds.contains(l.getId())).count();
        String lastLessonTitle = e.getLastLessonId() == null ? null : visible.stream()
                .filter(l -> l.getId().equals(e.getLastLessonId()))
                .map(Lesson::getTitle)
                .findFirst()
                .orElse(null);
        return new MyCourse(course.getId(), course.getTitle(), course.getThumbnailUrl(), course.getInstructor(),
                e.getStatus(), e.getProgress() == null ? 0 : e.getProgress(), visible.size(), done,
                lastLessonTitle == null ? null : e.getLastLessonId(), lastLessonTitle, e.getEnrolledAt(),
                e.getLastAccessedAt(), certificateCode);
    }

    private Optional<Enrollment> activeEnrollment(Long studentId, Long courseId) {
        return enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .filter(e -> e.getStatus() != EnrollmentStatus.DROPPED);
    }
}
