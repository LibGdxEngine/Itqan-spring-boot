package com.itqan.edu.features.courses;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByActiveTrue();

    List<Course> findByInstructor(String instructor);

    List<Course> findByOwnerUserId(Long ownerUserId);

    // Search query
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Course c WHERE c.active = true AND " +
            "(LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Course> searchCourses(@org.springframework.data.repository.query.Param("query") String query);

    // Filter by level
    List<Course> findByActiveTrueAndLevel(String level);

    // Filter by category
    List<Course> findByActiveTrueAndCategory(String category);

    // Filter by price range
    List<Course> findByActiveTrueAndPriceBetween(Double minPrice, Double maxPrice);

    // Combined filters
    List<Course> findByActiveTrueAndLevelAndCategory(String level, String category);

    List<Course> findByActiveTrueAndLevelAndPriceBetween(String level, Double minPrice, Double maxPrice);

    List<Course> findByActiveTrueAndCategoryAndPriceBetween(String category, Double minPrice, Double maxPrice);

    // Sorting
    List<Course> findByActiveTrueOrderByCreatedAtDesc();

    List<Course> findByActiveTrueOrderByPriceAsc();

    List<Course> findByActiveTrueOrderByPriceDesc();
}
