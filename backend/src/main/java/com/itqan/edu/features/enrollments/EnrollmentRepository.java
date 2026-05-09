package com.itqan.edu.features.enrollments;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentId(Long studentId);

    Page<Enrollment> findByStudentId(Long studentId, Pageable pageable);

    List<Enrollment> findByCourseId(Long courseId);

    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    @Query("SELECT e.course.id, e.course.title, COUNT(e), " +
           "SUM(CASE WHEN e.status = 'COMPLETED' THEN 1 ELSE 0 END), " +
           "AVG(e.progress) " +
           "FROM Enrollment e GROUP BY e.course.id, e.course.title ORDER BY COUNT(e) DESC")
    List<Object[]> findCoursePopularity();

    @Query("SELECT COUNT(e), " +
           "SUM(CASE WHEN e.status = 'COMPLETED' THEN 1 ELSE 0 END), " +
           "AVG(e.progress) " +
           "FROM Enrollment e WHERE e.course.id = :courseId")
    Object[] findCompletionStatsByCourse(@Param("courseId") Long courseId);

    long count();

    long countByCourseIdIn(java.util.Collection<Long> courseIds);
}
