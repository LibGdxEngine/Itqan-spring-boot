package com.itqan.edu.features.admin.analytics;

import com.itqan.edu.features.admin.analytics.dto.AnalyticsOverviewResponse;
import com.itqan.edu.features.admin.analytics.dto.CoursePopularityResponse;
import com.itqan.edu.features.admin.analytics.dto.AnalyticsReport.CourseRevenue;
import com.itqan.edu.features.admin.analytics.dto.AnalyticsReport.Series;
import com.itqan.edu.features.admin.analytics.dto.AnalyticsReport.Summary;
import com.itqan.edu.features.admin.analytics.dto.Granularity;
import com.itqan.edu.features.admin.analytics.dto.RevenueTrendResponse;
import com.itqan.edu.features.admin.analytics.dto.UserAnalyticsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final AnalyticsReportService reportService;

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

    // --- Date-range reports (from/to are ISO dates, default: last 30 days) ---

    @GetMapping("/summary")
    public ResponseEntity<Summary> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.summary(reportService.resolveRange(from, to)));
    }

    @GetMapping("/revenue-series")
    public ResponseEntity<List<Series>> getRevenueSeries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "DAILY") Granularity granularity) {
        return ResponseEntity.ok(reportService.revenueSeries(reportService.resolveRange(from, to), granularity));
    }

    @GetMapping("/enrollment-series")
    public ResponseEntity<Series> getEnrollmentSeries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "DAILY") Granularity granularity) {
        return ResponseEntity.ok(reportService.enrollmentSeries(reportService.resolveRange(from, to), granularity));
    }

    @GetMapping("/revenue-by-course")
    public ResponseEntity<List<CourseRevenue>> getRevenueByCourse(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.revenueByCourse(reportService.resolveRange(from, to)));
    }

    @GetMapping("/users")
    public ResponseEntity<UserAnalyticsResponse> getUsers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.users(reportService.resolveRange(from, to)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh() {
        reportService.refreshCaches();
        return ResponseEntity.noContent().build();
    }
}
