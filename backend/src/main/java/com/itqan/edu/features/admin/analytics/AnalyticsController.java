package com.itqan.edu.features.admin.analytics;

import com.itqan.edu.features.admin.analytics.dto.AnalyticsOverviewResponse;
import com.itqan.edu.features.admin.analytics.dto.CoursePopularityResponse;
import com.itqan.edu.features.admin.analytics.dto.RevenueTrendResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    public ResponseEntity<AnalyticsOverviewResponse> getOverview() {
        return ResponseEntity.ok(analyticsService.getOverview());
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<RevenueTrendResponse> getRevenueTrend(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getRevenueTrend(days));
    }

    @GetMapping("/top-courses")
    public ResponseEntity<List<CoursePopularityResponse>> getTopCourses(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(analyticsService.getTopCourses(limit));
    }
}
