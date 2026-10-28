package com.itqan.edu.features.courses;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.courses.dto.ModuleRequest;
import com.itqan.edu.features.courses.dto.ModuleResponse;
import com.itqan.edu.features.courses.dto.LessonReorderRequest;
import com.itqan.edu.features.courses.dto.LessonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/modules")
@RequiredArgsConstructor
@Tag(name = "Modules", description = "Course modules management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class ModuleController {

    private final ModuleService moduleService;
    private final CurrentUserService currentUserService;

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Create a new module", description = "Create a new module")
    public ResponseEntity<ModuleResponse> createModule(
            @Valid @RequestBody ModuleRequest request,
            Authentication authentication) {
        ModuleResponse response = moduleService.createModule(request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get module by ID", description = "Get a module by its ID")
    public ResponseEntity<ModuleResponse> getModuleById(@PathVariable Long id, Authentication authentication) {
        ModuleResponse response = moduleService.getModuleById(id, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/course/{courseId}")
    @Operation(summary = "Get modules by course ID", description = "Get all modules for a specific course")
    public ResponseEntity<List<ModuleResponse>> getModulesByCourseId(
            @PathVariable Long courseId,
            Authentication authentication) {
        List<ModuleResponse> modules = moduleService.getModulesByCourseId(
                courseId, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(modules);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Update module", description = "Update an existing module")
    public ResponseEntity<ModuleResponse> updateModule(
            @PathVariable Long id,
            @Valid @RequestBody ModuleRequest request,
            Authentication authentication) {
        ModuleResponse response = moduleService.updateModule(id, request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Delete module", description = "Delete a module")
    public ResponseEntity<Void> deleteModule(@PathVariable Long id, Authentication authentication) {
        moduleService.deleteModule(id, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/lessons/reorder")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Reorder module lessons", description = "Reorder lessons within a module by drag-and-drop order")
    public ResponseEntity<List<LessonResponse>> reorderLessons(
            @PathVariable Long id,
            @Valid @RequestBody LessonReorderRequest request,
            Authentication authentication) {
        List<LessonResponse> lessons = moduleService.reorderLessons(
                id, request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(lessons);
    }
}
