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
public class QuestionResponse {
    private Long id;
    private String questionText;
    private QuestionType questionType;
    private Integer points;
    private Integer orderIndex;
    private String correctAnswer; // Only shown after quiz completion if allowed
    private List<QuestionOptionResponse> options;
}
