package com.itqan.edu.features.certificates;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    Optional<Certificate> findByCode(String code);

    Optional<Certificate> findByStudentIdAndCourseId(Long studentId, Long courseId);

    List<Certificate> findByStudentIdOrderByIssuedAtDesc(Long studentId);

    void deleteByCourseId(Long courseId);
}
