package com.itqan.edu.features.quizzes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.student.id = :studentId AND qa.quiz.id = :quizId ORDER BY qa.startedAt DESC")
    List<QuizAttempt> findByStudentIdAndQuizId(@Param("studentId") Long studentId, @Param("quizId") Long quizId);

    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.student.id = :studentId ORDER BY qa.startedAt DESC")
    List<QuizAttempt> findByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.student.id = :studentId AND qa.quiz.id = :quizId")
    int countByStudentIdAndQuizId(@Param("studentId") Long studentId, @Param("quizId") Long quizId);

    @Query("SELECT qa FROM QuizAttempt qa LEFT JOIN FETCH qa.answers WHERE qa.id = :id")
    Optional<QuizAttempt> findByIdWithAnswers(@Param("id") Long id);

    /** Derived delete: loads each attempt so its answers cascade. */
    void deleteByQuiz_IdIn(Collection<Long> quizIds);

    long countByQuiz_Id(Long quizId);

    @Query("SELECT COUNT(a) FROM StudentAnswer a WHERE a.question.id IN :questionIds")
    long countAnswersForQuestions(@Param("questionIds") Collection<Long> questionIds);

    @Query("SELECT COUNT(a) FROM StudentAnswer a JOIN a.selectedOptions o WHERE o.id IN :optionIds")
    long countAnswersSelectingOptions(@Param("optionIds") Collection<Long> optionIds);

    /** Per quiz in the given courses: quiz id, completed attempts, average score, passed attempts. */
    @Query("SELECT q.id, COUNT(qa), AVG(qa.score), SUM(CASE WHEN qa.passed = true THEN 1 ELSE 0 END) " +
           "FROM QuizAttempt qa JOIN qa.quiz q LEFT JOIN q.lesson l LEFT JOIN l.module lm LEFT JOIN q.module m " +
           "WHERE qa.completedAt IS NOT NULL AND (lm.course.id IN :courseIds OR m.course.id IN :courseIds) " +
           "GROUP BY q.id")
    List<Object[]> quizStatsForCourses(@Param("courseIds") Collection<Long> courseIds);

    boolean existsByStudent_IdAndQuiz_IdAndPassedTrue(Long studentId, Long quizId);
}
