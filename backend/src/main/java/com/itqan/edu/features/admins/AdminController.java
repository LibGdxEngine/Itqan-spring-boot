package com.itqan.edu.features.admins;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.admins.dto.AdminCreateRequest;
import com.itqan.edu.features.admins.dto.AdminResponse;
import com.itqan.edu.features.admins.dto.AdminUpdateRequest;
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

@RestController
@RequestMapping("/api/admins")
@RequiredArgsConstructor
@Tag(name = "Admins", description = "Admin management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminController {

    private final AdminService adminService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all admins (paginated)", description = "Get all admin users with pagination")
    public ResponseEntity<Page<AdminResponse>> getAllAdmins(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllAdmins(pageable));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create admin", description = "Create a new admin user (super admin only)")
    public ResponseEntity<AdminResponse> createAdmin(
            @Valid @RequestBody AdminCreateRequest request,
            Authentication authentication) {
        AdminResponse response = adminService.createAdmin(request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update admin", description = "Update an existing admin user (super admin only)")
    public ResponseEntity<AdminResponse> updateAdmin(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateRequest request,
            Authentication authentication) {
        AdminResponse response = adminService.updateAdmin(id, request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(response);
    }
}
