package com.itqan.edu.features.admin.enrollments;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.admin.enrollments.dto.AdminEnrollmentRow;
import com.itqan.edu.features.admin.enrollments.dto.GrantEnrollmentRequest;
import com.itqan.edu.features.audit.AuditLogService;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.Enrollment;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentService;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Admin view of all enrollments, plus manual grants (e.g. after a WhatsApp / cash payment). */
@Service
@RequiredArgsConstructor
public class AdminEnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final AuditLogService auditLogService;
    private final EnrollmentService enrollmentService;

    @Transactional(readOnly = true)
    public Page<AdminEnrollmentRow> search(String query, Long courseId, EnrollmentStatus status, Pageable pageable) {
        return enrollmentRepository.findAll(filter(query, courseId, status), pageable).map(AdminEnrollmentRow::from);
    }

    @Transactional(readOnly = true)
    public List<AdminEnrollmentRow> export(String query, Long courseId, EnrollmentStatus status) {
        return enrollmentRepository.findAll(filter(query, courseId, status)).stream()
                .map(AdminEnrollmentRow::from).toList();
    }

    /** Enrolls a student without a payment check; reactivates a dropped enrollment. */
    @Transactional
    public AdminEnrollmentRow grant(GrantEnrollmentRequest request) {
        Student student = studentRepository.findByEmail(request.getStudentEmail().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        Enrollment enrollment = enrollmentService.grantAccess(student, course);
        auditLogService.recordSuccess("ENROLLMENT_GRANTED", "ENROLLMENT", String.valueOf(enrollment.getId()),
                Map.of("studentId", student.getId(), "courseId", course.getId()));
        return AdminEnrollmentRow.from(enrollment);
    }

    @Transactional
    public AdminEnrollmentRow updateStatus(Long enrollmentId, EnrollmentStatus status) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENROLLMENT_NOT_FOUND));
        enrollment.setStatus(status);
        enrollment = enrollmentRepository.save(enrollment);
        auditLogService.recordSuccess("ENROLLMENT_STATUS_CHANGED", "ENROLLMENT", String.valueOf(enrollmentId),
                Map.of("status", status.name()));
        return AdminEnrollmentRow.from(enrollment);
    }

    private Specification<Enrollment> filter(String query, Long courseId, EnrollmentStatus status) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Enrollment, Student> student = root.join("student");
            Join<Enrollment, Course> course = root.join("course");
            if (StringUtils.hasText(query)) {
                String like = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(student.get("email")), like),
                        cb.like(cb.lower(student.get("firstName")), like),
                        cb.like(cb.lower(student.get("lastName")), like),
                        cb.like(cb.lower(course.get("title")), like)));
            }
            if (courseId != null) {
                predicates.add(cb.equal(course.get("id"), courseId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
