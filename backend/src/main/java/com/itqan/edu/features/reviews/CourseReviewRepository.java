package com.itqan.edu.features.reviews;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CourseReviewRepository extends JpaRepository<CourseReview, Long>, JpaSpecificationExecutor<CourseReview> {

    Page<CourseReview> findByCourseIdAndHiddenFalseOrderByCreatedAtDesc(Long courseId, Pageable pageable);

    Optional<CourseReview> findByCourseIdAndStudentId(Long courseId, Long studentId);

    /** Per course: average rating and count of visible reviews. */
    @Query("SELECT r.course.id, AVG(r.rating), COUNT(r) FROM CourseReview r " +
           "WHERE r.hidden = false AND r.course.id IN :courseIds GROUP BY r.course.id")
    List<Object[]> ratingStats(@Param("courseIds") Collection<Long> courseIds);

    @Query("SELECT r.rating, COUNT(r) FROM CourseReview r " +
           "WHERE r.hidden = false AND r.course.id = :courseId GROUP BY r.rating")
    List<Object[]> ratingDistribution(@Param("courseId") Long courseId);

    void deleteByCourseId(Long courseId);
}
