package com.itqan.edu.features.admin.payments;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.admin.payments.dto.AdminPaymentRow;
import com.itqan.edu.features.admin.payments.dto.ManualPaymentRequest;
import com.itqan.edu.features.audit.AuditLogService;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.EnrollmentService;
import com.itqan.edu.features.payments.Payment;
import com.itqan.edu.features.payments.PaymentRepository;
import com.itqan.edu.features.payments.PaymentStatus;
import com.itqan.edu.features.payments.stripe.StripeGateway;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Payment ledger for admins: search, record offline payments, and refund. */
@Service
@RequiredArgsConstructor
public class AdminPaymentService {

    static final String MANUAL_GATEWAY = "MANUAL";
    static final String STRIPE_GATEWAY = "STRIPE";

    private final PaymentRepository paymentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentService enrollmentService;
    private final StripeGateway stripeGateway;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<AdminPaymentRow> search(String query, PaymentStatus status, Long courseId, String gateway, Pageable pageable) {
        return paymentRepository.findAll(filter(query, status, courseId, gateway), pageable).map(AdminPaymentRow::from);
    }

    @Transactional(readOnly = true)
    public List<AdminPaymentRow> export(String query, PaymentStatus status, Long courseId, String gateway) {
        return paymentRepository.findAll(filter(query, status, courseId, gateway)).stream()
                .map(AdminPaymentRow::from).toList();
    }

    /**
     * Records a payment received outside the site (Vodafone Cash, InstaPay, cash, bank transfer)
     * as COMPLETED and gives the student access to the course.
     */
    @CacheEvict(value = "analytics", allEntries = true)
    @Transactional
    public AdminPaymentRow recordManualPayment(ManualPaymentRequest request) {
        Student student = studentRepository.findByEmail(request.getStudentEmail().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();
        Payment payment = paymentRepository.save(Payment.builder()
                .student(student)
                .course(course)
                .amount(request.getAmount())
                .originalAmount(request.getAmount())
                .currency(request.getCurrency().trim().toUpperCase(Locale.ROOT))
                .status(PaymentStatus.COMPLETED)
                .paymentGateway(MANUAL_GATEWAY)
                .paymentMethod(request.getMethod())
                .transactionId(StringUtils.hasText(request.getReference()) ? request.getReference().trim() : null)
                .notes(request.getNotes())
                .createdAt(now)
                .completedAt(now)
                .build());

        enrollmentService.grantAccess(student, course);

        auditLogService.recordSuccess("PAYMENT_RECORDED_MANUALLY", "PAYMENT", String.valueOf(payment.getId()),
                Map.of("studentId", student.getId(), "courseId", course.getId(),
                        "amount", payment.getAmount(), "currency", payment.getCurrency(),
                        "method", String.valueOf(request.getMethod())));
        return AdminPaymentRow.from(payment);
    }

    /**
     * Refunds a completed payment and revokes course access. Stripe payments are refunded through
     * Stripe; manual payments are only marked refunded (the money is returned offline).
     */
    @CacheEvict(value = "analytics", allEntries = true)
    @Transactional
    public AdminPaymentRow refund(Long paymentId, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));
        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_PROCESSED, "Only completed payments can be refunded");
        }

        if (STRIPE_GATEWAY.equalsIgnoreCase(payment.getPaymentGateway())) {
            if (!StringUtils.hasText(payment.getStripePaymentIntentId())) {
                throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR, "Stripe payment intent is missing");
            }
            stripeGateway.refundPaymentIntent(payment.getStripePaymentIntentId());
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        if (StringUtils.hasText(reason)) {
            String previous = StringUtils.hasText(payment.getNotes()) ? payment.getNotes() + "\n" : "";
            payment.setNotes(previous + "Refund: " + reason.trim());
        }
        paymentRepository.save(payment);
        enrollmentService.revokeAccess(payment.getStudent().getId(), payment.getCourse().getId());

        auditLogService.recordSuccess("PAYMENT_REFUNDED", "PAYMENT", String.valueOf(payment.getId()),
                Map.of("amount", payment.getAmount(), "currency", payment.getCurrency(),
                        "reason", reason == null ? "" : reason));
        return AdminPaymentRow.from(payment);
    }

    private Specification<Payment> filter(String query, PaymentStatus status, Long courseId, String gateway) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Payment, Student> student = root.join("student");
            Join<Payment, Course> course = root.join("course");
            if (StringUtils.hasText(query)) {
                String like = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(student.get("email")), like),
                        cb.like(cb.lower(student.get("firstName")), like),
                        cb.like(cb.lower(student.get("lastName")), like),
                        cb.like(cb.lower(course.get("title")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("transactionId"), "")), like)));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (courseId != null) {
                predicates.add(cb.equal(course.get("id"), courseId));
            }
            if (StringUtils.hasText(gateway)) {
                predicates.add(cb.equal(cb.upper(root.get("paymentGateway")), gateway.trim().toUpperCase(Locale.ROOT)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
