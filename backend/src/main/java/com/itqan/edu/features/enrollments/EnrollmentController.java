package com.itqan.edu.features.enrollments;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.enrollments.dto.EnrollmentRequest;
import com.itqan.edu.features.enrollments.dto.EnrollmentResponse;
import com.itqan.edu.features.students.StudentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
@Tag(name = "Enrollments", description = "Student enrollment management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final StudentRepository studentRepository;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @Operation(summary = "Enroll student", description = "Enroll current student in a course")
    public ResponseEntity<EnrollmentResponse> enrollStudent(
            @Valid @RequestBody EnrollmentRequest request,
            Authentication authentication) {
        Long currentStudentId = getCurrentStudentId(authentication);
        if (!isAdmin(authentication) && !currentStudentId.equals(request.getStudentId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        EnrollmentResponse response = enrollmentService.enrollStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/student/{studentId}")
    @Operation(summary = "Get student enrollments (paginated)", description = "Get all enrollments for a student with pagination")
    public ResponseEntity<Page<EnrollmentResponse>> getStudentEnrollments(
            @PathVariable Long studentId,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication authentication) {
        enforceStudentScope(authentication, studentId);
        Page<EnrollmentResponse> enrollments = enrollmentService.getStudentEnrollments(studentId, pageable);
        return ResponseEntity.ok(enrollments);
    }

    @GetMapping("/check")
    @Operation(summary = "Check enrollment", description = "Check if student is enrolled in a course")
    public ResponseEntity<Boolean> checkEnrollment(
            @RequestParam Long studentId,
            @RequestParam Long courseId,
            Authentication authentication) {
        enforceStudentScope(authentication, studentId);
        boolean isEnrolled = enrollmentService.checkEnrollment(studentId, courseId);
        return ResponseEntity.ok(isEnrolled);
    }

    @PostMapping("/lessons/{lessonId}/complete")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @Operation(summary = "Mark lesson as complete", description = "Mark a lesson as completed for a student")
    public ResponseEntity<Void> completeLesson(
            @RequestParam Long studentId,
            @PathVariable Long lessonId,
            Authentication authentication) {
        enforceStudentScope(authentication, studentId);
        enrollmentService.completeLesson(studentId, lessonId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/lessons/{lessonId}/complete")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @Operation(summary = "Mark lesson as incomplete", description = "Mark a lesson as incomplete for a student")
    public ResponseEntity<Void> markLessonIncomplete(
            @RequestParam Long studentId,
            @PathVariable Long lessonId,
            Authentication authentication) {
        enforceStudentScope(authentication, studentId);
        enrollmentService.markLessonIncomplete(studentId, lessonId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/student/{studentId}/course/{courseId}/completed-lessons")
    @Operation(summary = "Get completed lessons", description = "Get list of completed lesson IDs for a student in a course")
    public ResponseEntity<List<Long>> getCompletedLessons(
            @PathVariable Long studentId,
            @PathVariable Long courseId,
            Authentication authentication) {
        enforceStudentScope(authentication, studentId);
        List<Long> completedLessons = enrollmentService.getCompletedLessons(studentId, courseId);
        return ResponseEntity.ok(completedLessons);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete enrollment", description = "Unenroll student from a course")
    public ResponseEntity<Void> deleteEnrollment(@PathVariable Long id) {
        enrollmentService.deleteEnrollment(id);
        return ResponseEntity.noContent().build();
    }

    private void enforceStudentScope(Authentication authentication, Long requestedStudentId) {
        if (isAdmin(authentication)) {
            return;
        }
        Long currentStudentId = getCurrentStudentId(authentication);
        if (!currentStudentId.equals(requestedStudentId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private Long getCurrentStudentId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return studentRepository.findByEmail(email)
                .map(student -> student.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));
    }
}
