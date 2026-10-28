package com.itqan.edu.features.audit;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.util.StringUtils;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
    @Operation(summary = "Search audit logs (paginated, newest first)",
            description = "q matches action, actor email or resource id; filters are optional")
    public ResponseEntity<Page<AuditLog>> getAll(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) AuditLog.AuditStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Specification<AuditLog> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(q)) {
                String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("action")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("actorEmail"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("resourceId"), "")), like)));
            }
            if (StringUtils.hasText(resourceType)) {
                predicates.add(cb.equal(root.get("resourceType"), resourceType));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to.atTime(LocalTime.MAX)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return ResponseEntity.ok(auditLogRepository.findAll(spec, pageable));
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
