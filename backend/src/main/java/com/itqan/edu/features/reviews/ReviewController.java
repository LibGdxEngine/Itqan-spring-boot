package com.itqan.edu.features.reviews;

import com.itqan.edu.features.reviews.ReviewDtos.AdminReviewRow;
import com.itqan.edu.features.reviews.ReviewDtos.ModerationRequest;
import com.itqan.edu.features.reviews.ReviewDtos.ReviewRequest;
import com.itqan.edu.features.reviews.ReviewDtos.ReviewResponse;
import com.itqan.edu.features.reviews.ReviewDtos.ReviewSummary;
import com.itqan.edu.features.students.CurrentStudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Course ratings and reviews")
public class ReviewController {

    private static final CacheControl PUBLIC_SHORT = CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic();

    private final ReviewService reviewService;
    private final CurrentStudentService currentStudentService;

    @GetMapping("/api/courses/{courseId}/reviews")
    @Operation(summary = "Visible reviews for a course, newest first")
    public ResponseEntity<Page<ReviewResponse>> list(@PathVariable Long courseId,
                                                     @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok().cacheControl(PUBLIC_SHORT).body(reviewService.listForCourse(courseId, pageable));
    }

    @GetMapping("/api/courses/{courseId}/reviews/summary")
    @Operation(summary = "Average rating and star distribution")
    public ResponseEntity<ReviewSummary> summary(@PathVariable Long courseId) {
        return ResponseEntity.ok().cacheControl(PUBLIC_SHORT).body(reviewService.summary(courseId));
    }

    @GetMapping("/api/courses/{courseId}/reviews/mine")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "The caller's review of this course, if any")
    public ResponseEntity<ReviewResponse> mine(@PathVariable Long courseId, Authentication authentication) {
        return reviewService.mine(courseId, currentStudentService.require(authentication))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/api/courses/{courseId}/reviews/mine")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Create or update the caller's review")
    public ReviewResponse upsert(@PathVariable Long courseId, @Valid @RequestBody ReviewRequest request,
                                 Authentication authentication) {
        return reviewService.upsert(courseId, currentStudentService.require(authentication), request);
    }

    @DeleteMapping("/api/courses/{courseId}/reviews/mine")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Delete the caller's review")
    public ResponseEntity<Void> delete(@PathVariable Long courseId, Authentication authentication) {
        reviewService.deleteMine(courseId, currentStudentService.require(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/admin/reviews")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search all reviews for moderation")
    public Page<AdminReviewRow> search(@RequestParam(required = false) String q,
                                       @RequestParam(required = false) Long courseId,
                                       @RequestParam(required = false) Boolean hidden,
                                       @RequestParam(required = false) Integer rating,
                                       @PageableDefault(size = 20) Pageable pageable) {
        return reviewService.search(q, courseId, hidden, rating, pageable);
    }

    @PatchMapping("/api/admin/reviews/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Hide or show a review")
    public ResponseEntity<Void> moderate(@PathVariable Long id, @Valid @RequestBody ModerationRequest request) {
        reviewService.setHidden(id, request.hidden());
        return ResponseEntity.noContent().build();
    }
}
