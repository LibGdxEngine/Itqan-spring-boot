package com.itqan.edu.features.specializations;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpecializationRepository extends JpaRepository<Specialization, Long> {
    List<Specialization> findByActiveTrueOrderByDisplayOrderAscIdAsc();

    List<Specialization> findAllByOrderByDisplayOrderAscIdAsc();

    long countByActiveTrue();

    boolean existsBySlug(String slug);
}
