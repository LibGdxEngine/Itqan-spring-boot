package com.itqan.edu.features.enrollments;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long>, JpaSpecificationExecutor<Enrollment> {
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

    long countByCourseId(Long courseId);

    long countByEnrolledAtBetween(java.time.LocalDateTime from, java.time.LocalDateTime to);

    @Query("SELECT CAST(e.enrolledAt AS date), COUNT(e) FROM Enrollment e " +
           "WHERE e.enrolledAt BETWEEN :from AND :to GROUP BY CAST(e.enrolledAt AS date)")
    List<Object[]> countEnrollmentsPerDay(@Param("from") java.time.LocalDateTime from,
                                          @Param("to") java.time.LocalDateTime to);

    long countByCourseIdIn(java.util.Collection<Long> courseIds);

    void deleteByCourseId(Long courseId);

    /** Per course: non-dropped enrollments, completed, average progress, enrolled within range. */
    @Query("SELECT e.course.id, COUNT(e), " +
           "SUM(CASE WHEN e.status = :completed THEN 1 ELSE 0 END), AVG(e.progress), " +
           "SUM(CASE WHEN e.enrolledAt BETWEEN :from AND :to THEN 1 ELSE 0 END) " +
           "FROM Enrollment e WHERE e.course.id IN :courseIds AND e.status <> :dropped GROUP BY e.course.id")
    List<Object[]> courseEnrollmentStats(@Param("courseIds") java.util.Collection<Long> courseIds,
                                         @Param("from") java.time.LocalDateTime from,
                                         @Param("to") java.time.LocalDateTime to,
                                         @Param("completed") EnrollmentStatus completed,
                                         @Param("dropped") EnrollmentStatus dropped);

    @Query("SELECT COUNT(DISTINCT e.student.id) FROM Enrollment e " +
           "WHERE e.course.id IN :courseIds AND e.status <> :dropped")
    long countDistinctStudents(@Param("courseIds") java.util.Collection<Long> courseIds,
                               @Param("dropped") EnrollmentStatus dropped);

    @Query("SELECT CAST(e.enrolledAt AS date), COUNT(e) FROM Enrollment e " +
           "WHERE e.course.id IN :courseIds AND e.enrolledAt BETWEEN :from AND :to " +
           "GROUP BY CAST(e.enrolledAt AS date)")
    List<Object[]> countCourseEnrollmentsPerDay(@Param("courseIds") java.util.Collection<Long> courseIds,
                                                @Param("from") java.time.LocalDateTime from,
                                                @Param("to") java.time.LocalDateTime to);

    long countByCourseIdAndStatusNot(Long courseId, EnrollmentStatus status);

    @Query("SELECT e.course.id, COUNT(e) FROM Enrollment e " +
           "WHERE e.course.id IN :courseIds AND e.status <> :dropped GROUP BY e.course.id")
    List<Object[]> countStudentsPerCourse(@Param("courseIds") java.util.Collection<Long> courseIds,
                                          @Param("dropped") EnrollmentStatus dropped);
}
