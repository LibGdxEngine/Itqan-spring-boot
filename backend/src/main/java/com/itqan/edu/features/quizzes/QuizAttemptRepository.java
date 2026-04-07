package com.itqan.edu.features.quizzes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}
