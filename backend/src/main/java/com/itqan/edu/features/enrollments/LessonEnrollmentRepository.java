package com.itqan.edu.features.enrollments;

import com.itqan.edu.features.courses.Lesson;
import com.itqan.edu.features.students.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LessonEnrollmentRepository extends JpaRepository<LessonEnrollment, Long> {
    Optional<LessonEnrollment> findByStudentAndLesson(Student student, Lesson lesson);

    List<LessonEnrollment> findByStudent(Student student);

    boolean existsByStudentAndLesson(Student student, Lesson lesson);

    long countByStudentAndIsCompletedTrue(Student student);

    @Query("SELECT le.lesson.id, le.lesson.title, " +
           "SUM(CASE WHEN le.isCompleted = true THEN 1 ELSE 0 END), " +
           "COUNT(le) " +
           "FROM LessonEnrollment le WHERE le.lesson.module.course.id = :courseId " +
           "GROUP BY le.lesson.id, le.lesson.title ORDER BY le.lesson.orderIndex ASC")
    List<Object[]> findLessonCompletionRatesByCourse(@Param("courseId") Long courseId);

    void deleteByLessonId(Long lessonId);

    void deleteByLessonIdIn(Collection<Long> lessonIds);

    @Query("SELECT le.lesson.id, COUNT(le) FROM LessonEnrollment le " +
           "WHERE le.isCompleted = true AND le.lesson.module.course.id = :courseId GROUP BY le.lesson.id")
    List<Object[]> countCompletionsPerLesson(@Param("courseId") Long courseId);

    List<LessonEnrollment> findByStudent_IdAndLesson_Module_Course_Id(Long studentId, Long courseId);

    Optional<LessonEnrollment> findByStudent_IdAndLesson_Id(Long studentId, Long lessonId);

    /** Completion timestamps for a student, newest first (streaks and weekly activity). */
    @Query("SELECT le.completedAt FROM LessonEnrollment le " +
           "WHERE le.student.id = :studentId AND le.isCompleted = true AND le.completedAt IS NOT NULL " +
           "ORDER BY le.completedAt DESC")
    List<java.time.LocalDateTime> completionTimes(@Param("studentId") Long studentId);
}
