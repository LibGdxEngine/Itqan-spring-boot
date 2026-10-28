package com.itqan.edu.features.admin.analytics.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Response shapes for the date-range analytics endpoints. */
public final class AnalyticsReport {

    private AnalyticsReport() {
    }

    public record DateRange(LocalDate from, LocalDate to) {
    }

    public record Summary(
            DateRange range,
            DateRange previousRange,
            Map<String, Double> revenueByCurrency,
            Map<String, Double> previousRevenueByCurrency,
            long newUsers,
            long previousNewUsers,
            long newEnrollments,
            long previousNewEnrollments,
            long activeUsers30d,
            long totalStudents,
            long activeCourses,
            long totalEnrollments) {
    }

    public record SeriesPoint(LocalDate date, double value) {
    }

    public record Series(String key, List<SeriesPoint> points) {
    }

    public record CourseRevenue(Long courseId, String courseTitle, String currency, double revenue, long payments) {
    }
}
