package com.itqan.edu.features.courses;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByModuleIdOrderByOrderIndexAsc(Long moduleId);

    List<Lesson> findByModuleCourseId(Long courseId);

    long countByModuleCourseIdAndActiveTrue(Long courseId);

    long countByActiveTrueAndModuleCourseActiveTrue();

    @Query("SELECT l.module.course.id, COUNT(l) FROM Lesson l " +
           "WHERE l.module.course.id IN :courseIds AND l.active = true GROUP BY l.module.course.id")
    List<Object[]> countActiveLessonsPerCourse(@Param("courseIds") java.util.Collection<Long> courseIds);
}
