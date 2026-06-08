package com.itqan.edu.features.articles.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleResponse {
    private Long id;
    private String title;
    private String slug;
    private String description;
    private String content;
    private String coverImageUrl;
    private Integer readingTimeMinutes;
    private Boolean published;
    private Long authorUserId;
    private String authorName;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;
}
