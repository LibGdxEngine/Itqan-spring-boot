package com.itqan.edu.features.quizzes;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.students.StudentRepository;
import com.itqan.edu.features.quizzes.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
@Tag(name = "Quiz Management", description = "APIs for managing quizzes and quiz attempts")
public class QuizController {

    private final QuizService quizService;
    private final StudentRepository studentRepository;
    private final CurrentUserService currentUserService;

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Create a new quiz")
    public ResponseEntity<QuizResponse> createQuiz(@Valid @RequestBody QuizRequest request,
                                                   Authentication authentication) {
        QuizResponse response = quizService.createQuiz(request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{quizId}")
    @Operation(summary = "Get quiz details")
    public ResponseEntity<QuizResponse> getQuiz(
            @PathVariable Long quizId,
            Authentication authentication) {
        QuizResponse response = quizService.getQuiz(quizId, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{quizId}/edit")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Get quiz with answer key for editing")
    public ResponseEntity<QuizResponse> getQuizForEditing(
            @PathVariable Long quizId,
            Authentication authentication) {
        return ResponseEntity.ok(quizService.getQuizForEditing(quizId, currentUserService.getCurrentUser(authentication)));
    }

    @PutMapping("/{quizId}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Update quiz")
    public ResponseEntity<QuizResponse> updateQuiz(
            @PathVariable Long quizId,
            @Valid @RequestBody QuizRequest request,
            Authentication authentication) {
        QuizResponse response = quizService.updateQuiz(quizId, request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{quizId}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Delete quiz")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long quizId, Authentication authentication) {
        quizService.deleteQuiz(quizId, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{quizId}/attempts")
    @Operation(summary = "Start a quiz attempt")
    public ResponseEntity<QuizAttemptResponse> startQuizAttempt(
            @PathVariable Long quizId,
            Authentication authentication) {
        Long studentId = getCurrentStudentId(authentication);
        QuizAttemptResponse response = quizService.startQuizAttempt(
                quizId, studentId, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/attempts/{attemptId}/submit")
    @Operation(summary = "Submit quiz answers")
    public ResponseEntity<QuizAttemptResponse> submitQuiz(
            @PathVariable Long attemptId,
            @Valid @RequestBody SubmitQuizRequest request,
            Authentication authentication) {
        Long studentId = getCurrentStudentId(authentication);
        QuizAttemptResponse response = quizService.submitQuiz(attemptId, request, studentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/attempts/{attemptId}")
    @Operation(summary = "Get quiz attempt results")
    public ResponseEntity<QuizAttemptResponse> getAttemptResults(
            @PathVariable Long attemptId,
            Authentication authentication) {
        Long studentId = getCurrentStudentId(authentication);
        QuizAttemptResponse response = quizService.getAttemptResults(attemptId, studentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-attempts")
    @Operation(summary = "Get student's quiz attempts")
    public ResponseEntity<List<QuizAttemptResponse>> getMyAttempts(
            Authentication authentication) {
        Long studentId = getCurrentStudentId(authentication);
        List<QuizAttemptResponse> responses = quizService.getStudentAttempts(studentId);
        return ResponseEntity.ok(responses);
    }

    private Long getCurrentStudentId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return studentRepository.findByEmail(email)
                .map(student -> student.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));
    }
}
