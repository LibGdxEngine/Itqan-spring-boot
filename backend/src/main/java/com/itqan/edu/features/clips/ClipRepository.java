package com.itqan.edu.features.clips;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClipRepository extends JpaRepository<Clip, Long> {

    @Query("SELECT c FROM Clip c WHERE c.active = true " +
           "AND (:type IS NULL OR c.type = :type) " +
           "AND (:search = '' OR (" +
           "     LOWER(c.title) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
           "     LOWER(c.description) LIKE LOWER(CONCAT('%',:search,'%')))) " +
           "ORDER BY c.createdAt DESC")
    Page<Clip> search(@Param("search") String search, @Param("type") ClipType type, Pageable pageable);
}
