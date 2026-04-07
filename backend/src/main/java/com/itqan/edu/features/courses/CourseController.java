package com.itqan.edu.features.courses;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.courses.dto.CourseRequest;
import com.itqan.edu.features.courses.dto.CourseResponse;
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
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Tag(name = "Courses", description = "Course management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class CourseController {

    private final CourseService courseService;
    private final CurrentUserService currentUserService;

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Create a new course", description = "Create a new course")
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CourseRequest request,
            Authentication authentication) {
        CourseResponse response = courseService.createCourse(request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get course by ID", description = "Get a course by its ID")
    public ResponseEntity<CourseResponse> getCourseById(@PathVariable Long id) {
        CourseResponse response = courseService.getCourseById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Get all courses", description = "Get all courses")
    public ResponseEntity<List<CourseResponse>> getAllCourses() {
        List<CourseResponse> courses = courseService.getAllCourses();
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/active")
    @Operation(summary = "Get active courses", description = "Get all active courses")
    public ResponseEntity<List<CourseResponse>> getActiveCourses() {
        List<CourseResponse> courses = courseService.getActiveCourses();
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Get current instructor courses", description = "Get courses owned by current instructor")
    public ResponseEntity<List<CourseResponse>> getMyCourses(Authentication authentication) {
        List<CourseResponse> courses = courseService.getMyCourses(currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/search")
    @Operation(summary = "Search and filter courses", description = "Search courses with optional filters")
    public ResponseEntity<List<CourseResponse>> searchCourses(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false, defaultValue = "newest") String sort) {
        List<CourseResponse> courses = courseService.searchAndFilterCourses(
                query, level, category, minPrice, maxPrice, sort);
        return ResponseEntity.ok(courses);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Update course", description = "Update an existing course")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseRequest request,
            Authentication authentication) {
        CourseResponse response = courseService.updateCourse(id, request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Delete course", description = "Delete a course")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id, Authentication authentication) {
        courseService.deleteCourse(id, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Deactivate course", description = "Deactivate a course")
    public ResponseEntity<CourseResponse> deactivateCourse(@PathVariable Long id, Authentication authentication) {
        CourseResponse response = courseService.deactivateCourse(id, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(response);
    }
}
