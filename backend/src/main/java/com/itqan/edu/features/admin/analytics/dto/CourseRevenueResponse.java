package com.itqan.edu.features.admin.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRevenueResponse {
    private Long courseId;
    private String courseTitle;
    private Double totalRevenue;
    private String currency;
    private Long enrollmentCount;
    private Double completionRate;
}
