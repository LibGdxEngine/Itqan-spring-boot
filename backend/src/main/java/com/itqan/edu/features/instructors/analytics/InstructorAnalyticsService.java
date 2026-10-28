package com.itqan.edu.features.instructors.analytics;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.admin.analytics.AnalyticsReportService;
import com.itqan.edu.features.admin.analytics.dto.AnalyticsReport.DateRange;
import com.itqan.edu.features.admin.analytics.dto.AnalyticsReport.Series;
import com.itqan.edu.features.admin.analytics.dto.Granularity;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseAccessService;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.courses.Lesson;
import com.itqan.edu.features.courses.LessonRepository;
import com.itqan.edu.features.courses.Module;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.enrollments.LessonEnrollmentRepository;
import com.itqan.edu.features.instructors.analytics.InstructorAnalytics.CourseDetail;
import com.itqan.edu.features.instructors.analytics.InstructorAnalytics.CourseStats;
import com.itqan.edu.features.instructors.analytics.InstructorAnalytics.LessonStep;
import com.itqan.edu.features.instructors.analytics.InstructorAnalytics.Overview;
import com.itqan.edu.features.instructors.analytics.InstructorAnalytics.QuizStats;
import com.itqan.edu.features.instructors.analytics.InstructorAnalytics.Summary;
import com.itqan.edu.features.payments.PaymentRepository;
import com.itqan.edu.features.payments.PaymentStatus;
import com.itqan.edu.features.quizzes.Quiz;
import com.itqan.edu.features.quizzes.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import static com.itqan.edu.features.admin.analytics.AnalyticsReportService.bucketStart;
import static com.itqan.edu.features.admin.analytics.AnalyticsReportService.toLocalDate;
import static com.itqan.edu.features.admin.analytics.AnalyticsReportService.zeroFill;

/**
 * Analytics for the courses a user manages: an instructor sees their own courses, an admin
 * sees every course.
 */
@Service
@RequiredArgsConstructor
public class InstructorAnalyticsService {

    private final AnalyticsReportService analyticsReportService;
    private final CourseRepository courseRepository;
    private final CourseAccessService courseAccessService;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonEnrollmentRepository lessonEnrollmentRepository;
    private final LessonRepository lessonRepository;
    private final PaymentRepository paymentRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    @Transactional(readOnly = true)
    public Overview overview(User user, LocalDate from, LocalDate to, Granularity granularity) {
        DateRange range = analyticsReportService.resolveRange(from, to);
        List<Course> courses = user.getRole() == User.Role.ADMIN
                ? courseRepository.findAll()
                : courseRepository.findByOwnerUserId(user.getId());
        courses.sort(Comparator.comparing(Course::getCreatedAt).reversed());

        long published = courses.stream().filter(c -> Boolean.TRUE.equals(c.getActive())).count();
        if (courses.isEmpty()) {
            Summary empty = new Summary(0, 0, 0, 0, Map.of(), 0, null);
            return new Overview(range, empty, new Series("enrollments", zeroFill(range, granularity, Map.of())),
                    List.of(), List.of());
        }

        List<Long> ids = courses.stream().map(Course::getId).toList();
        LocalDateTime start = range.from().atStartOfDay();
        LocalDateTime end = range.to().atTime(LocalTime.MAX);

        Map<Long, Object[]> enrollmentStats = new HashMap<>();
        for (Object[] row : enrollmentRepository.courseEnrollmentStats(
                ids, start, end, EnrollmentStatus.COMPLETED, EnrollmentStatus.DROPPED)) {
            enrollmentStats.put((Long) row[0], row);
        }
        Map<Long, Long> lessonCounts = new HashMap<>();
        for (Object[] row : lessonRepository.countActiveLessonsPerCourse(ids)) {
            lessonCounts.put((Long) row[0], ((Number) row[1]).longValue());
        }
        Map<Long, Map<String, Double>> revenueByCourse = new HashMap<>();
        Map<String, Double> revenueTotals = new TreeMap<>();
        for (Object[] row : paymentRepository.revenuePerCourse(PaymentStatus.COMPLETED, ids, start, end)) {
            double amount = ((Number) row[2]).doubleValue();
            revenueByCourse.computeIfAbsent((Long) row[0], k -> new TreeMap<>())
                    .merge((String) row[1], amount, Double::sum);
            revenueTotals.merge((String) row[1], amount, Double::sum);
        }
        Map<Long, double[]> quizByCourse = quizStatsByCourse(courses, ids);

        List<CourseStats> rows = new ArrayList<>();
        long newEnrollments = 0;
        double progressSum = 0;
        long progressWeight = 0;
        double quizScoreSum = 0;
        long quizAttempts = 0;
        for (Course course : courses) {
            Object[] stats = enrollmentStats.get(course.getId());
            long students = stats == null ? 0 : ((Number) stats[1]).longValue();
            long completed = stats == null ? 0 : nullSafeLong(stats[2]);
            double avgProgress = stats == null || stats[3] == null ? 0 : ((Number) stats[3]).doubleValue();
            long fresh = stats == null ? 0 : nullSafeLong(stats[4]);
            double[] quiz = quizByCourse.getOrDefault(course.getId(), new double[] {0, 0});
            long attempts = (long) quiz[0];

            rows.add(new CourseStats(course.getId(), course.getTitle(), Boolean.TRUE.equals(course.getActive()),
                    students, fresh, completed, round(avgProgress), lessonCounts.getOrDefault(course.getId(), 0L),
                    revenueByCourse.getOrDefault(course.getId(), Map.of()),
                    attempts, attempts == 0 ? null : round(quiz[1] / attempts)));

            newEnrollments += fresh;
            progressSum += avgProgress * students;
            progressWeight += students;
            quizScoreSum += quiz[1];
            quizAttempts += attempts;
        }

        Summary summary = new Summary(
                courses.size(),
                published,
                enrollmentRepository.countDistinctStudents(ids, EnrollmentStatus.DROPPED),
                newEnrollments,
                revenueTotals,
                progressWeight == 0 ? 0 : round(progressSum / progressWeight),
                quizAttempts == 0 ? null : round(quizScoreSum / quizAttempts));

        return new Overview(range, summary, enrollmentSeries(ids, range, granularity, start, end),
                revenueSeries(ids, range, granularity, start, end), rows);
    }

