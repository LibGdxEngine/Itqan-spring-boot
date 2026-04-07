package com.itqan.edu.features.quizzes.mapper;

import com.itqan.edu.features.quizzes.*;
import com.itqan.edu.features.quizzes.dto.*;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class QuizMapper {

    public QuizResponse toResponse(Quiz quiz, boolean includeCorrectAnswers) {
        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .passingScore(quiz.getPassingScore())
                .timeLimit(quiz.getTimeLimit())
                .attemptsAllowed(quiz.getAttemptsAllowed())
                .showCorrectAnswers(quiz.getShowCorrectAnswers())
                .active(quiz.getActive())
                .lessonId(quiz.getLesson() != null ? quiz.getLesson().getId() : null)
                .moduleId(quiz.getModule() != null ? quiz.getModule().getId() : null)
                .questions(quiz.getQuestions().stream()
                        .map(q -> toQuestionResponse(q, includeCorrectAnswers))
                        .collect(Collectors.toList()))
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .build();
    }

    public QuestionResponse toQuestionResponse(Question question, boolean includeCorrectAnswers) {
        return QuestionResponse.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .points(question.getPoints())
                .orderIndex(question.getOrderIndex())
                .correctAnswer(includeCorrectAnswers ? question.getCorrectAnswer() : null)
                .options(question.getOptions().stream()
                        .map(o -> toQuestionOptionResponse(o, includeCorrectAnswers))
                        .collect(Collectors.toList()))
                .build();
    }

    public QuestionOptionResponse toQuestionOptionResponse(QuestionOption option, boolean includeCorrectAnswers) {
        return QuestionOptionResponse.builder()
                .id(option.getId())
                .optionText(option.getOptionText())
                .isCorrect(includeCorrectAnswers ? option.getIsCorrect() : null)
                .orderIndex(option.getOrderIndex())
                .build();
    }

    public QuizAttemptResponse toAttemptResponse(QuizAttempt attempt, boolean includeAnswers) {
        QuizAttemptResponse.QuizAttemptResponseBuilder builder = QuizAttemptResponse.builder()
                .id(attempt.getId())
                .quizId(attempt.getQuiz().getId())
                .quizTitle(attempt.getQuiz().getTitle())
                .score(attempt.getScore())
                .passed(attempt.getPassed())
                .startedAt(attempt.getStartedAt())
                .completedAt(attempt.getCompletedAt())
                .timeSpent(attempt.getTimeSpent());

        if (includeAnswers) {
            builder.answers(attempt.getAnswers().stream()
                    .map(this::toStudentAnswerResponse)
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }

    public StudentAnswerResponse toStudentAnswerResponse(StudentAnswer answer) {
        return StudentAnswerResponse.builder()
                .questionId(answer.getQuestion().getId())
                .questionText(answer.getQuestion().getQuestionText())
                .answerText(answer.getAnswerText())
                .selectedOptionIds(answer.getSelectedOptions().stream()
                        .map(QuestionOption::getId)
                        .collect(Collectors.toList()))
                .isCorrect(answer.getIsCorrect())
                .pointsEarned(answer.getPointsEarned())
                .totalPoints(answer.getQuestion().getPoints())
                .build();
    }
}
