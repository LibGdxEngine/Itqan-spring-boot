package com.itqan.edu.features.quizzes;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseAccessService;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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
    private final CourseAccessService courseAccessService;

    @Transactional
    public QuizResponse createQuiz(QuizRequest request, User currentUser) {
        validate(request);
        Quiz quiz = Quiz.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .passingScore(request.getPassingScore() != null ? request.getPassingScore() : 70)
                .timeLimit(request.getTimeLimit())
                .attemptsAllowed(request.getAttemptsAllowed() != null ? request.getAttemptsAllowed() : -1)
                .showCorrectAnswers(request.getShowCorrectAnswers() != null ? request.getShowCorrectAnswers() : true)
                .build();

        // Attach to lesson or module if specified; the caller must manage that course.
        if (request.getLessonId() != null) {
            Lesson lesson = lessonRepository.findById(request.getLessonId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
            courseAccessService.assertCanManage(currentUser, lesson.getModule().getCourse());
            if (quizRepository.findByLessonId(lesson.getId()).isPresent()) {
                throw new BusinessException(ErrorCode.INVALID_QUIZ, "This lesson already has a quiz");
            }
            quiz.setLesson(lesson);
        } else if (request.getModuleId() != null) {
            Module module = moduleRepository.findById(request.getModuleId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));
            courseAccessService.assertCanManage(currentUser, module.getCourse());
            if (quizRepository.findByModuleId(module.getId()).isPresent()) {
                throw new BusinessException(ErrorCode.INVALID_QUIZ, "This module already has a quiz");
            }
            quiz.setModule(module);
        } else if (currentUser.getRole() != User.Role.ADMIN) {
            throw new BusinessException(ErrorCode.INVALID_QUIZ, "A quiz must belong to a lesson or module");
        }

        if (request.getQuestions() != null) {
            List<QuestionRequest> requests = request.getQuestions();
            for (int i = 0; i < requests.size(); i++) {
                Question question = createQuestion(requests.get(i), quiz);
                question.setOrderIndex(i + 1);
                quiz.getQuestions().add(question);
            }
        }

        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Created quiz: {} with {} questions", savedQuiz.getId(), savedQuiz.getQuestions().size());
        return quizMapper.toResponse(savedQuiz, true);
    }

    private Question createQuestion(QuestionRequest request, Quiz quiz) {
        Question question = Question.builder()
                .questionText(request.getQuestionText().trim())
                .questionType(request.getQuestionType())
                .points(request.getPoints() != null ? request.getPoints() : 1)
                .orderIndex(request.getOrderIndex())
                .quiz(quiz)
                .correctAnswer(request.getQuestionType() == QuestionType.SHORT_ANSWER
                        ? request.getCorrectAnswer().trim() : null)
                .build();

        // Add options for multiple choice and true/false questions
        if (usesOptions(request.getQuestionType()) && request.getOptions() != null) {
            List<QuestionOptionRequest> options = request.getOptions();
            for (int i = 0; i < options.size(); i++) {
                QuestionOption option = createQuestionOption(options.get(i), question);
                option.setOrderIndex(i + 1);
                question.getOptions().add(option);
            }
        }

        return question;
    }

    private QuestionOption createQuestionOption(QuestionOptionRequest request, Question question) {
        return QuestionOption.builder()
                .optionText(request.getOptionText().trim())
                .isCorrect(request.getIsCorrect() != null ? request.getIsCorrect() : false)
                .orderIndex(request.getOrderIndex())
                .question(question)
                .build();
    }

    /** Student view: no correct answers. Requires access to the lesson or course. */
    @Transactional(readOnly = true)
    public QuizResponse getQuiz(Long quizId, User currentUser) {
        Quiz quiz = quizRepository.findByIdWithQuestions(quizId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUIZ_NOT_FOUND));
        assertCanTake(currentUser, quiz);

        // Don't show correct answers until quiz is taken
        return quizMapper.toResponse(quiz, false);
    }

    /** Editor view for the course owner or an admin, including the answer key. */
    @Transactional(readOnly = true)
    public QuizResponse getQuizForEditing(Long quizId, User currentUser) {
        Quiz quiz = quizRepository.findByIdWithQuestions(quizId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUIZ_NOT_FOUND));
        assertCanManage(currentUser, quiz);
        return quizMapper.toResponse(quiz, true);
    }

    @Transactional
    public QuizAttemptResponse startQuizAttempt(Long quizId, Long studentId, User currentUser) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUIZ_NOT_FOUND));
        assertCanTake(currentUser, quiz);

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

        // Mutate in place: replacing an orphan-removal collection makes Hibernate fail the flush.
        attempt.getAnswers().clear();
        attempt.getAnswers().addAll(gradedAnswers);

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
    public QuizResponse updateQuiz(Long quizId, QuizRequest request, User currentUser) {
        Quiz quiz = quizRepository.findByIdWithQuestions(quizId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUIZ_NOT_FOUND));
        assertCanManage(currentUser, quiz);
        validate(request);

        quiz.setTitle(request.getTitle().trim());
        quiz.setDescription(request.getDescription());
        quiz.setPassingScore(request.getPassingScore() != null ? request.getPassingScore() : quiz.getPassingScore());
        quiz.setTimeLimit(request.getTimeLimit());
        quiz.setAttemptsAllowed(request.getAttemptsAllowed() != null ? request.getAttemptsAllowed() : -1);
        quiz.setShowCorrectAnswers(request.getShowCorrectAnswers() != null
                ? request.getShowCorrectAnswers() : quiz.getShowCorrectAnswers());
        if (request.getQuestions() != null) {
            syncQuestions(quiz, request.getQuestions());
        }

        // The quiz is managed: flush (not save/merge, which would copy new child rows) so new
        // questions and options get their ids before mapping the response.
        quizRepository.flush();
        log.info("Updated quiz: {}", quizId);
        return quizMapper.toResponse(quiz, true);
    }

    @Transactional
    public void deleteQuiz(Long quizId, User currentUser) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUIZ_NOT_FOUND));
        assertCanManage(currentUser, quiz);
        quizAttemptRepository.deleteByQuiz_IdIn(List.of(quizId));
        // Detach through the owning lesson/module so their cascade does not re-save the quiz.
        if (quiz.getLesson() != null) {
            quiz.getLesson().setQuiz(null);
        } else if (quiz.getModule() != null) {
            quiz.getModule().setQuiz(null);
        }
        quizRepository.delete(quiz);
        log.info("Deleted quiz: {}", quizId);
    }

    /**
     * Updates questions and options in place, matching by id, so past attempts keep pointing at
     * the same rows. Removing a question or option that a student already answered is refused.
     */
    private void syncQuestions(Quiz quiz, List<QuestionRequest> requests) {
        Map<Long, Question> existing = new HashMap<>();
        quiz.getQuestions().forEach(q -> existing.put(q.getId(), q));

        List<Question> next = new ArrayList<>();
        Set<Long> removedOptionIds = new HashSet<>();
        Map<Question, List<QuestionOption>> pendingOptions = new java.util.IdentityHashMap<>();
        for (int i = 0; i < requests.size(); i++) {
            QuestionRequest req = requests.get(i);
            Question question;
            if (req.getId() != null) {
                question = existing.get(req.getId());
                if (question == null) {
                    throw new BusinessException(ErrorCode.INVALID_QUIZ,
                            "Question " + req.getId() + " is not part of this quiz");
                }
                question.setQuestionText(req.getQuestionText().trim());
                question.setQuestionType(req.getQuestionType());
                question.setPoints(req.getPoints() != null ? req.getPoints() : 1);
                question.setCorrectAnswer(req.getQuestionType() == QuestionType.SHORT_ANSWER
                        ? req.getCorrectAnswer().trim() : null);
                List<QuestionOption> options = planOptions(question,
                        usesOptions(req.getQuestionType()) ? req.getOptions() : List.of(), removedOptionIds);
                pendingOptions.put(question, options);
            } else {
                question = createQuestion(req, quiz);
            }
            question.setOrderIndex(i + 1);
            next.add(question);
        }

        Set<Long> removedQuestionIds = new HashSet<>(existing.keySet());
        next.stream().map(Question::getId).filter(Objects::nonNull).forEach(removedQuestionIds::remove);
        if (!removedQuestionIds.isEmpty()
                && quizAttemptRepository.countAnswersForQuestions(removedQuestionIds) > 0) {
            throw new BusinessException(ErrorCode.QUIZ_HAS_ANSWERS);
        }
        if (!removedOptionIds.isEmpty()
                && quizAttemptRepository.countAnswersSelectingOptions(removedOptionIds) > 0) {
            throw new BusinessException(ErrorCode.QUIZ_HAS_ANSWERS);
        }

        // Collections change only after the checks: the count queries above auto-flush, and an
        // earlier orphan removal would already have deleted answered rows.
        pendingOptions.forEach((question, options) -> {
            question.getOptions().clear();
            question.getOptions().addAll(options);
        });
        quiz.getQuestions().clear();
        quiz.getQuestions().addAll(next);
    }

    /** Builds the question's new option list and records the ids of options that were dropped. */
    private List<QuestionOption> planOptions(Question question, List<QuestionOptionRequest> requests,
                                             Set<Long> removedOptionIds) {
        Map<Long, QuestionOption> existing = new HashMap<>();
        question.getOptions().forEach(o -> existing.put(o.getId(), o));

        List<QuestionOption> next = new ArrayList<>();
        for (int i = 0; i < requests.size(); i++) {
            QuestionOptionRequest req = requests.get(i);
            QuestionOption option;
            if (req.getId() != null) {
                option = existing.get(req.getId());
                if (option == null) {
                    throw new BusinessException(ErrorCode.INVALID_QUIZ,
                            "Option " + req.getId() + " is not part of this question");
                }
                option.setOptionText(req.getOptionText().trim());
                option.setIsCorrect(Boolean.TRUE.equals(req.getIsCorrect()));
            } else {
                option = createQuestionOption(req, question);
            }
            option.setOrderIndex(i + 1);
            next.add(option);
        }

        Set<Long> removed = new HashSet<>(existing.keySet());
        next.stream().map(QuestionOption::getId).filter(Objects::nonNull).forEach(removed::remove);
        removedOptionIds.addAll(removed);
        return next;
    }

    private static boolean usesOptions(QuestionType type) {
        return type == QuestionType.MULTIPLE_CHOICE || type == QuestionType.TRUE_FALSE;
    }

    private static void validate(QuizRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_QUIZ, "Quiz title is required");
        }
        if (request.getPassingScore() != null && (request.getPassingScore() < 0 || request.getPassingScore() > 100)) {
            throw new BusinessException(ErrorCode.INVALID_QUIZ, "Passing score must be between 0 and 100");
        }
        if (request.getTimeLimit() != null && request.getTimeLimit() <= 0) {
            throw new BusinessException(ErrorCode.INVALID_QUIZ, "Time limit must be positive");
        }
        if (request.getAttemptsAllowed() != null && request.getAttemptsAllowed() != -1
                && request.getAttemptsAllowed() <= 0) {
            throw new BusinessException(ErrorCode.INVALID_QUIZ,
                    "Attempts allowed must be positive, or -1 for unlimited");
        }
        if (request.getQuestions() == null) {
            return;
        }
        for (int i = 0; i < request.getQuestions().size(); i++) {
            QuestionRequest q = request.getQuestions().get(i);
            String where = "Question " + (i + 1) + ": ";
            if (q.getQuestionText() == null || q.getQuestionText().isBlank()) {
                throw new BusinessException(ErrorCode.INVALID_QUIZ, where + "text is required");
            }
            if (q.getQuestionType() == null) {
                throw new BusinessException(ErrorCode.INVALID_QUIZ, where + "type is required");
            }
            if (q.getPoints() != null && q.getPoints() < 1) {
                throw new BusinessException(ErrorCode.INVALID_QUIZ, where + "points must be at least 1");
            }
            List<QuestionOptionRequest> options = q.getOptions() == null ? List.of() : q.getOptions();
            long correct = options.stream().filter(o -> Boolean.TRUE.equals(o.getIsCorrect())).count();
            switch (q.getQuestionType()) {
                case MULTIPLE_CHOICE -> {
                    if (options.size() < 2 || correct < 1) {
                        throw new BusinessException(ErrorCode.INVALID_QUIZ,
                                where + "needs at least two options and one correct answer");
                    }
                }
                case TRUE_FALSE -> {
                    if (options.size() != 2 || correct != 1) {
                        throw new BusinessException(ErrorCode.INVALID_QUIZ,
                                where + "needs exactly two options with one correct answer");
                    }
                }
                case SHORT_ANSWER -> {
                    if (q.getCorrectAnswer() == null || q.getCorrectAnswer().isBlank()) {
                        throw new BusinessException(ErrorCode.INVALID_QUIZ, where + "expected answer is required");
                    }
                }
            }
            if (usesOptions(q.getQuestionType())
                    && options.stream().anyMatch(o -> o.getOptionText() == null || o.getOptionText().isBlank())) {
                throw new BusinessException(ErrorCode.INVALID_QUIZ, where + "options cannot be empty");
            }
        }
    }

    private static Course courseOf(Quiz quiz) {
        if (quiz.getLesson() != null) {
            return quiz.getLesson().getModule().getCourse();
        }
        if (quiz.getModule() != null) {
            return quiz.getModule().getCourse();
        }
        return null;
    }

    private void assertCanManage(User user, Quiz quiz) {
        Course course = courseOf(quiz);
        boolean allowed = course == null
                ? user != null && user.getRole() == User.Role.ADMIN
                : courseAccessService.canManage(user, course);
        if (!allowed) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private void assertCanTake(User user, Quiz quiz) {
        boolean allowed;
        if (quiz.getLesson() != null) {
            allowed = courseAccessService.canViewLesson(user, quiz.getLesson());
        } else if (quiz.getModule() != null) {
            allowed = courseAccessService.canViewCourseContent(user, quiz.getModule().getCourse());
        } else {
            allowed = user != null && user.getRole() == User.Role.ADMIN;
        }
        if (!allowed) {
            throw new BusinessException(ErrorCode.COURSE_ACCESS_DENIED);
        }
    }
}
