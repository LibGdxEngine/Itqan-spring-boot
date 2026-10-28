package com.itqan.edu.features.courses;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.dto.CourseRequest;
import com.itqan.edu.features.courses.dto.CourseResponse;
import com.itqan.edu.features.courses.dto.CurriculumOrderRequest;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.dto.ThumbnailUploadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Tag(name = "Courses", description = "Course management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class CourseController {

    private final CourseService courseService;
    private final CurrentUserService currentUserService;
    private final CourseAccessService courseAccessService;

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Create a new course", description = "Create a new course")
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CourseRequest request,
            Authentication authentication) {
        CourseResponse response = courseService.createCourse(request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/thumbnail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Upload a course thumbnail image",
            description = "Upload a JPEG, PNG, or WebP image (max 5MB) and receive a public URL")
    public ResponseEntity<ThumbnailUploadResponse> uploadThumbnail(
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(courseService.uploadThumbnail(file));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get course by ID", description = "Get a course by its ID")
    public ResponseEntity<CourseResponse> getCourseById(@PathVariable Long id, Authentication authentication) {
        CourseResponse response = courseService.getCourseById(id);
        User viewer = currentUserService.findCurrentUser(authentication).orElse(null);
        // Drafts are only visible to their managers and to students already enrolled.
        if (!Boolean.TRUE.equals(response.getActive()) && !courseAccessService.canSeeDraft(viewer, response)) {
            throw new BusinessException(ErrorCode.COURSE_NOT_FOUND);
        }
        return ResponseEntity.ok(courseAccessService.forViewer(response, viewer));
    }

    @GetMapping
    @Operation(summary = "Get all courses (paginated)", description = "Get all courses with pagination")
    public ResponseEntity<Page<CourseResponse>> getAllCourses(
            @PageableDefault(size = 20) Pageable pageable,
            Authentication authentication) {
        boolean isAdmin = currentUserService.findCurrentUser(authentication)
                .map(user -> user.getRole() == User.Role.ADMIN)
                .orElse(false);
        // Only admins list drafts here; everyone else gets the published catalog.
        Page<CourseResponse> courses = isAdmin
                ? courseService.getAllCourses(pageable)
                : courseService.getActiveCourses(pageable);
        return ResponseEntity.ok(forCatalog(courses, authentication));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active courses (paginated)", description = "Get all active courses with pagination")
    public ResponseEntity<Page<CourseResponse>> getActiveCourses(
            @PageableDefault(size = 20) Pageable pageable,
            Authentication authentication) {
        Page<CourseResponse> courses = courseService.getActiveCourses(pageable);
        return ResponseEntity.ok(forCatalog(courses, authentication));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Get current instructor courses (paginated)", description = "Get courses owned by current instructor")
    public ResponseEntity<Page<CourseResponse>> getMyCourses(
            Authentication authentication,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<CourseResponse> courses = courseService.getMyCourses(currentUserService.getCurrentUser(authentication), pageable);
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
            @RequestParam(required = false, defaultValue = "newest") String sort,
            Authentication authentication) {
        List<CourseResponse> courses = courseService.searchAndFilterCourses(
                query, level, category, minPrice, maxPrice, sort);
        User viewer = currentUserService.findCurrentUser(authentication).orElse(null);
        return ResponseEntity.ok(courseAccessService.forCatalog(courses, viewer));
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

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Publish course", description = "Make a draft course visible in the catalog")
    public ResponseEntity<CourseResponse> publishCourse(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(courseService.publishCourse(id, currentUserService.getCurrentUser(authentication)));
    }

    @PutMapping("/{id}/curriculum")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Reorder curriculum",
            description = "Set module order, lesson order and lesson placement for the whole course")
    public ResponseEntity<Void> reorderCurriculum(
            @PathVariable Long id,
            @Valid @RequestBody CurriculumOrderRequest request,
            Authentication authentication) {
        courseService.reorderCurriculum(id, request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Deactivate course", description = "Deactivate a course")
    public ResponseEntity<CourseResponse> deactivateCourse(@PathVariable Long id, Authentication authentication) {
        CourseResponse response = courseService.deactivateCourse(id, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(response);
    }

    private Page<CourseResponse> forCatalog(Page<CourseResponse> page, Authentication authentication) {
        User viewer = currentUserService.findCurrentUser(authentication).orElse(null);
        List<CourseResponse> content = courseAccessService.forCatalog(page.getContent(), viewer);
        return new PageImpl<>(content, page.getPageable(), page.getTotalElements());
    }
}
