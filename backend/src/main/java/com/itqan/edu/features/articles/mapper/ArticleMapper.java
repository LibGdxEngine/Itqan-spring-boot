package com.itqan.edu.features.articles.mapper;

import com.itqan.edu.features.articles.Article;
import com.itqan.edu.features.articles.dto.ArticleRequest;
import com.itqan.edu.features.articles.dto.ArticleResponse;
import com.itqan.edu.features.articles.dto.ArticleSummaryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface ArticleMapper {

    ArticleMapper INSTANCE = Mappers.getMapper(ArticleMapper.class);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "readingTimeMinutes", ignore = true)
    @Mapping(target = "published", ignore = true)
    @Mapping(target = "authorUserId", ignore = true)
    @Mapping(target = "authorName", ignore = true)
    @Mapping(target = "coverImageObjectKey", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "publishedAt", ignore = true)
    Article toEntity(ArticleRequest request);

    ArticleResponse toResponse(Article article);

    ArticleSummaryResponse toSummary(Article article);
}
