package com.itqan.edu.features.articles;

import com.itqan.edu.common.config.StorageProperties;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.articles.dto.ArticleRequest;
import com.itqan.edu.features.articles.dto.ArticleResponse;
import com.itqan.edu.features.articles.mapper.ArticleMapper;
import com.itqan.edu.features.auth.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.s3.S3Client;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ArticleServiceTest {

    @Mock
    private ArticleRepository articleRepository;

    @Mock
    private ArticleMapper articleMapper;

    @Mock
    private S3Client s3Client;

    @Mock
    private StorageProperties storageProperties;

    @InjectMocks
    private ArticleService articleService;

    private User instructor(Long id) {
        return User.builder()
                .id(id)
                .email("author@example.com")
                .firstName("Test")
                .lastName("Author")
                .role(User.Role.INSTRUCTOR)
                .build();
    }

    @Test
    void createArticle_computesReadingTimeAndDerivesSlugFromTitle() {
        ArticleRequest request = new ArticleRequest();
        request.setTitle("My First Article");
        request.setContent("a".repeat(2500));
        request.setPublished(false);

        when(articleMapper.toEntity(any(ArticleRequest.class))).thenAnswer(invocation -> {
            ArticleRequest req = invocation.getArgument(0);
            Article article = new Article();
            article.setTitle(req.getTitle());
            article.setContent(req.getContent());
            return article;
        });
        when(articleRepository.existsBySlug(any())).thenReturn(false);
        when(articleRepository.save(any(Article.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(articleMapper.toResponse(any(Article.class))).thenAnswer(invocation -> {
            Article a = invocation.getArgument(0);
            return ArticleResponse.builder()
                    .title(a.getTitle())
                    .slug(a.getSlug())
                    .readingTimeMinutes(a.getReadingTimeMinutes())
                    .build();
        });

        ArticleResponse response = articleService.createArticle(request, instructor(5L));

        assertThat(response.getReadingTimeMinutes()).isEqualTo(3);
        assertThat(response.getSlug()).isEqualTo("my-first-article");
    }

    @Test
    void createArticle_appendsSuffixWhenBaseSlugTaken() {
        ArticleRequest request = new ArticleRequest();
        request.setTitle("Hello World");
        request.setContent("short content");
        request.setPublished(false);

        when(articleMapper.toEntity(any(ArticleRequest.class))).thenReturn(new Article());
        when(articleRepository.existsBySlug("hello-world")).thenReturn(true);
        when(articleRepository.existsBySlug("hello-world-2")).thenReturn(false);
        when(articleRepository.save(any(Article.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(articleMapper.toResponse(any(Article.class)))
                .thenReturn(ArticleResponse.builder().build());

        articleService.createArticle(request, instructor(5L));

        ArgumentCaptor<Article> captor = ArgumentCaptor.forClass(Article.class);
        org.mockito.Mockito.verify(articleRepository).save(captor.capture());
        assertThat(captor.getValue().getSlug()).isEqualTo("hello-world-2");
    }

    @Test
    void createArticle_avoidsSlugThatCollidesWithReservedRoute() {
        ArticleRequest request = new ArticleRequest();
        request.setTitle("Search");
        request.setContent("short content");
        request.setPublished(false);

        when(articleMapper.toEntity(any(ArticleRequest.class))).thenReturn(new Article());
        // "search" is reserved, so it is skipped without ever hitting the repository;
        // the next candidate must be checked and is free.
        when(articleRepository.existsBySlug("search-2")).thenReturn(false);
        when(articleRepository.save(any(Article.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(articleMapper.toResponse(any(Article.class)))
                .thenReturn(ArticleResponse.builder().build());

        articleService.createArticle(request, instructor(5L));

        ArgumentCaptor<Article> captor = ArgumentCaptor.forClass(Article.class);
        org.mockito.Mockito.verify(articleRepository).save(captor.capture());
        assertThat(captor.getValue().getSlug()).isEqualTo("search-2");
    }

    @Test
    void updateArticle_throwsForbiddenWhenInstructorDoesNotOwnArticle() {
        Article existing = new Article();
        existing.setId(10L);
        existing.setAuthorUserId(1L);
        existing.setTitle("Existing");

        when(articleRepository.findById(10L)).thenReturn(Optional.of(existing));

        ArticleRequest request = new ArticleRequest();
        request.setTitle("Updated");
        request.setContent("content");

        assertThatThrownBy(() -> articleService.updateArticle(10L, request, instructor(2L)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }
}
