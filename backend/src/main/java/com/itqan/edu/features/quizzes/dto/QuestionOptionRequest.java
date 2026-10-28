package com.itqan.edu.features.quizzes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionOptionRequest {
    private Long id; // Set when editing an existing option
    private String optionText;
    private Boolean isCorrect;
    private Integer orderIndex;
}
