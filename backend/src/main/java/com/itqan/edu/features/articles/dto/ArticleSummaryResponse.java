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
public class ArticleSummaryResponse {
    private Long id;
    private String title;
    private String slug;
    private String description;
    private String coverImageUrl;
    private Integer readingTimeMinutes;
    private String authorName;
    private String category;
    private Boolean published;
    private LocalDateTime publishedAt;
}
