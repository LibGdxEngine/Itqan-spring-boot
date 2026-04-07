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
public class QuizResponse {
    private Long id;
    private String title;
    private String description;
    private Integer passingScore;
    private Integer timeLimit;
    private Integer attemptsAllowed;
    private Boolean showCorrectAnswers;
    private Boolean active;
    private Long lessonId;
    private Long moduleId;
    private List<QuestionResponse> questions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
