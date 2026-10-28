package com.itqan.edu.features.courses;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.dto.LessonRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartAbortRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartCompleteRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartInitiateRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartInitiateResponse;
import com.itqan.edu.features.courses.dto.LessonVideoPlaybackResponse;
import com.itqan.edu.features.courses.dto.LessonResponse;
import com.itqan.edu.features.courses.dto.ThumbnailUploadResponse;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
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
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
@Tag(name = "Lessons", description = "Course lessons management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class LessonController {

    private final LessonService lessonService;
    private final LessonVideoService lessonVideoService;
    private final CurrentUserService currentUserService;

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Create a new lesson", description = "Create a new lesson")
    public ResponseEntity<LessonResponse> createLesson(
            @Valid @RequestBody LessonRequest request,
            Authentication authentication) {
        LessonResponse response = lessonService.createLesson(request, currentUser(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/resource", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Upload a lesson resource",
            description = "Upload a PDF, Office document, archive or image (max 50MB) for a resource lesson")
    public ResponseEntity<ThumbnailUploadResponse> uploadResource(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(lessonService.uploadResource(file));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get lesson by ID", description = "Get a lesson by its ID")
    public ResponseEntity<LessonResponse> getLessonById(@PathVariable Long id, Authentication authentication) {
        LessonResponse response = lessonService.getLessonById(id, currentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/module/{moduleId}")
    @Operation(summary = "Get lessons by module ID", description = "Get all lessons for a specific module")
    public ResponseEntity<List<LessonResponse>> getLessonsByModuleId(
            @PathVariable Long moduleId,
            Authentication authentication) {
        List<LessonResponse> lessons = lessonService.getLessonsByModuleId(moduleId, currentUser(authentication));
        return ResponseEntity.ok(lessons);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Update lesson", description = "Update an existing lesson")
    public ResponseEntity<LessonResponse> updateLesson(
            @PathVariable Long id,
            @Valid @RequestBody LessonRequest request,
            Authentication authentication) {
        LessonResponse response = lessonService.updateLesson(id, request, currentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Delete lesson", description = "Delete a lesson")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long id, Authentication authentication) {
        lessonService.deleteLesson(id, currentUser(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/video/multipart/initiate")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Initiate lesson video multipart upload", description = "Create multipart upload and pre-signed URLs")
    public ResponseEntity<LessonVideoMultipartInitiateResponse> initiateMultipartUpload(
            @PathVariable Long id,
            @Valid @RequestBody LessonVideoMultipartInitiateRequest request,
            Authentication authentication) {
        LessonVideoMultipartInitiateResponse response =
                lessonVideoService.initiateMultipartUpload(id, request, currentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/video/multipart/complete")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Complete lesson video multipart upload", description = "Finalize multipart upload and attach video to lesson")
    public ResponseEntity<LessonResponse> completeMultipartUpload(
            @PathVariable Long id,
            @Valid @RequestBody LessonVideoMultipartCompleteRequest request,
            Authentication authentication) {
        LessonResponse response = lessonVideoService.completeMultipartUpload(id, request, currentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/video/multipart/abort")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Abort lesson video multipart upload", description = "Abort an in-progress multipart upload")
    public ResponseEntity<Void> abortMultipartUpload(
            @PathVariable Long id,
            @Valid @RequestBody LessonVideoMultipartAbortRequest request,
            Authentication authentication) {
        lessonVideoService.abortMultipartUpload(id, request, currentUser(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/video/playback-url")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get lesson video playback URL", description = "Get a short-lived pre-signed video playback URL")
    public ResponseEntity<LessonVideoPlaybackResponse> getPlaybackUrl(@PathVariable Long id, Authentication authentication) {
        LessonVideoPlaybackResponse response = lessonVideoService.getPlaybackUrl(id, currentUser(authentication));
        return ResponseEntity.ok(response);
    }

    private User currentUser(Authentication authentication) {
        return currentUserService.getCurrentUser(authentication);
    }
}
