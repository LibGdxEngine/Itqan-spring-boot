package com.itqan.edu.features.admin.content;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.admin.content.dto.ModuleReorderRequest;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.Module;
import com.itqan.edu.features.courses.dto.CourseResponse;
import com.itqan.edu.features.courses.dto.ModuleResponse;
import com.itqan.edu.features.courses.mapper.CourseMapper;
import com.itqan.edu.features.courses.mapper.ModuleMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminContentController {

    private final AdminContentService adminContentService;
    private final CurrentUserService currentUserService;
    private final CourseMapper courseMapper;
    private final ModuleMapper moduleMapper;

    @PatchMapping("/courses/{courseId}/modules/reorder")
    public ResponseEntity<List<ModuleResponse>> reorderModules(
            @PathVariable Long courseId,
            @Valid @RequestBody ModuleReorderRequest request) {
        List<Module> modules = adminContentService.reorderModules(courseId, request);
        return ResponseEntity.ok(modules.stream().map(moduleMapper::toResponse).toList());
    }

    @PostMapping("/courses/{courseId}/duplicate")
    public ResponseEntity<CourseResponse> duplicateCourse(
            @PathVariable Long courseId,
            Authentication authentication) {
        Long adminUserId = currentUserService.getCurrentUser(authentication).getId();
        Course duplicated = adminContentService.duplicateCourse(courseId, adminUserId);
        return ResponseEntity.ok(courseMapper.toResponse(duplicated));
    }
}
