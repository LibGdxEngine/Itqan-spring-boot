package com.itqan.edu.features.instructors;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.instructors.dto.InstructorCreateRequest;
import com.itqan.edu.features.instructors.dto.InstructorResponse;
import com.itqan.edu.features.instructors.dto.InstructorUpdateRequest;
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
import org.springframework.web.multipart.MultipartFile;
import com.itqan.edu.features.courses.dto.ThumbnailUploadResponse;

@RestController
@RequestMapping("/api/instructors")
@RequiredArgsConstructor
@Tag(name = "Instructors", description = "Instructor management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class InstructorController {

    private final InstructorService instructorService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all instructors (paginated)", description = "Get all instructor users with pagination")
    public ResponseEntity<Page<InstructorResponse>> getAllInstructors(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(instructorService.getAllInstructors(pageable));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create instructor", description = "Create a new instructor user (super admin only)")
    public ResponseEntity<InstructorResponse> createInstructor(
            @Valid @RequestBody InstructorCreateRequest request,
            Authentication authentication) {
        InstructorResponse response = instructorService.createInstructor(request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update instructor", description = "Update an existing instructor user (super admin only)")
    public ResponseEntity<InstructorResponse> updateInstructor(
            @PathVariable Long id,
            @Valid @RequestBody InstructorUpdateRequest request,
            Authentication authentication) {
        InstructorResponse response = instructorService.updateInstructor(id, request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate instructor", description = "Deactivate an instructor user (super admin only)")
    public ResponseEntity<InstructorResponse> deactivateInstructor(
            @PathVariable Long id,
            Authentication authentication) {
        InstructorResponse response = instructorService.deactivateInstructor(id, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/photo")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Upload an instructor profile photo, returns its public URL")
    public ResponseEntity<ThumbnailUploadResponse> uploadPhoto(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(instructorService.uploadPhoto(file));
    }
}
