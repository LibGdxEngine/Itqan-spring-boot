package com.itqan.edu.features.admin.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseProgressResponse {
    private Long courseId;
    private long totalEnrollments;
    private long completedCount;
    private Double completionRate;
    private Double averageProgress;
    private List<LessonCompletion> lessonCompletionRates;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LessonCompletion {
        private Long lessonId;
        private String title;
        private long completionCount;
        private Double completionRate;
    }
}
