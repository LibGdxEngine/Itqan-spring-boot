package com.itqan.edu.features.admin.users;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.admin.users.dto.AdminUserRow;
import com.itqan.edu.features.auth.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin - Users", description = "Search and suspend user accounts")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @Operation(summary = "Search users across all roles")
    public ResponseEntity<Page<AdminUserRow>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) User.Role role,
            @RequestParam(required = false) Boolean enabled,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminUserService.search(q, role, enabled, pageable));
    }

    @GetMapping("/export")
    @Operation(summary = "All users matching the filters (for CSV export)")
    public ResponseEntity<List<AdminUserRow>> export(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) User.Role role,
            @RequestParam(required = false) Boolean enabled) {
        return ResponseEntity.ok(adminUserService.export(q, role, enabled));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Suspend or reactivate a user", description = "Body: {\"enabled\": true|false}")
    public ResponseEntity<AdminUserRow> setStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body,
            Authentication authentication) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        return ResponseEntity.ok(adminUserService.setEnabled(id, enabled, currentUserService.getCurrentUser(authentication)));
    }
}
