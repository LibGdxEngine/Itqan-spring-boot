package com.itqan.edu.features.payments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentCodeRepository extends JpaRepository<EnrollmentCode, Long> {

    Optional<EnrollmentCode> findByCodeAndIsActiveTrue(String code);

    List<EnrollmentCode> findByCourseIdAndIsActiveTrue(Long courseId);

    List<EnrollmentCode> findByCreatedBy(Long createdBy);

    @Query("SELECT ec FROM EnrollmentCode ec WHERE ec.course.id = :courseId AND ec.isActive = true")
    List<EnrollmentCode> findActiveCoursesCodes(@Param("courseId") Long courseId);

    boolean existsByCode(String code);

    void deleteByCourseId(Long courseId);
}
