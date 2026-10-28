package com.itqan.edu.features.admin.courses;

import com.itqan.edu.features.admin.courses.dto.AdminCourseRow;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/courses")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin - Courses", description = "Course catalogue management")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminCourseController {

    private final AdminCourseService adminCourseService;

    @GetMapping
    @Operation(summary = "Search all courses (published and drafts)")
    public ResponseEntity<Page<AdminCourseRow>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminCourseService.search(q, active, category, pageable));
    }

    @GetMapping("/options")
    @Operation(summary = "Lightweight id/title list of every course, for pickers")
    public ResponseEntity<List<Map<String, Object>>> options() {
        return ResponseEntity.ok(adminCourseService.options());
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Publish or unpublish a course", description = "Body: {\"active\": true|false}")
    public ResponseEntity<AdminCourseRow> setStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(adminCourseService.setActive(id, Boolean.TRUE.equals(body.get("active"))));
    }
}
