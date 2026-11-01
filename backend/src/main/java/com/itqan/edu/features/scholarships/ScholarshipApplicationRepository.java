package com.itqan.edu.features.scholarships;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ScholarshipApplicationRepository
        extends JpaRepository<ScholarshipApplication, Long>, JpaSpecificationExecutor<ScholarshipApplication> {

    @Query("SELECT a FROM ScholarshipApplication a JOIN FETCH a.course WHERE a.student.id = :studentId ORDER BY a.createdAt DESC")
    List<ScholarshipApplication> findForStudent(@Param("studentId") Long studentId);

    boolean existsByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, ScholarshipStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM ScholarshipApplication a WHERE a.id = :id")
    Optional<ScholarshipApplication> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(a.fundAmount), 0) FROM ScholarshipApplication a " +
            "WHERE a.status = com.itqan.edu.features.scholarships.ScholarshipStatus.APPROVED " +
            "AND a.fundingSource = com.itqan.edu.features.scholarships.FundingSource.FUND")
    Double sumFundUsed();

    long countByStatus(ScholarshipStatus status);
}
