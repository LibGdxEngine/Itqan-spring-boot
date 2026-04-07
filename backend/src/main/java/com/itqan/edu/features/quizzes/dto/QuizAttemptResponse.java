package com.itqan.edu.features.quizzes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptResponse {
    private Long id;
    private Long quizId;
    private String quizTitle;
    private Double score;
    private Boolean passed;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer timeSpent;
    private List<StudentAnswerResponse> answers;
}
