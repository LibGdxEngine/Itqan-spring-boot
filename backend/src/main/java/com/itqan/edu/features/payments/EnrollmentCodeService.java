package com.itqan.edu.features.payments;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.Enrollment;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnrollmentCodeService {

    private final EnrollmentCodeRepository enrollmentCodeRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;

    private static final String CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
    private static final int CODE_LENGTH = 12;
    private static final SecureRandom random = new SecureRandom();

    @Transactional
    public List<EnrollmentCode> generateCodes(Long courseId, Long createdBy, int quantity,
            Integer usageLimit, LocalDateTime expiresAt) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        List<EnrollmentCode> codes = new ArrayList<>();

        for (int i = 0; i < quantity; i++) {
            String code = generateUniqueCode();

            EnrollmentCode enrollmentCode = EnrollmentCode.builder()
                    .code(code)
                    .course(course)
                    .createdBy(createdBy)
                    .usageLimit(usageLimit != null ? usageLimit : 1)
                    .expiresAt(expiresAt)
                    .build();

            codes.add(enrollmentCodeRepository.save(enrollmentCode));
        }

        log.info("Generated {} enrollment codes for course: {}", quantity, courseId);
        return codes;
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = generateRandomCode();
        } while (enrollmentCodeRepository.existsByCode(code));
        return code;
    }

    private String generateRandomCode() {
        StringBuilder code = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(CODE_CHARACTERS.charAt(random.nextInt(CODE_CHARACTERS.length())));
        }
        // Format as XXXX-XXXX-XXXX for better readability
        return code.substring(0, 4) + "-" + code.substring(4, 8) + "-" + code.substring(8, 12);
    }

    @Transactional(readOnly = true)
    public EnrollmentCode validateCode(String code) {
        String normalized = code == null ? "" : code.trim().toUpperCase(java.util.Locale.ROOT);
        EnrollmentCode enrollmentCode = enrollmentCodeRepository.findByCodeAndIsActiveTrue(normalized)
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_INVALID));

        if (!enrollmentCode.isValid()) {
            throw new BusinessException(ErrorCode.CODE_EXPIRED);
        }

        return enrollmentCode;
    }

    @Transactional
    public Enrollment redeemCode(String code, Long studentId) {
        EnrollmentCode enrollmentCode = validateCode(code);

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));

        Course course = enrollmentCode.getCourse();

        // Students who already have (non-dropped) access must not burn a code use
        var existing = enrollmentRepository.findByStudentIdAndCourseId(studentId, course.getId());
        if (existing.isPresent() && existing.get().getStatus() != EnrollmentStatus.DROPPED) {
            throw new BusinessException(ErrorCode.ENROLLMENT_ALREADY_EXISTS);
        }

        Enrollment enrollment = existing.orElseGet(() -> Enrollment.builder()
                .student(student)
                .course(course)
                .progress(0)
                .build());
        enrollment.setStatus(EnrollmentStatus.ACTIVE);
        enrollment = enrollmentRepository.save(enrollment);

        // Increment code usage
        enrollmentCode.incrementUsage();
        enrollmentCodeRepository.save(enrollmentCode);

        log.info("Code {} redeemed by student: {} for course: {}",
                code, studentId, course.getId());

        return enrollment;
    }

    @Transactional(readOnly = true)
    public List<EnrollmentCode> getCoursesCodes(Long courseId) {
        return enrollmentCodeRepository.findActiveCoursesCodes(courseId);
    }

    @Transactional
    public void deactivateCode(Long codeId) {
        EnrollmentCode code = enrollmentCodeRepository.findById(codeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_INVALID));

        code.setIsActive(false);
        enrollmentCodeRepository.save(code);
        log.info("Deactivated enrollment code: {}", codeId);
    }
}
