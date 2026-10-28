package com.itqan.edu.features.enrollments;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.audit.AuditLogService;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.dto.EnrollmentRequest;
import com.itqan.edu.features.enrollments.dto.EnrollmentResponse;
import com.itqan.edu.features.enrollments.mapper.EnrollmentMapper;
import com.itqan.edu.features.payments.PaymentRepository;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentMapper enrollmentMapper;
    private final LessonEnrollmentRepository lessonEnrollmentRepository;
    private final com.itqan.edu.features.courses.LessonRepository lessonRepository;
    private final PaymentRepository paymentRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public EnrollmentResponse enrollStudent(EnrollmentRequest request) {
        if (enrollmentRepository.existsByStudentIdAndCourseId(request.getStudentId(), request.getCourseId())) {
            // For now, return existing enrollment or throw error.
            // Let's throw error to be explicit, or return the existing one.
            // UX wise, if they click enroll again, we can just redirect them.
            // But for API, let's complain. Or strict check.
            // ErrorCode.ENROLLMENT_ALREADY_EXISTS? I'll use BusinessException generic for
            // now if needed, or create one.
            // I'll reuse VALIDATION_ERROR or generic conflict.
            // Actually, I should probably check if status is DROPPED and reactivate.
            // For MVP, simplistic check.
            throw new BusinessException(ErrorCode.ENROLLMENT_ALREADY_EXISTS);
        }

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (course.getPrice() != null && course.getPrice() > 0
                && !paymentRepository.hasCompletedPayment(request.getStudentId(), request.getCourseId())) {
            throw new BusinessException(ErrorCode.PAYMENT_REQUIRED);
        }

        Enrollment enrollment = enrollmentMapper.toEntity(request);
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setStatus(EnrollmentStatus.ACTIVE);

        enrollment = enrollmentRepository.save(enrollment);
        auditLogService.recordSuccess("ENROLLMENT_CREATED", "ENROLLMENT", String.valueOf(enrollment.getId()),
                Map.of("studentId", student.getId(), "courseId", course.getId()));
        return enrollmentMapper.toResponse(enrollment);
    }

    public List<EnrollmentResponse> getStudentEnrollments(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new BusinessException(ErrorCode.STUDENT_NOT_FOUND);
        }
        return enrollmentRepository.findByStudentId(studentId).stream()
                .map(enrollmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    public Page<EnrollmentResponse> getStudentEnrollments(Long studentId, Pageable pageable) {
        if (!studentRepository.existsById(studentId)) {
            throw new BusinessException(ErrorCode.STUDENT_NOT_FOUND);
        }
        return enrollmentRepository.findByStudentId(studentId, pageable)
                .map(enrollmentMapper::toResponse);
    }

    public boolean checkEnrollment(Long studentId, Long courseId) {
        return enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .filter(e -> e.getStatus() != EnrollmentStatus.DROPPED)
                .isPresent();
    }

    /**
     * Gives a student access to a course regardless of payment (used after a confirmed payment
     * or a manual admin grant). Reactivates a dropped enrollment; no-op for an active one.
     */
    @Transactional
    public Enrollment grantAccess(Student student, Course course) {
        return enrollmentRepository.findByStudentIdAndCourseId(student.getId(), course.getId())
                .map(existing -> {
                    if (existing.getStatus() == EnrollmentStatus.DROPPED) {
                        existing.setStatus(EnrollmentStatus.ACTIVE);
                        return enrollmentRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> enrollmentRepository.save(Enrollment.builder()
                        .student(student)
                        .course(course)
                        .status(EnrollmentStatus.ACTIVE)
                        .progress(0)
                        .build()));
    }

    /** Revokes access (e.g. after a refund) while keeping the progress history. */
    @Transactional
    public void revokeAccess(Long studentId, Long courseId) {
        enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId).ifPresent(enrollment -> {
            enrollment.setStatus(EnrollmentStatus.DROPPED);
            enrollmentRepository.save(enrollment);
        });
    }

    @Transactional
    public void deleteEnrollment(Long id) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENROLLMENT_NOT_FOUND));
        enrollmentRepository.delete(enrollment);
        auditLogService.recordSuccess("ENROLLMENT_DELETED", "ENROLLMENT", String.valueOf(id), null);
    }

    @Transactional
    public void completeLesson(Long studentId, Long lessonId) {
        var lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));

        var student = studentRepository.findById(studentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));

        Long courseId = lesson.getModule().getCourse().getId();
        boolean enrolled = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .filter(e -> e.getStatus() != EnrollmentStatus.DROPPED)
                .isPresent();
        if (!enrolled) {
            throw new BusinessException(ErrorCode.COURSE_ACCESS_DENIED);
        }

        // Find existing lesson enrollment or create new
        var lessonEnrollment = lessonEnrollmentRepository.findByStudentAndLesson(student, lesson)
                .orElse(LessonEnrollment.builder()
                        .student(student)
                        .lesson(lesson)
                        .build());

        if (Boolean.TRUE.equals(lessonEnrollment.getIsCompleted())) {
            return; // Already completed
        }

        lessonEnrollment.markCompleted();
        lessonEnrollmentRepository.save(lessonEnrollment);

        // Update overall course progress
        updateCourseProgress(student, lesson);
    }

    @Transactional
    public void markLessonIncomplete(Long studentId, Long lessonId) {
        var lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));

        var student = studentRepository.findById(studentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));

        var lessonEnrollment = lessonEnrollmentRepository.findByStudentAndLesson(student, lesson)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_ENROLLED));

        lessonEnrollment.markIncomplete();
        lessonEnrollmentRepository.save(lessonEnrollment);

        // Update overall course progress
        updateCourseProgress(student, lesson);
    }

    public List<Long> getCompletedLessons(Long studentId, Long courseId) {
        // Need to filter lessons by course logic, or simpler:
        // Get all completed lessons for student, filtered by those belonging to the
        // course?
        // Or if LessonEnrollment had courseId...
        // For now, let's just get all enrollments for student and filter in memory or
        // query if needed?
        // Better: Find all lessons for course, then find completions.
        // Or we can just return IDs of completed lessons for that student.
        // The repository method countByStudentAndIsCompletedTrue is for all courses...

        // Let's rely on retrieving enrollments for a student.
        // Currently simpler:
        return lessonEnrollmentRepository.findByStudent(studentRepository.getReferenceById(studentId))
                .stream()
                .filter(le -> Boolean.TRUE.equals(le.getIsCompleted()))
                // Filter by course... Lesson -> Module -> Course
                .filter(le -> le.getLesson().getModule().getCourse().getId().equals(courseId))
                .map(le -> le.getLesson().getId())
                .collect(Collectors.toList());
    }

    private void updateCourseProgress(Student student, com.itqan.edu.features.courses.Lesson lesson) {
        Course course = lesson.getModule().getCourse();
        var enrollment = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), course.getId())
                .orElse(null);
        if (enrollment == null) {
            return;
        }

        // Only lessons students can see count towards progress.
        java.util.Set<Long> visibleLessonIds = course.getModules().stream()
                .filter(m -> !Boolean.FALSE.equals(m.getActive()))
                .flatMap(m -> m.getLessons().stream())
                .filter(l -> !Boolean.FALSE.equals(l.getActive()))
                .map(com.itqan.edu.features.courses.Lesson::getId)
                .collect(java.util.stream.Collectors.toSet());
        if (visibleLessonIds.isEmpty()) {
            return;
        }

        long completedLessons = lessonEnrollmentRepository.findByStudent(student).stream()
                .filter(le -> Boolean.TRUE.equals(le.getIsCompleted()))
                .filter(le -> visibleLessonIds.contains(le.getLesson().getId()))
                .count();

        int progress = (int) ((completedLessons * 100) / visibleLessonIds.size());
        enrollment.setProgress(progress);
        if (progress == 100 && enrollment.getStatus() == EnrollmentStatus.ACTIVE) {
            enrollment.setStatus(EnrollmentStatus.COMPLETED);
            enrollment.setCompletedAt(LocalDateTime.now());
        } else if (progress < 100 && enrollment.getStatus() == EnrollmentStatus.COMPLETED) {
            enrollment.setStatus(EnrollmentStatus.ACTIVE);
            enrollment.setCompletedAt(null);
        }
        enrollmentRepository.save(enrollment);
    }
}
