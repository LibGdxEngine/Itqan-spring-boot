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
public class UserAnalyticsResponse {
    private long totalUsers;
    private long newSignups;
    private long activeUsers;
    private Map<String, Long> usersByRole;
}
