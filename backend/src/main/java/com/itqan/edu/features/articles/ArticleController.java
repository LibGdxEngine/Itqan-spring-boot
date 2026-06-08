package com.itqan.edu.features.articles;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.articles.dto.ArticleImageUploadResponse;
import com.itqan.edu.features.articles.dto.ArticleRequest;
import com.itqan.edu.features.articles.dto.ArticleResponse;
import com.itqan.edu.features.articles.dto.ArticleSummaryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
@Tag(name = "Articles", description = "Article management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class ArticleController {

    private final ArticleService articleService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @Operation(summary = "Get published articles (paginated)", description = "Get published articles, newest first")
    public ResponseEntity<Page<ArticleSummaryResponse>> getPublished(
            @PageableDefault(size = 20, sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(articleService.getPublished(pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "Search published articles", description = "Search published articles by query")
    public ResponseEntity<List<ArticleSummaryResponse>> searchArticles(
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(articleService.searchPublished(query));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Get current author articles", description = "Get own articles including drafts; ADMIN sees all")
    public ResponseEntity<List<ArticleResponse>> getMyArticles(Authentication authentication) {
        return ResponseEntity.ok(articleService.getMyArticles(currentUserService.getCurrentUser(authentication)));
    }

    @GetMapping("/id/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Get article by ID for editing", description = "Get an article (incl drafts) by ID for owner or ADMIN")
    public ResponseEntity<ArticleResponse> getArticleById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(articleService.getByIdForEdit(id, currentUserService.getCurrentUser(authentication)));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get published article by slug", description = "Get a published article by its slug")
    public ResponseEntity<ArticleResponse> getArticleBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(articleService.getBySlug(slug));
    }

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Create a new article", description = "Create a new article")
    public ResponseEntity<ArticleResponse> createArticle(
            @Valid @RequestBody ArticleRequest request,
            Authentication authentication) {
        ArticleResponse response = articleService.createArticle(request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Update article", description = "Update an existing article")
    public ResponseEntity<ArticleResponse> updateArticle(
            @PathVariable Long id,
            @Valid @RequestBody ArticleRequest request,
            Authentication authentication) {
        ArticleResponse response = articleService.updateArticle(id, request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Publish or unpublish article", description = "Toggle the published state of an article")
    public ResponseEntity<ArticleResponse> setPublished(
            @PathVariable Long id,
            @RequestParam boolean published,
            Authentication authentication) {
        ArticleResponse response = articleService.setPublished(id, published, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Delete article", description = "Delete an article")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id, Authentication authentication) {
        articleService.deleteArticle(id, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/cover-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Upload an article cover image",
            description = "Upload a JPEG, PNG, or WebP image (max 5MB) and receive a public URL")
    public ResponseEntity<ArticleImageUploadResponse> uploadCoverImage(
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(articleService.uploadCoverImage(file));
    }
}
