<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# quizzes

## Purpose
Quiz system — quiz creation per lesson, question management (multiple choice, true/false, short answer, essay), attempt tracking, and automatic grading.

## Key Files

| File | Description |
|------|-------------|
| `QuizController.java` | Quiz CRUD, start attempt, submit answers, get results |
| `QuizService.java` | Quiz management, attempt handling, automatic grading logic |
| `Quiz.java` | JPA entity — lessonId, title, passingScore, timeLimit, maxAttempts |
| `Question.java` | JPA entity — quizId, text, type, correctAnswer, points, sequenceNumber |
| `QuestionOption.java` | JPA entity — questionId, option text, sequenceNumber |
| `QuizAttempt.java` | JPA entity — quizId, studentId, score, status, timestamps |
| `StudentAnswer.java` | JPA entity — attemptId, questionId, answerText, isCorrect |
| `QuestionType.java` | Enum — MULTIPLE_CHOICE, SHORT_ANSWER, ESSAY, TRUE_FALSE |
| `QuizRepository.java` | Quiz data access |
| `QuizAttemptRepository.java` | Attempt data access |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `dto/` | Quiz/Question/Option request/response, SubmitQuizRequest, QuizAttemptResponse, StudentAnswerResponse |
| `mapper/` | QuizMapper (MapStruct) |

## For AI Agents

### Working In This Directory
- Quizzes are attached to lessons (one quiz per lesson)
- Automatic grading for MULTIPLE_CHOICE and TRUE_FALSE; manual grading for ESSAY
- `maxAttempts` limits retries; `timeLimit` enforced per attempt
- `passingScore` determines pass/fail status

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
