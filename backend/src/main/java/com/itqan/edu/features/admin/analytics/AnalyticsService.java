package com.itqan.edu.features.admin.analytics;

import com.itqan.edu.features.admin.analytics.dto.AnalyticsOverviewResponse;
import com.itqan.edu.features.admin.analytics.dto.CoursePopularityResponse;
import com.itqan.edu.features.admin.analytics.dto.Granularity;
import com.itqan.edu.features.admin.analytics.dto.RevenueTrendResponse;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.payments.PaymentRepository;
import com.itqan.edu.features.payments.PaymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private static final LocalDateTime EPOCH = LocalDateTime.of(1970, 1, 1, 0, 0);

    private final AuthRepository authRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PaymentRepository paymentRepository;

    @Cacheable(value = "analytics", key = "'overview'")
    public AnalyticsOverviewResponse getOverview() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
        LocalDateTime activeSince = now.minusDays(30);

        Map<String, Double> revenueByCurrency = new LinkedHashMap<>();
        for (Object[] row : paymentRepository.sumRevenueByCurrency(PaymentStatus.COMPLETED, EPOCH, now)) {
            String currency = (String) row[0];
            double total = ((Number) row[1]).doubleValue();
            revenueByCurrency.merge(currency, total, Double::sum);
        }

        return AnalyticsOverviewResponse.builder()
                .totalStudents(authRepository.countByRole(User.Role.STUDENT))
                .totalCourses(courseRepository.countByActiveTrue())
                .totalEnrollments(enrollmentRepository.count())
                .revenueByCurrency(revenueByCurrency)
                .activeUsers(authRepository.countByLastLoginAtAfter(activeSince))
                .newUsersThisMonth(authRepository.countByCreatedAtBetween(startOfMonth, now))
                .build();
    }

    public RevenueTrendResponse getRevenueTrend(int days) {
        int safeDays = Math.max(1, Math.min(days, 365));
        LocalDateTime to = LocalDateTime.now();
        LocalDateTime from = to.minusDays(safeDays);

        List<Object[]> rows = paymentRepository.findRevenueTrend(PaymentStatus.COMPLETED, from, to);
        List<RevenueTrendResponse.DataPoint> points = rows.stream()
                .map(row -> RevenueTrendResponse.DataPoint.builder()
                        .date(toLocalDate(row[0]))
                        .amount(((Number) row[1]).doubleValue())
                        .currency((String) row[2])
                        .build())
                .toList();

        return RevenueTrendResponse.builder()
                .granularity(Granularity.DAILY.name())
                .dataPoints(points)
                .build();
    }

    public List<CoursePopularityResponse> getTopCourses(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return enrollmentRepository.findCoursePopularity().stream()
                .limit(safeLimit)
                .map(this::toCoursePopularity)
                .toList();
    }

    private CoursePopularityResponse toCoursePopularity(Object[] row) {
        long enrollmentCount = ((Number) row[2]).longValue();
        long completedCount = row[3] == null ? 0L : ((Number) row[3]).longValue();
        double avgProgress = row[4] == null ? 0.0 : ((Number) row[4]).doubleValue();
        double completionRate = enrollmentCount == 0
                ? 0.0
                : ((double) completedCount / enrollmentCount) * 100.0;

        return CoursePopularityResponse.builder()
                .courseId(((Number) row[0]).longValue())
                .title((String) row[1])
                .enrollmentCount(enrollmentCount)
                .completionRate(completionRate)
                .averageProgress(avgProgress)
                .build();
    }

    private static LocalDate toLocalDate(Object value) {
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
