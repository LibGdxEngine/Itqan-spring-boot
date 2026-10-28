package com.itqan.edu.features.wishlist;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {

    List<WishlistItem> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    Optional<WishlistItem> findByStudentIdAndCourseId(Long studentId, Long courseId);

    void deleteByCourseId(Long courseId);
}