    @Transactional(readOnly = true)
    public CourseDetail courseDetail(User user, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        courseAccessService.assertCanManage(user, course);

        Map<Long, Long> completions = new HashMap<>();
        for (Object[] row : lessonEnrollmentRepository.countCompletionsPerLesson(courseId)) {
            completions.put((Long) row[0], ((Number) row[1]).longValue());
        }
        Map<Long, Object[]> attemptStats = new HashMap<>();
        for (Object[] row : quizAttemptRepository.quizStatsForCourses(List.of(courseId))) {
            attemptStats.put((Long) row[0], row);
        }

        List<LessonStep> steps = new ArrayList<>();
        List<QuizStats> quizzes = new ArrayList<>();
        for (Module module : course.getModules()) {
            if (module.getQuiz() != null) {
                quizzes.add(quizStats(module.getQuiz(), module.getTitle(), attemptStats));
            }
            for (Lesson lesson : module.getLessons()) {
                if (!Boolean.TRUE.equals(lesson.getActive())) {
                    continue;
                }
                steps.add(new LessonStep(lesson.getId(), lesson.getTitle(), module.getTitle(),
                        lesson.getType().name(), completions.getOrDefault(lesson.getId(), 0L)));
                if (lesson.getQuiz() != null) {
                    quizzes.add(quizStats(lesson.getQuiz(), lesson.getTitle(), attemptStats));
                }
            }
        }

        long students = enrollmentRepository.countByCourseIdAndStatusNot(courseId, EnrollmentStatus.DROPPED);
        return new CourseDetail(course.getId(), course.getTitle(), students, steps, quizzes);
    }

    private Series enrollmentSeries(List<Long> ids, DateRange range, Granularity granularity,
                                    LocalDateTime start, LocalDateTime end) {
        Map<LocalDate, Double> values = new TreeMap<>();
        for (Object[] row : enrollmentRepository.countCourseEnrollmentsPerDay(ids, start, end)) {
            values.merge(bucketStart(toLocalDate(row[0]), granularity), ((Number) row[1]).doubleValue(), Double::sum);
        }
        return new Series("enrollments", zeroFill(range, granularity, values));
    }

    private List<Series> revenueSeries(List<Long> ids, DateRange range, Granularity granularity,
                                       LocalDateTime start, LocalDateTime end) {
        Map<String, Map<LocalDate, Double>> byCurrency = new TreeMap<>();
        for (Object[] row : paymentRepository.revenuePerDayForCourses(PaymentStatus.COMPLETED, ids, start, end)) {
            byCurrency.computeIfAbsent((String) row[1], c -> new TreeMap<>())
                    .merge(bucketStart(toLocalDate(row[0]), granularity), ((Number) row[2]).doubleValue(), Double::sum);
        }
        List<Series> series = new ArrayList<>();
        byCurrency.forEach((currency, values) -> series.add(new Series(currency, zeroFill(range, granularity, values))));
        return series;
    }

    /** Course id to {completed attempts, sum of scores}. */
    private Map<Long, double[]> quizStatsByCourse(List<Course> courses, List<Long> ids) {
        Map<Long, Long> courseByQuiz = new HashMap<>();
        for (Course course : courses) {
            for (Module module : course.getModules()) {
                if (module.getQuiz() != null) {
                    courseByQuiz.put(module.getQuiz().getId(), course.getId());
                }
                for (Lesson lesson : module.getLessons()) {
                    if (lesson.getQuiz() != null) {
                        courseByQuiz.put(lesson.getQuiz().getId(), course.getId());
                    }
                }
            }
        }
        Map<Long, double[]> result = new HashMap<>();
        if (courseByQuiz.isEmpty()) {
            return result;
        }
        for (Object[] row : quizAttemptRepository.quizStatsForCourses(ids)) {
            Long courseId = courseByQuiz.get((Long) row[0]);
            if (courseId == null) {
                continue;
            }
            long attempts = ((Number) row[1]).longValue();
            double avg = row[2] == null ? 0 : ((Number) row[2]).doubleValue();
            double[] acc = result.computeIfAbsent(courseId, k -> new double[] {0, 0});
            acc[0] += attempts;
            acc[1] += avg * attempts;
        }
        return result;
    }

    private static QuizStats quizStats(Quiz quiz, String lessonTitle, Map<Long, Object[]> attemptStats) {
        Object[] row = attemptStats.get(quiz.getId());
        long attempts = row == null ? 0 : ((Number) row[1]).longValue();
        Double avg = row == null || row[2] == null ? null : round(((Number) row[2]).doubleValue());
        Double passRate = attempts == 0 ? null : round(nullSafeLong(row[3]) * 100.0 / attempts);
        return new QuizStats(quiz.getId(), quiz.getTitle(), lessonTitle, quiz.getQuestions().size(),
                attempts, avg, passRate);
    }

    private static long nullSafeLong(Object value) {
        return value == null ? 0 : ((Number) value).longValue();
    }

    private static double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
