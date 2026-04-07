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
public class StudentAnswerResponse {
    private Long questionId;
    private String questionText;
    private String answerText;
    private List<Long> selectedOptionIds;
    private Boolean isCorrect;
    private Integer pointsEarned;
    private Integer totalPoints;
}
