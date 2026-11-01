package com.itqan.edu.features.scholarships;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.common.service.EmailService;
import com.itqan.edu.features.audit.AuditLogService;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentService;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.scholarships.dto.AdminScholarshipRow;
import com.itqan.edu.features.scholarships.dto.MyScholarshipApplication;
import com.itqan.edu.features.scholarships.dto.ScholarshipApplyRequest;
import com.itqan.edu.features.scholarships.dto.ScholarshipDecisionRequest;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Students asking for a free course, and admins deciding who receives one. */
@Service
@RequiredArgsConstructor
public class ScholarshipService {

    /** Serializes approvals so two admins cannot spend the same fund money twice (single backend instance). */
    private static final Object APPROVAL_LOCK = new Object();

    private final ScholarshipApplicationRepository applicationRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;
    private final DonationService donationService;
    private final AuditLogService auditLogService;
    private final EmailService emailService;
    private final PlatformTransactionManager transactionManager;

    // ---- Student side ----

    @Transactional
    public MyScholarshipApplication apply(ScholarshipApplyRequest request, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));
        Course course = courseRepository.findById(request.getCourseId())
                .filter(c -> !Boolean.FALSE.equals(c.getActive()))
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (course.getPrice() == null || course.getPrice() <= 0) {
            throw new BusinessException(ErrorCode.SCHOLARSHIP_COURSE_FREE);
        }
        boolean enrolled = enrollmentRepository.findByStudentIdAndCourseId(studentId, course.getId())
                .filter(e -> e.getStatus() != EnrollmentStatus.DROPPED)
                .isPresent();
        if (enrolled) {
            throw new BusinessException(ErrorCode.ENROLLMENT_ALREADY_EXISTS);
        }
        if (applicationRepository.existsByStudentIdAndCourseIdAndStatus(studentId, course.getId(), ScholarshipStatus.PENDING)) {
            throw new BusinessException(ErrorCode.SCHOLARSHIP_ALREADY_PENDING);
        }

        ScholarshipApplication application = applicationRepository.save(ScholarshipApplication.builder()
                .student(student)
                .course(course)
                .reason(request.getReason().trim())
                .circumstances(StringUtils.hasText(request.getCircumstances()) ? request.getCircumstances().trim() : null)
                .phone(StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null)
                .status(ScholarshipStatus.PENDING)
                .build());

        auditLogService.recordSuccess("SCHOLARSHIP_APPLIED", "SCHOLARSHIP", String.valueOf(application.getId()),
                Map.of("studentId", studentId, "courseId", course.getId()));
        return MyScholarshipApplication.from(application);
    }

    @Transactional(readOnly = true)
    public List<MyScholarshipApplication> listMine(Long studentId) {
        return applicationRepository.findForStudent(studentId).stream().map(MyScholarshipApplication::from).toList();
    }

    @Transactional
    public MyScholarshipApplication withdraw(Long applicationId, Long studentId) {
        ScholarshipApplication application = applicationRepository.findByIdForUpdate(applicationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SCHOLARSHIP_NOT_FOUND));
        if (!application.getStudent().getId().equals(studentId)) {
            throw new BusinessException(ErrorCode.SCHOLARSHIP_NOT_FOUND);
        }
        requirePending(application);
        application.setStatus(ScholarshipStatus.WITHDRAWN);
        application.setDecidedAt(LocalDateTime.now());
        return MyScholarshipApplication.from(applicationRepository.save(application));
    }

    // ---- Admin side ----

    @Transactional(readOnly = true)
    public Page<AdminScholarshipRow> search(String query, ScholarshipStatus status, Long courseId, Pageable pageable) {
        Specification<ScholarshipApplication> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (courseId != null) {
                predicates.add(cb.equal(root.get("course").get("id"), courseId));
            }
            if (StringUtils.hasText(query)) {
                Join<Object, Object> student = root.join("student");
                String like = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(student.get("email")), like),
                        cb.like(cb.lower(cb.coalesce(student.get("firstName"), "")), like),
                        cb.like(cb.lower(cb.coalesce(student.get("lastName"), "")), like)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return applicationRepository.findAll(spec, pageable).map(AdminScholarshipRow::from);
    }

    /**
     * Approves a request and enrolls the student for free. With {@link FundingSource#FUND} the course
     * price is taken from the donor fund, which must hold enough money.
     */
    public AdminScholarshipRow approve(Long applicationId, ScholarshipDecisionRequest request, Long adminUserId) {
        if (request == null || request.getFundingSource() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "fundingSource is required");
        }
        // The lock wraps the whole transaction, so the next approval sees this one's committed fund usage.
        synchronized (APPROVAL_LOCK) {
            AdminScholarshipRow row = new TransactionTemplate(transactionManager)
                    .execute(status -> approveInTransaction(applicationId, request, adminUserId));
            emailService.sendScholarshipDecision(row.studentEmail(), row.courseTitle(), true, row.adminNote());
            return row;
        }
    }

    private AdminScholarshipRow approveInTransaction(Long applicationId, ScholarshipDecisionRequest request, Long adminUserId) {
        {
            ScholarshipApplication application = applicationRepository.findByIdForUpdate(applicationId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.SCHOLARSHIP_NOT_FOUND));
            requirePending(application);
            Course course = application.getCourse();

            if (request.getFundingSource() == FundingSource.FUND) {
                double price = course.getPrice() == null ? 0 : course.getPrice();
                if (donationService.balance() + 1e-9 < price) {
                    throw new BusinessException(ErrorCode.SCHOLARSHIP_FUND_INSUFFICIENT);
                }
                application.setFundAmount(price);
            } else {
                application.setFundAmount(null);
            }

            application.setStatus(ScholarshipStatus.APPROVED);
            application.setFundingSource(request.getFundingSource());
            application.setAdminNote(trimToNull(request.getNote()));
            application.setDecidedByUserId(adminUserId);
            application.setDecidedAt(LocalDateTime.now());
            applicationRepository.saveAndFlush(application);

            enrollmentService.grantAccess(application.getStudent(), course);

            Map<String, Object> meta = new HashMap<>();
            meta.put("studentId", application.getStudent().getId());
            meta.put("courseId", course.getId());
            meta.put("fundingSource", request.getFundingSource().name());
            if (application.getFundAmount() != null) {
                meta.put("fundAmount", application.getFundAmount());
            }
            auditLogService.recordSuccess("SCHOLARSHIP_APPROVED", "SCHOLARSHIP", String.valueOf(application.getId()), meta);
            return AdminScholarshipRow.from(application);
        }
    }

    @Transactional
    public AdminScholarshipRow reject(Long applicationId, ScholarshipDecisionRequest request, Long adminUserId) {
        ScholarshipApplication application = applicationRepository.findByIdForUpdate(applicationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SCHOLARSHIP_NOT_FOUND));
        requirePending(application);
        application.setStatus(ScholarshipStatus.REJECTED);
        application.setAdminNote(request == null ? null : trimToNull(request.getNote()));
        application.setDecidedByUserId(adminUserId);
        application.setDecidedAt(LocalDateTime.now());
        applicationRepository.save(application);

        auditLogService.recordSuccess("SCHOLARSHIP_REJECTED", "SCHOLARSHIP", String.valueOf(application.getId()),
                Map.of("studentId", application.getStudent().getId(), "courseId", application.getCourse().getId()));
        emailService.sendScholarshipDecision(application.getStudent().getEmail(), application.getCourse().getTitle(),
                false, application.getAdminNote());
        return AdminScholarshipRow.from(application);
    }

    private static void requirePending(ScholarshipApplication application) {
        if (application.getStatus() != ScholarshipStatus.PENDING) {
            throw new BusinessException(ErrorCode.SCHOLARSHIP_NOT_PENDING);
        }
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
