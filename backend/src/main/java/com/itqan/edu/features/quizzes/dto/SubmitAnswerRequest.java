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
public class SubmitAnswerRequest {
    private Long questionId;
    private String answerText; // For SHORT_ANSWER
    private List<Long> selectedOptionIds; // For MULTIPLE_CHOICE and TRUE_FALSE
}
