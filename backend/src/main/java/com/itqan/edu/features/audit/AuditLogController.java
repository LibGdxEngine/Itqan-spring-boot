package com.itqan.edu.features.audit;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit Logs", description = "Audit trail APIs for security and compliance")
@SecurityRequirement(name = "Bearer Authentication")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @Operation(summary = "List all audit logs (paginated)")
    public ResponseEntity<Page<AuditLog>> getAll(
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(auditLogRepository.findAll(pageable));
    }

    @GetMapping("/actor/{userId}")
    @Operation(summary = "Get audit logs by actor user ID")
    public ResponseEntity<Page<AuditLog>> getByActor(
            @PathVariable Long userId,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(auditLogRepository.findByActorUserId(userId, pageable));
    }

    @GetMapping("/resource/{type}/{id}")
    @Operation(summary = "Get audit logs by resource type and ID")
    public ResponseEntity<Page<AuditLog>> getByResource(
            @PathVariable String type,
            @PathVariable String id,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(auditLogRepository.findByResourceTypeAndResourceId(type, id, pageable));
    }
}
