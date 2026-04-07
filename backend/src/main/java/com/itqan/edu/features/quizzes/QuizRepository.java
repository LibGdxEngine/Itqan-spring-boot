package com.itqan.edu.features.quizzes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    Optional<Quiz> findByLessonId(Long lessonId);

    Optional<Quiz> findByModuleId(Long moduleId);

    @Query("SELECT q FROM Quiz q WHERE q.active = true")
    List<Quiz> findAllActive();

    @Query("SELECT q FROM Quiz q LEFT JOIN FETCH q.questions WHERE q.id = :id")
    Optional<Quiz> findByIdWithQuestions(@Param("id") Long id);
}
