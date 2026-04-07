package com.itqan.edu.features.video;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.students.StudentRepository;
import com.itqan.edu.features.video.dto.VideoBookmarkRequest;
import com.itqan.edu.features.video.dto.VideoBookmarkResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Video Bookmarks", description = "Video bookmark management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class VideoBookmarkController {

    private final VideoBookmarkService bookmarkService;
    private final StudentRepository studentRepository;

    @PostMapping("/lessons/{lessonId}/bookmarks")
    @Operation(summary = "Create bookmark", description = "Create a video bookmark for a lesson")
    public ResponseEntity<VideoBookmarkResponse> createBookmark(
            @PathVariable Long lessonId,
            @Valid @RequestBody VideoBookmarkRequest request,
            Authentication authentication) {

        Long studentId = getCurrentStudentId(authentication);
        VideoBookmarkResponse response = bookmarkService.createBookmark(studentId, lessonId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/lessons/{lessonId}/bookmarks")
    @Operation(summary = "Get bookmarks by lesson", description = "Get all bookmarks for a specific lesson")
    public ResponseEntity<List<VideoBookmarkResponse>> getBookmarksByLesson(
            @PathVariable Long lessonId,
            Authentication authentication) {

        Long studentId = getCurrentStudentId(authentication);
        List<VideoBookmarkResponse> bookmarks = bookmarkService.getBookmarksByLesson(studentId, lessonId);

        return ResponseEntity.ok(bookmarks);
    }

    @GetMapping("/bookmarks")
    @Operation(summary = "Get all bookmarks", description = "Get all bookmarks for the authenticated student")
    public ResponseEntity<List<VideoBookmarkResponse>> getAllBookmarks(
            Authentication authentication) {

        Long studentId = getCurrentStudentId(authentication);
        List<VideoBookmarkResponse> bookmarks = bookmarkService.getAllBookmarks(studentId);

        return ResponseEntity.ok(bookmarks);
    }

    @GetMapping("/bookmarks/{id}")
    @Operation(summary = "Get bookmark by ID", description = "Get a specific bookmark by ID")
    public ResponseEntity<VideoBookmarkResponse> getBookmarkById(
            @PathVariable Long id,
            Authentication authentication) {

        Long studentId = getCurrentStudentId(authentication);
        VideoBookmarkResponse bookmark = bookmarkService.getBookmarkById(id, studentId);

        return ResponseEntity.ok(bookmark);
    }

    @PutMapping("/bookmarks/{id}")
    @Operation(summary = "Update bookmark", description = "Update an existing bookmark")
    public ResponseEntity<VideoBookmarkResponse> updateBookmark(
            @PathVariable Long id,
            @Valid @RequestBody VideoBookmarkRequest request,
            Authentication authentication) {

        Long studentId = getCurrentStudentId(authentication);
        VideoBookmarkResponse response = bookmarkService.updateBookmark(id, studentId, request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/bookmarks/{id}")
    @Operation(summary = "Delete bookmark", description = "Delete a bookmark")
    public ResponseEntity<Void> deleteBookmark(
            @PathVariable Long id,
            Authentication authentication) {

        Long studentId = getCurrentStudentId(authentication);
        bookmarkService.deleteBookmark(id, studentId);

        return ResponseEntity.noContent().build();
    }

    private Long getCurrentStudentId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return studentRepository.findByEmail(email)
                .map(student -> student.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));
    }
}
