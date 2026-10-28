package com.itqan.edu.features.instructors.analytics;

import com.itqan.edu.features.admin.analytics.dto.AnalyticsReport.DateRange;
import com.itqan.edu.features.admin.analytics.dto.AnalyticsReport.Series;

import java.util.List;
import java.util.Map;

/** Response shapes for the instructor's own analytics. */
public final class InstructorAnalytics {

    private InstructorAnalytics() {
    }

    public record Overview(
            DateRange range,
            Summary summary,
            Series enrollmentSeries,
            List<Series> revenueSeries,
            List<CourseStats> courses) {
    }

    public record Summary(
            long totalCourses,
            long publishedCourses,
            long totalStudents,
            long newEnrollments,
            Map<String, Double> revenueByCurrency,
            double averageProgress,
            Double averageQuizScore) {
    }

    public record CourseStats(
            Long courseId,
            String title,
            boolean published,
            long students,
            long newEnrollments,
            long completedStudents,
            double averageProgress,
            long lessons,
            Map<String, Double> revenueByCurrency,
            long quizAttempts,
            Double averageQuizScore) {
    }

    public record CourseDetail(
            Long courseId,
            String title,
            long students,
            List<LessonStep> lessons,
            List<QuizStats> quizzes) {
    }

    public record LessonStep(
            Long lessonId,
            String title,
            String moduleTitle,
            String type,
            long completed) {
    }

    public record QuizStats(
            Long quizId,
            String title,
            String lessonTitle,
            int questions,
            long attempts,
            Double averageScore,
            Double passRate) {
    }
}
