package com.itqan.edu.features.courses;

import com.itqan.edu.features.courses.dto.LessonRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartAbortRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartCompleteRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartInitiateRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartInitiateResponse;
import com.itqan.edu.features.courses.dto.LessonVideoPlaybackResponse;
import com.itqan.edu.features.courses.dto.LessonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Create a new lesson", description = "Create a new lesson")
    public ResponseEntity<LessonResponse> createLesson(@Valid @RequestBody LessonRequest request) {
        LessonResponse response = lessonService.createLesson(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get lesson by ID", description = "Get a lesson by its ID")
    public ResponseEntity<LessonResponse> getLessonById(@PathVariable Long id) {
        LessonResponse response = lessonService.getLessonById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/module/{moduleId}")
    @Operation(summary = "Get lessons by module ID", description = "Get all lessons for a specific module")
    public ResponseEntity<List<LessonResponse>> getLessonsByModuleId(@PathVariable Long moduleId) {
        List<LessonResponse> lessons = lessonService.getLessonsByModuleId(moduleId);
        return ResponseEntity.ok(lessons);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Update lesson", description = "Update an existing lesson")
    public ResponseEntity<LessonResponse> updateLesson(
            @PathVariable Long id,
            @Valid @RequestBody LessonRequest request) {
        LessonResponse response = lessonService.updateLesson(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Delete lesson", description = "Delete a lesson")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long id) {
        lessonService.deleteLesson(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/video/multipart/initiate")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Initiate lesson video multipart upload", description = "Create multipart upload and pre-signed URLs")
    public ResponseEntity<LessonVideoMultipartInitiateResponse> initiateMultipartUpload(
            @PathVariable Long id,
            @Valid @RequestBody LessonVideoMultipartInitiateRequest request) {
        LessonVideoMultipartInitiateResponse response = lessonVideoService.initiateMultipartUpload(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/video/multipart/complete")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Complete lesson video multipart upload", description = "Finalize multipart upload and attach video to lesson")
    public ResponseEntity<LessonResponse> completeMultipartUpload(
            @PathVariable Long id,
            @Valid @RequestBody LessonVideoMultipartCompleteRequest request) {
        LessonResponse response = lessonVideoService.completeMultipartUpload(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/video/multipart/abort")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Abort lesson video multipart upload", description = "Abort an in-progress multipart upload")
    public ResponseEntity<Void> abortMultipartUpload(
            @PathVariable Long id,
            @Valid @RequestBody LessonVideoMultipartAbortRequest request) {
        lessonVideoService.abortMultipartUpload(id, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/video/playback-url")
    @Operation(summary = "Get lesson video playback URL", description = "Get a short-lived pre-signed video playback URL")
    public ResponseEntity<LessonVideoPlaybackResponse> getPlaybackUrl(@PathVariable Long id) {
        LessonVideoPlaybackResponse response = lessonVideoService.getPlaybackUrl(id);
        return ResponseEntity.ok(response);
    }
}
