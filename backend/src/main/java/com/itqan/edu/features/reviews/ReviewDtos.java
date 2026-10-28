package com.itqan.edu.features.reviews;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Map;

public final class ReviewDtos {

    private ReviewDtos() {
    }

    public record ReviewRequest(
            @NotNull @Min(1) @Max(5) Integer rating,
            @Size(max = 2000) String comment) {
    }

    /** Public view: first name and last initial only. */
    public record ReviewResponse(Long id, Long courseId, String authorName, int rating, String comment,
                                 LocalDateTime createdAt, LocalDateTime updatedAt) {
    }

    public record ReviewSummary(Long courseId, double average, long count, Map<Integer, Long> distribution) {
    }

    public record AdminReviewRow(Long id, Long courseId, String courseTitle, Long studentId, String studentName,
                                 String studentEmail, int rating, String comment, boolean hidden,
                                 LocalDateTime createdAt) {
    }

    public record ModerationRequest(@NotNull Boolean hidden) {
    }
}
