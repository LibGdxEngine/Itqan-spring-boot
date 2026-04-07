package com.itqan.edu.features.quizzes;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "student_answers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_attempt_id", nullable = false)
    private QuizAttempt quizAttempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    // For SHORT_ANSWER type
    @Column(columnDefinition = "TEXT")
    private String answerText;

    // For MULTIPLE_CHOICE and TRUE_FALSE types
    @ManyToMany
    @JoinTable(name = "student_answer_options", joinColumns = @JoinColumn(name = "student_answer_id"), inverseJoinColumns = @JoinColumn(name = "option_id"))
    @Builder.Default
    private List<QuestionOption> selectedOptions = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCorrect = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer pointsEarned = 0;
}
