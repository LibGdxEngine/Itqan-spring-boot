package com.itqan.edu.features.clips;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClipRepository extends JpaRepository<Clip, Long> {

    Page<Clip> findByActiveTrueOrderByCreatedAtDesc(Pageable pageable);

    Page<Clip> findByTitleContainingIgnoreCaseAndActiveTrueOrderByCreatedAtDesc(String title, Pageable pageable);

    Page<Clip> findByTypeAndActiveTrueOrderByCreatedAtDesc(ClipType type, Pageable pageable);

    Page<Clip> findByTitleContainingIgnoreCaseAndTypeAndActiveTrueOrderByCreatedAtDesc(
            String title, ClipType type, Pageable pageable);
}
