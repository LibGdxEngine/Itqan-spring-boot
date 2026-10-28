package com.itqan.edu.features.instructors.analytics;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.admin.analytics.dto.Granularity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/instructor/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
@Tag(name = "Instructor analytics", description = "Students, revenue and progress for the caller's courses")
@SecurityRequirement(name = "Bearer Authentication")
public class InstructorAnalyticsController {

    private final InstructorAnalyticsService instructorAnalyticsService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @Operation(summary = "Overview across the caller's courses")
    public ResponseEntity<InstructorAnalytics.Overview> overview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "DAILY") Granularity granularity,
            Authentication authentication) {
        return ResponseEntity.ok(instructorAnalyticsService.overview(
                currentUserService.getCurrentUser(authentication), from, to, granularity));
    }

    @GetMapping("/courses/{courseId}")
    @Operation(summary = "Lesson completion funnel and quiz results for one course")
    public ResponseEntity<InstructorAnalytics.CourseDetail> courseDetail(
            @PathVariable Long courseId,
            Authentication authentication) {
        return ResponseEntity.ok(instructorAnalyticsService.courseDetail(
                currentUserService.getCurrentUser(authentication), courseId));
    }
}
