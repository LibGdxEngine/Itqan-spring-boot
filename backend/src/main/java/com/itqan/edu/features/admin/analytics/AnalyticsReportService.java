package com.itqan.edu.features.admin.analytics;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.admin.analytics.dto.AnalyticsReport.CourseRevenue;
import com.itqan.edu.features.admin.analytics.dto.AnalyticsReport.DateRange;
import com.itqan.edu.features.admin.analytics.dto.AnalyticsReport.Series;
import com.itqan.edu.features.admin.analytics.dto.AnalyticsReport.SeriesPoint;
import com.itqan.edu.features.admin.analytics.dto.AnalyticsReport.Summary;
import com.itqan.edu.features.admin.analytics.dto.Granularity;
import com.itqan.edu.features.admin.analytics.dto.UserAnalyticsResponse;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.payments.PaymentRepository;
import com.itqan.edu.features.payments.PaymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * Date-range analytics for the admin dashboard: period KPIs with previous-period comparison,
 * zero-filled time series, revenue per course and a user breakdown.
 */
@Service
@RequiredArgsConstructor
public class AnalyticsReportService {

    private static final int MAX_RANGE_DAYS = 366;

    private final PaymentRepository paymentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AuthRepository authRepository;
    private final CourseRepository courseRepository;

    public DateRange resolveRange(LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(29);
        if (start.isAfter(end)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "'from' must be on or before 'to'");
        }
        if (ChronoUnit.DAYS.between(start, end) + 1 > MAX_RANGE_DAYS) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Date range cannot exceed " + MAX_RANGE_DAYS + " days");
        }
        return new DateRange(start, end);
    }

    @Transactional(readOnly = true)
    public Summary summary(DateRange range) {
        long days = ChronoUnit.DAYS.between(range.from(), range.to()) + 1;
        DateRange previous = new DateRange(range.from().minusDays(days), range.from().minusDays(1));

        return new Summary(
                range,
                previous,
                revenueByCurrency(range),
                revenueByCurrency(previous),
                authRepository.countByCreatedAtBetween(start(range), end(range)),
                authRepository.countByCreatedAtBetween(start(previous), end(previous)),
                enrollmentRepository.countByEnrolledAtBetween(start(range), end(range)),
                enrollmentRepository.countByEnrolledAtBetween(start(previous), end(previous)),
                authRepository.countByLastLoginAtAfter(LocalDateTime.now().minusDays(30)),
                authRepository.countByRole(User.Role.STUDENT),
                courseRepository.countByActiveTrue(),
                enrollmentRepository.count());
    }

    /** Completed revenue per currency, bucketed and zero-filled so charts have no gaps. */
    @Transactional(readOnly = true)
    public List<Series> revenueSeries(DateRange range, Granularity granularity) {
        Map<String, Map<LocalDate, Double>> byCurrency = new TreeMap<>();
        for (Object[] row : paymentRepository.findRevenueTrend(PaymentStatus.COMPLETED, start(range), end(range))) {
            LocalDate bucket = bucketStart(toLocalDate(row[0]), granularity);
            String currency = (String) row[2];
            byCurrency.computeIfAbsent(currency, c -> new TreeMap<>())
                    .merge(bucket, ((Number) row[1]).doubleValue(), Double::sum);
        }
        List<Series> series = new ArrayList<>();
        byCurrency.forEach((currency, values) -> series.add(new Series(currency, zeroFill(range, granularity, values))));
        return series;
    }

    @Transactional(readOnly = true)
    public Series enrollmentSeries(DateRange range, Granularity granularity) {
        Map<LocalDate, Double> values = new TreeMap<>();
        for (Object[] row : enrollmentRepository.countEnrollmentsPerDay(start(range), end(range))) {
            values.merge(bucketStart(toLocalDate(row[0]), granularity), ((Number) row[1]).doubleValue(), Double::sum);
        }
        return new Series("enrollments", zeroFill(range, granularity, values));
    }

    @Transactional(readOnly = true)
    public List<CourseRevenue> revenueByCourse(DateRange range) {
        return paymentRepository.sumRevenueByCourse(PaymentStatus.COMPLETED, start(range), end(range)).stream()
                .map(row -> new CourseRevenue(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        (String) row[2],
                        ((Number) row[3]).doubleValue(),
                        ((Number) row[4]).longValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public UserAnalyticsResponse users(DateRange range) {
        Map<String, Long> byRole = new LinkedHashMap<>();
        for (Object[] row : authRepository.countByRoleGrouped()) {
            byRole.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        return UserAnalyticsResponse.builder()
                .totalUsers(authRepository.count())
                .newSignups(authRepository.countByCreatedAtBetween(start(range), end(range)))
                .activeUsers(authRepository.countByLastLoginAtAfter(LocalDateTime.now().minusDays(30)))
                .usersByRole(byRole)
                .build();
    }

    @CacheEvict(value = "analytics", allEntries = true)
    public void refreshCaches() {
        // Eviction only; the annotation does the work.
    }

    private Map<String, Double> revenueByCurrency(DateRange range) {
        Map<String, Double> totals = new TreeMap<>();
        for (Object[] row : paymentRepository.sumRevenueByCurrency(PaymentStatus.COMPLETED, start(range), end(range))) {
            totals.merge((String) row[0], ((Number) row[1]).doubleValue(), Double::sum);
        }
        return totals;
    }

    public static List<SeriesPoint> zeroFill(DateRange range, Granularity granularity, Map<LocalDate, Double> values) {
        List<SeriesPoint> points = new ArrayList<>();
        TreeSet<LocalDate> buckets = new TreeSet<>();
        for (LocalDate d = bucketStart(range.from(), granularity); !d.isAfter(range.to()); d = next(d, granularity)) {
            buckets.add(d);
        }
        for (LocalDate bucket : buckets) {
            points.add(new SeriesPoint(bucket, values.getOrDefault(bucket, 0.0)));
        }
        return points;
    }

    public static LocalDate bucketStart(LocalDate date, Granularity granularity) {
        return switch (granularity) {
            case DAILY -> date;
            case WEEKLY -> date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MONTHLY -> date.withDayOfMonth(1);
        };
    }

    private static LocalDate next(LocalDate date, Granularity granularity) {
        return switch (granularity) {
            case DAILY -> date.plusDays(1);
            case WEEKLY -> date.plusWeeks(1);
            case MONTHLY -> date.plusMonths(1);
        };
    }

    private static LocalDateTime start(DateRange range) {
        return range.from().atStartOfDay();
    }

    private static LocalDateTime end(DateRange range) {
        return range.to().atTime(LocalTime.MAX);
    }

    public static LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate ld) {
            return ld;
        }
        if (value instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (value instanceof java.util.Date utilDate) {
            return new java.sql.Date(utilDate.getTime()).toLocalDate();
        }
        throw new IllegalStateException("Unexpected date type: " + value.getClass());
    }
}
