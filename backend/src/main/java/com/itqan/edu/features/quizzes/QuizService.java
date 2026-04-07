package com.itqan.edu.features.quizzes;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.Lesson;
import com.itqan.edu.features.courses.LessonRepository;
import com.itqan.edu.features.courses.Module;
import com.itqan.edu.features.courses.ModuleRepository;
import com.itqan.edu.features.quizzes.dto.*;
import com.itqan.edu.features.quizzes.mapper.QuizMapper;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final LessonRepository lessonRepository;
    private final ModuleRepository moduleRepository;
    private final StudentRepository studentRepository;
    private final QuizMapper quizMapper;

    @Transactional
    public QuizResponse createQuiz(QuizRequest request) {
        Quiz quiz = Quiz.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .passingScore(request.getPassingScore() != null ? request.getPassingScore() : 70)
                .timeLimit(request.getTimeLimit())
                .attemptsAllowed(request.getAttemptsAllowed() != null ? request.getAttemptsAllowed() : -1)
                .showCorrectAnswers(request.getShowCorrectAnswers() != null ? request.getShowCorrectAnswers() : true)
                .build();

        // Attach to lesson or module if specified
        if (request.getLessonId() != null) {
            Lesson lesson = lessonRepository.findById(request.getLessonId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
            quiz.setLesson(lesson);
        }

        if (request.getModuleId() != null) {
            Module module = moduleRepository.findById(request.getModuleId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));
            quiz.setModule(module);
        }

        // Add questions
        if (request.getQuestions() != null) {
            List<Question> questions = request.getQuestions().stream()
                    .map(qReq -> createQuestion(qReq, quiz))
                    .collect(Collectors.toList());
            quiz.setQuestions(questions);
        }

        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Created quiz: {} with {} questions", savedQuiz.getId(), savedQuiz.getQuestions().size());
        return quizMapper.toResponse(savedQuiz, false);
    }

    private Question createQuestion(QuestionRequest request, Quiz quiz) {
        Question question = Question.builder()
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType())
                .points(request.getPoints() != null ? request.getPoints() : 1)
                .orderIndex(request.getOrderIndex())
                .quiz(quiz)
                .correctAnswer(request.getCorrectAnswer())
                .build();

        // Add options for multiple choice and true/false questions
        if (request.getOptions() != null) {
            List<QuestionOption> options = request.getOptions().stream()
                    .map(oReq -> createQuestionOption(oReq, question))
                    .collect(Collectors.toList());
            question.setOptions(options);
        }

        return question;
    }

    private QuestionOption createQuestionOption(QuestionOptionRequest request, Question question) {
        return QuestionOption.builder()
                .optionText(request.getOptionText())
                .isCorrect(request.getIsCorrect() != null ? request.getIsCorrect() : false)
                .orderIndex(request.getOrderIndex())
                .question(question)
                .build();
    }

    @Transactional(readOnly = true)
    public QuizResponse getQuiz(Long quizId, Long studentId) {
        Quiz quiz = quizRepository.findByIdWithQuestions(quizId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUIZ_NOT_FOUND));

        // Don't show correct answers until quiz is taken
        return quizMapper.toResponse(quiz, false);
    }

    @Transactional
    public QuizAttemptResponse startQuizAttempt(Long quizId, Long studentId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUIZ_NOT_FOUND));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));

        // Check if student exceeded attempts
        if (quiz.getAttemptsAllowed() >= 0) {
            int attemptCount = quizAttemptRepository.countByStudentIdAndQuizId(studentId, quizId);
            if (attemptCount >= quiz.getAttemptsAllowed()) {
                throw new BusinessException(ErrorCode.QUIZ_ATTEMPTS_EXCEEDED);
            }
        }

        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .student(student)
                .build();

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        log.info("Started quiz attempt: {} for student: {} on quiz: {}",
                savedAttempt.getId(), studentId, quizId);

        return quizMapper.toAttemptResponse(savedAttempt, false);
    }

    @Transactional
    public QuizAttemptResponse submitQuiz(Long attemptId, SubmitQuizRequest request, Long studentId) {
        QuizAttempt attempt = quizAttemptRepository.findByIdWithAnswers(attemptId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUIZ_ATTEMPT_NOT_FOUND));

        // Verify ownership
        if (!attempt.getStudent().getId().equals(studentId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // Check if already completed
        if (attempt.getCompletedAt() != null) {
            throw new BusinessException(ErrorCode.QUIZ_ALREADY_COMPLETED);
        }

        Quiz quiz = attempt.getQuiz();

        // Check time limit
        if (quiz.getTimeLimit() != null) {
            Duration elapsed = Duration.between(attempt.getStartedAt(), LocalDateTime.now());
            if (elapsed.toMinutes() > quiz.getTimeLimit()) {
                log.warn("Quiz attempt {} exceeded time limit", attemptId);
                // Still grade it, but mark time exceeded
            }
        }

        // Grade the quiz
        gradeQuiz(attempt, request.getAnswers());

        attempt.setCompletedAt(LocalDateTime.now());
        attempt.setTimeSpent(request.getTimeSpent());

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        log.info("Submitted and graded quiz attempt: {} with score: {}%",
                savedAttempt.getId(), savedAttempt.getScore());

        // Return with answers if quiz allows showing correct answers
        return quizMapper.toAttemptResponse(savedAttempt, quiz.getShowCorrectAnswers());
    }

    private void gradeQuiz(QuizAttempt attempt, List<SubmitAnswerRequest> answerRequests) {
        List<StudentAnswer> gradedAnswers = new ArrayList<>();
        int totalPoints = 0;
        int earnedPoints = 0;

        for (SubmitAnswerRequest answerReq : answerRequests) {
            Question question = attempt.getQuiz().getQuestions().stream()
                    .filter(q -> q.getId().equals(answerReq.getQuestionId()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException(ErrorCode.QUESTION_NOT_FOUND));

            StudentAnswer studentAnswer = gradeAnswer(question, answerReq, attempt);
            gradedAnswers.add(studentAnswer);

            totalPoints += question.getPoints();
            earnedPoints += studentAnswer.getPointsEarned();
        }

        attempt.setAnswers(gradedAnswers);

        // Calculate score percentage
        double scorePercentage = totalPoints > 0 ? (earnedPoints * 100.0 / totalPoints) : 0;
        attempt.setScore(scorePercentage);

        // Check if passed
        attempt.setPassed(scorePercentage >= attempt.getQuiz().getPassingScore());
    }

    private StudentAnswer gradeAnswer(Question question, SubmitAnswerRequest answerReq, QuizAttempt attempt) {
        StudentAnswer studentAnswer = StudentAnswer.builder()
                .question(question)
                .quizAttempt(attempt)
                .answerText(answerReq.getAnswerText())
                .build();

        boolean isCorrect = false;
        int pointsEarned = 0;

        switch (question.getQuestionType()) {
            case MULTIPLE_CHOICE:
            case TRUE_FALSE:
                // For multiple choice and true/false, check if selected options match correct
                // options
                if (answerReq.getSelectedOptionIds() != null) {
                    List<QuestionOption> selectedOptions = question.getOptions().stream()
                            .filter(opt -> answerReq.getSelectedOptionIds().contains(opt.getId()))
                            .collect(Collectors.toList());
                    studentAnswer.setSelectedOptions(selectedOptions);

                    List<Long> correctOptionIds = question.getOptions().stream()
                            .filter(QuestionOption::getIsCorrect)
                            .map(QuestionOption::getId)
                            .collect(Collectors.toList());

                    isCorrect = selectedOptions.size() == correctOptionIds.size() &&
                            selectedOptions.stream().allMatch(opt -> correctOptionIds.contains(opt.getId()));
                }
                break;

            case SHORT_ANSWER:
                // Simple case-insensitive comparison for short answer
                if (answerReq.getAnswerText() != null && question.getCorrectAnswer() != null) {
                    isCorrect = answerReq.getAnswerText().trim().equalsIgnoreCase(question.getCorrectAnswer().trim());
                }
                break;
        }

        if (isCorrect) {
            pointsEarned = question.getPoints();
        }

        studentAnswer.setIsCorrect(isCorrect);
        studentAnswer.setPointsEarned(pointsEarned);

        return studentAnswer;
    }

    @Transactional(readOnly = true)
    public QuizAttemptResponse getAttemptResults(Long attemptId, Long studentId) {
        QuizAttempt attempt = quizAttemptRepository.findByIdWithAnswers(attemptId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUIZ_ATTEMPT_NOT_FOUND));

        // Verify ownership
        if (!attempt.getStudent().getId().equals(studentId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // Show answers only if quiz allows and attempt is completed
        boolean showAnswers = attempt.getCompletedAt() != null && attempt.getQuiz().getShowCorrectAnswers();
        return quizMapper.toAttemptResponse(attempt, showAnswers);
    }

    @Transactional(readOnly = true)
    public List<QuizAttemptResponse> getStudentAttempts(Long studentId) {
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentId(studentId);
        return attempts.stream()
                .map(attempt -> quizMapper.toAttemptResponse(attempt, false))
                .collect(Collectors.toList());
    }

    @Transactional
    public QuizResponse updateQuiz(Long quizId, QuizRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUIZ_NOT_FOUND));

        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setPassingScore(request.getPassingScore());
        quiz.setTimeLimit(request.getTimeLimit());
        quiz.setAttemptsAllowed(request.getAttemptsAllowed());
        quiz.setShowCorrectAnswers(request.getShowCorrectAnswers());

        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Updated quiz: {}", quizId);
        return quizMapper.toResponse(savedQuiz, false);
    }

    @Transactional
    public void deleteQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUIZ_NOT_FOUND));
        quizRepository.delete(quiz);
        log.info("Deleted quiz: {}", quizId);
    }
}
