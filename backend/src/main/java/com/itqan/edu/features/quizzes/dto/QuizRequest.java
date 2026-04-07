package com.itqan.edu.features.quizzes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizRequest {
    private String title;
    private String description;
    private Integer passingScore;
    private Integer timeLimit;
    private Integer attemptsAllowed;
    private Boolean showCorrectAnswers;
    private Long lessonId; // Optional: attach to lesson
    private Long moduleId; // Optional: attach to module
    private List<QuestionRequest> questions;
}
