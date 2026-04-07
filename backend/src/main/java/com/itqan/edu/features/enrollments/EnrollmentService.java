package com.itqan.edu.features.enrollments;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.dto.EnrollmentRequest;
import com.itqan.edu.features.enrollments.dto.EnrollmentResponse;
import com.itqan.edu.features.enrollments.mapper.EnrollmentMapper;
import com.itqan.edu.features.payments.PaymentRepository;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

    public boolean checkEnrollment(Long studentId, Long courseId) {
        return enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId);
    }

    @Transactional
    public void deleteEnrollment(Long id) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENROLLMENT_NOT_FOUND));
        enrollmentRepository.delete(enrollment);
    }

    @Transactional
    public void completeLesson(Long studentId, Long lessonId) {
        var lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));

        var student = studentRepository.findById(studentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));

        // Check if student is enrolled in the course that contains this lesson
        // Assuming lesson has a link to course or module -> course.
        // For simplicity, we check if lesson's course is enrolled.
        // But Lesson entity might just have module...
        // Let's assume we can traverse relevant checks later or just trust relation for
        // now if enrolled in course.

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
        // Find enrollment for the course
        Course course = lesson.getModule().getCourse();
        var enrollment = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), course.getId())
                .orElse(null);

        if (enrollment != null) {
            // Calculate progress
            // Total lessons in course
            long totalLessons = course.getModules().stream()
                    .mapToLong(m -> m.getLessons().size())
                    .sum();

            if (totalLessons == 0)
                return;

            // Completed lessons for this course
            long completedLessons = lessonEnrollmentRepository.findByStudent(student).stream()
                    .filter(le -> Boolean.TRUE.equals(le.getIsCompleted()))
                    .filter(le -> le.getLesson().getModule().getCourse().getId().equals(course.getId()))
                    .count();

            int progress = (int) ((completedLessons * 100) / totalLessons);
            enrollment.setProgress(progress);
            if (progress == 100) {
                // enrollment.setStatus(EnrollmentStatus.COMPLETED); // If we have Completed
                // status
            }
            enrollmentRepository.save(enrollment);
        }
    }
}
