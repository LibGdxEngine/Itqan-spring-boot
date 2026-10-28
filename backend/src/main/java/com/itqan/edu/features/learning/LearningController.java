package com.itqan.edu.features.learning;

import com.itqan.edu.features.learning.LearningService.CourseState;
import com.itqan.edu.features.learning.LearningService.Dashboard;
import com.itqan.edu.features.students.CurrentStudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasRole('STUDENT')")
@Tag(name = "Learning", description = "The signed-in student's progress and resume points")
public class LearningController {

    private final LearningService learningService;
    private final CurrentStudentService currentStudentService;

    public record ActivityRequest(@Min(0) @Max(86_400) Integer positionSeconds) {
    }

    @GetMapping("/me")
    @Operation(summary = "Dashboard: enrolled courses, continue-learning target and activity stats")
    public Dashboard dashboard(Authentication authentication) {
        return learningService.dashboard(currentStudentService.require(authentication));
    }

    @GetMapping("/courses/{courseId}")
    @Operation(summary = "Completed lessons, saved video positions and last lesson for one course")
    public CourseState courseState(@PathVariable Long courseId, Authentication authentication) {
        return learningService.courseState(currentStudentService.require(authentication), courseId);
    }

    @PutMapping("/lessons/{lessonId}/activity")
    @Operation(summary = "Record that a lesson was opened, optionally with the current video position")
    public ResponseEntity<Void> activity(@PathVariable Long lessonId,
                                         @RequestBody(required = false) @jakarta.validation.Valid ActivityRequest request,
                                         Authentication authentication) {
        learningService.recordActivity(currentStudentService.require(authentication), lessonId,
                request == null ? null : request.positionSeconds());
        return ResponseEntity.noContent().build();
    }
}
