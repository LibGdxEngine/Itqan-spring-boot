package com.itqan.edu.features.admin.enrollments;

import com.itqan.edu.features.admin.enrollments.dto.AdminEnrollmentRow;
import com.itqan.edu.features.admin.enrollments.dto.GrantEnrollmentRequest;
import com.itqan.edu.features.enrollments.EnrollmentService;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/enrollments")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin - Enrollments", description = "Browse, grant and revoke course access")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminEnrollmentController {

    private final AdminEnrollmentService adminEnrollmentService;
    private final EnrollmentService enrollmentService;

    @GetMapping
    @Operation(summary = "Search enrollments")
    public ResponseEntity<Page<AdminEnrollmentRow>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) EnrollmentStatus status,
            @PageableDefault(size = 20, sort = "enrolledAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminEnrollmentService.search(q, courseId, status, pageable));
    }

    @GetMapping("/export")
    @Operation(summary = "All enrollments matching the filters (for CSV export)")
    public ResponseEntity<List<AdminEnrollmentRow>> export(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) EnrollmentStatus status) {
        return ResponseEntity.ok(adminEnrollmentService.export(q, courseId, status));
    }

    @PostMapping
    @Operation(summary = "Grant a student access to a course without payment")
    public ResponseEntity<AdminEnrollmentRow> grant(@Valid @RequestBody GrantEnrollmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminEnrollmentService.grant(request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Change enrollment status", description = "Body: {\"status\": \"ACTIVE|COMPLETED|DROPPED\"}")
    public ResponseEntity<AdminEnrollmentRow> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, EnrollmentStatus> body) {
        EnrollmentStatus status = body.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(adminEnrollmentService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an enrollment")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        enrollmentService.deleteEnrollment(id);
        return ResponseEntity.noContent().build();
    }
}
