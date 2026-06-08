package com.itqan.edu.features.articles;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    Optional<Article> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Article> findByPublishedTrue(Pageable pageable);

    List<Article> findByPublishedTrueOrderByPublishedAtDesc();

    List<Article> findByAuthorUserIdOrderByCreatedAtDesc(Long authorUserId);

    @Query("SELECT a FROM Article a WHERE a.published = true AND " +
            "(LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.content) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Article> searchPublished(@Param("query") String query);
}
