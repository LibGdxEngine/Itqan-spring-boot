package com.itqan.edu.features.admin.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOverviewResponse {
    private long totalStudents;
    private long totalCourses;
    private long totalEnrollments;
    private Map<String, Double> revenueByCurrency;
    private long activeUsers;
    private long newUsersThisMonth;
}
