package com.itqan.edu.features.admin.content;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.admin.content.dto.ModuleReorderRequest;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.Lesson;
import com.itqan.edu.features.courses.Module;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminContentController {

    private final AdminContentService adminContentService;
    private final CurrentUserService currentUserService;

    @PatchMapping("/courses/{courseId}/modules/reorder")
    public ResponseEntity<List<Module>> reorderModules(
            @PathVariable Long courseId,
            @Valid @RequestBody ModuleReorderRequest request) {
        List<Module> modules = adminContentService.reorderModules(courseId, request);
        return ResponseEntity.ok(modules);
    }

    @PostMapping("/courses/{courseId}/duplicate")
    public ResponseEntity<Course> duplicateCourse(
            @PathVariable Long courseId,
            Authentication authentication) {
        Long adminUserId = currentUserService.getCurrentUser(authentication).getId();
        Course duplicated = adminContentService.duplicateCourse(courseId, adminUserId);
        return ResponseEntity.ok(duplicated);
    }

    @PostMapping("/modules/{moduleId}/lessons/bulk-upload")
    public ResponseEntity<List<Lesson>> bulkUploadLessons(
            @PathVariable Long moduleId,
            @RequestParam("files") List<MultipartFile> files) {
        List<Lesson> lessons = adminContentService.bulkUploadLessons(moduleId, files);
        return ResponseEntity.ok(lessons);
    }
}
