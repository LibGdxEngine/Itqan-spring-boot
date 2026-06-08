package com.itqan.edu.features.articles;

import com.itqan.edu.common.config.StorageProperties;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.articles.dto.ArticleImageUploadResponse;
import com.itqan.edu.features.articles.dto.ArticleRequest;
import com.itqan.edu.features.articles.dto.ArticleResponse;
import com.itqan.edu.features.articles.dto.ArticleSummaryResponse;
import com.itqan.edu.features.articles.mapper.ArticleMapper;
import com.itqan.edu.features.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private static final long MAX_COVER_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_COVER_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");
    // Slugs that would collide with literal sub-routes of /api/articles
    // (e.g. /search, /mine, /id/{id}, /cover-image). A generated slug must
    // never equal one of these, or the public /{slug} detail route would be
    // shadowed by the reserved endpoint.
    private static final Set<String> RESERVED_SLUGS =
            Set.of("search", "mine", "id", "cover-image");

    private final ArticleRepository articleRepository;
    private final ArticleMapper articleMapper;
    private final S3Client s3Client;
    private final StorageProperties storageProperties;

    @Transactional
    public ArticleResponse createArticle(ArticleRequest request, User currentUser) {
        Article article = articleMapper.toEntity(request);
        article.setSlug(generateUniqueSlug(request.getTitle()));
        article.setReadingTimeMinutes(computeReadingTime(request.getContent()));
        article.setAuthorUserId(currentUser.getId());
        article.setAuthorName(resolveAuthorName(currentUser));
        article.setPublished(request.isPublished());
        if (request.isPublished()) {
            article.setPublishedAt(LocalDateTime.now());
        }
        article = articleRepository.save(article);
        return articleMapper.toResponse(article);
    }

    public Page<ArticleSummaryResponse> getPublished(Pageable pageable) {
        return articleRepository.findByPublishedTrue(pageable)
                .map(articleMapper::toSummary);
    }

    public List<ArticleSummaryResponse> searchPublished(String query) {
        if (query == null || query.isBlank()) {
            return articleRepository.findByPublishedTrueOrderByPublishedAtDesc().stream()
                    .map(articleMapper::toSummary)
                    .collect(Collectors.toList());
        }
        return articleRepository.searchPublished(query).stream()
                .map(articleMapper::toSummary)
                .collect(Collectors.toList());
    }

    public List<ArticleResponse> getMyArticles(User currentUser) {
        List<Article> articles = currentUser.getRole() == User.Role.ADMIN
                ? articleRepository.findAll()
                : articleRepository.findByAuthorUserIdOrderByCreatedAtDesc(currentUser.getId());
        return articles.stream()
                .map(articleMapper::toResponse)
                .collect(Collectors.toList());
    }

    public ArticleResponse getByIdForEdit(Long id, User currentUser) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ARTICLE_NOT_FOUND));
        enforceOwnerScopeIfInstructor(currentUser, article);
        return articleMapper.toResponse(article);
    }

    public ArticleResponse getBySlug(String slug) {
        Article article = articleRepository.findBySlug(slug)
                .filter(a -> Boolean.TRUE.equals(a.getPublished()))
                .orElseThrow(() -> new BusinessException(ErrorCode.ARTICLE_NOT_FOUND));
        return articleMapper.toResponse(article);
    }

    @Transactional
    public ArticleResponse updateArticle(Long id, ArticleRequest request, User currentUser) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ARTICLE_NOT_FOUND));
        enforceOwnerScopeIfInstructor(currentUser, article);

        if (!request.getTitle().equals(article.getTitle())) {
            article.setSlug(generateUniqueSlug(request.getTitle()));
        }
        article.setTitle(request.getTitle());
        article.setDescription(request.getDescription());
        article.setContent(request.getContent());
        article.setCoverImageUrl(request.getCoverImageUrl());
        article.setCategory(request.getCategory());
        article.setReadingTimeMinutes(computeReadingTime(request.getContent()));

        applyPublishState(article, request.isPublished());

        article = articleRepository.save(article);
        return articleMapper.toResponse(article);
    }

    @Transactional
    public ArticleResponse setPublished(Long id, boolean published, User currentUser) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ARTICLE_NOT_FOUND));
        enforceOwnerScopeIfInstructor(currentUser, article);
        applyPublishState(article, published);
        article = articleRepository.save(article);
        return articleMapper.toResponse(article);
    }

    @Transactional
    public void deleteArticle(Long id, User currentUser) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ARTICLE_NOT_FOUND));
        enforceOwnerScopeIfInstructor(currentUser, article);
        articleRepository.delete(article);
    }

    public ArticleImageUploadResponse uploadCoverImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Cover image file is required");
        }
        if (file.getSize() > MAX_COVER_BYTES) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Cover image file exceeds 5MB");
        }
        String contentType = file.getContentType();
        String normalized = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        if (!ALLOWED_COVER_TYPES.contains(normalized)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Only JPEG, PNG, or WebP images are allowed");
        }

        String objectKey = buildCoverObjectKey(file.getOriginalFilename());
        try {
            s3Client.putObject(PutObjectRequest.builder()
                            .bucket(storageProperties.getBucket())
                            .key(objectKey)
                            .contentType(normalized)
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException ex) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Failed to read cover image upload: " + ex.getMessage());
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Failed to upload cover image: " + ex.getMessage());
        }

        return ArticleImageUploadResponse.builder()
                .url(buildPublicUrl(objectKey))
                .objectKey(objectKey)
                .build();
    }

    private void applyPublishState(Article article, boolean published) {
        boolean wasPublished = Boolean.TRUE.equals(article.getPublished());
        article.setPublished(published);
        if (published) {
            if (!wasPublished || article.getPublishedAt() == null) {
                article.setPublishedAt(LocalDateTime.now());
            }
        } else {
            article.setPublishedAt(null);
        }
    }

    private void enforceOwnerScopeIfInstructor(User currentUser, Article article) {
        if (currentUser.getRole() != User.Role.INSTRUCTOR) {
            return;
        }
        if (article.getAuthorUserId() == null || !article.getAuthorUserId().equals(currentUser.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private int computeReadingTime(String content) {
        if (content == null) {
            return 1;
        }
        return Math.max(1, (int) Math.ceil(content.length() / 1000.0));
    }

    private String resolveAuthorName(User user) {
        String fullName = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return fullName.isBlank() ? user.getEmail() : fullName;
    }

    private String generateUniqueSlug(String title) {
        String base = slugify(title);
        if (isSlugAvailable(base)) {
            return base;
        }
        int suffix = 2;
        String candidate = base + "-" + suffix;
        while (!isSlugAvailable(candidate)) {
            suffix++;
            candidate = base + "-" + suffix;
        }
        return candidate;
    }

    private boolean isSlugAvailable(String slug) {
        return !RESERVED_SLUGS.contains(slug) && !articleRepository.existsBySlug(slug);
    }

    private String slugify(String title) {
        if (title == null) {
            return "article";
        }
        String slug = title.trim().toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", "-")
                .replaceAll("[^\\p{L}\\p{Nd}-]", "")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        return slug.isBlank() ? "article" : slug;
    }

    private String buildCoverObjectKey(String filename) {
        String safeName = (filename == null ? "cover.jpg" : filename).toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9.]+", "-")
                .replaceAll("^-|-$", "");
        if (safeName.isBlank()) safeName = "cover.jpg";
        return "articles/covers/" + UUID.randomUUID() + "-" + safeName;
    }

    private String buildPublicUrl(String objectKey) {
        String endpoint = storageProperties.getPublicEndpoint();
        if (endpoint == null) endpoint = "";
        endpoint = endpoint.replaceAll("/+$", "");
        if (storageProperties.isPathStyleAccessEnabled()) {
            return endpoint + "/" + storageProperties.getBucket() + "/" + objectKey;
        }
        return endpoint + "/" + objectKey;
    }
}
