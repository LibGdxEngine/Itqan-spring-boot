package com.itqan.edu.features.quizzes.dto;

import com.itqan.edu.features.quizzes.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionRequest {
    private Long id; // Set when editing an existing question
    private String questionText;
    private QuestionType questionType;
    private Integer points;
    private Integer orderIndex;
    private String correctAnswer; // For SHORT_ANSWER type
    private List<QuestionOptionRequest> options; // For MULTIPLE_CHOICE and TRUE_FALSE
}
