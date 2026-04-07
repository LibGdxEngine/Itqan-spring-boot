package com.itqan.edu.features.admin.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoursePopularityResponse {
    private Long courseId;
    private String title;
    private Long enrollmentCount;
    private Double completionRate;
    private Double averageProgress;
}
