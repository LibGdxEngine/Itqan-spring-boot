package com.itqan.edu.features.articles;

import com.itqan.edu.common.security.JwtTokenProvider;
import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ArticleControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthRepository authRepository;

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        articleRepository.deleteAll();
        authRepository.deleteAll();
    }

    @Test
    @DisplayName("Anyone can list published articles without authentication")
    void publicCanListArticlesAnonymously() {
        ResponseEntity<Map> response = restTemplate.getForEntity("/api/articles", Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("content");
    }

    @Test
    @DisplayName("Search endpoint is reachable without authentication")
    void publicCanSearchAnonymously() {
        ResponseEntity<String> response =
                restTemplate.getForEntity("/api/articles/search?query=anything", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Anonymous users cannot create articles")
    void anonymousCannotCreateArticle() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/articles",
                HttpMethod.POST,
                new HttpEntity<>(articleBody("Blocked", "content", true), headers),
                Map.class);

        assertThat(response.getStatusCode())
                .isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Instructor can publish an article that the public can read by slug")
    void instructorPublishesAndPublicReadsBySlug() {
        User instructor = createInstructor("author@test.com");
        String token = jwtTokenProvider.generateToken(instructor);

        ResponseEntity<Map> created = restTemplate.exchange(
                "/api/articles",
                HttpMethod.POST,
                authEntity(articleBody("Spring Boot Tips", "a".repeat(2500), true), token),
                Map.class);

        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(created.getBody()).isNotNull();
        String slug = (String) created.getBody().get("slug");
        assertThat(slug).isNotBlank();
        assertThat(created.getBody().get("readingTimeMinutes")).isEqualTo(3);
        assertThat(created.getBody().get("authorName")).isEqualTo("First Last");

        ResponseEntity<Map> detail = restTemplate.exchange(
                "/api/articles/{slug}", HttpMethod.GET, null, Map.class, slug);

        assertThat(detail.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(detail.getBody().get("title")).isEqualTo("Spring Boot Tips");
    }

    @Test
    @DisplayName("Draft articles are not visible to the public by slug")
    void draftIsNotPubliclyVisible() {
        User instructor = createInstructor("author@test.com");
        String token = jwtTokenProvider.generateToken(instructor);

        ResponseEntity<Map> created = restTemplate.exchange(
                "/api/articles",
                HttpMethod.POST,
                authEntity(articleBody("Hidden Draft", "draft body", false), token),
                Map.class);

        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String slug = (String) created.getBody().get("slug");

        ResponseEntity<Map> detail = restTemplate.exchange(
                "/api/articles/{slug}", HttpMethod.GET, null, Map.class, slug);

        assertThat(detail.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Instructors cannot edit articles they do not own")
    void instructorCannotEditOthersArticle() {
        User owner = createInstructor("owner@test.com");
        User other = createInstructor("other@test.com");

        ResponseEntity<Map> created = restTemplate.exchange(
                "/api/articles",
                HttpMethod.POST,
                authEntity(articleBody("Owned", "content", true),
                        jwtTokenProvider.generateToken(owner)),
                Map.class);
        Object id = created.getBody().get("id");

        ResponseEntity<Map> update = restTemplate.exchange(
                "/api/articles/" + id,
                HttpMethod.PUT,
                authEntity(articleBody("Hijacked", "content", true),
                        jwtTokenProvider.generateToken(other)),
                Map.class);

        assertThat(update.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("A title that slugifies to a reserved route segment does not shadow the detail route")
    void reservedTitleDoesNotShadowDetailRoute() {
        User instructor = createInstructor("author@test.com");
        String token = jwtTokenProvider.generateToken(instructor);

        ResponseEntity<Map> created = restTemplate.exchange(
                "/api/articles",
                HttpMethod.POST,
                authEntity(articleBody("Search", "content", true), token),
                Map.class);

        String slug = (String) created.getBody().get("slug");
        assertThat(slug).isNotEqualTo("search");

        ResponseEntity<Map> detail = restTemplate.exchange(
                "/api/articles/{slug}", HttpMethod.GET, null, Map.class, slug);
        assertThat(detail.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(detail.getBody().get("title")).isEqualTo("Search");
    }

    @Test
    @DisplayName("Arabic titles produce a reachable slug")
    void arabicTitleProducesReachableSlug() {
        User instructor = createInstructor("author@test.com");
        String token = jwtTokenProvider.generateToken(instructor);

        ResponseEntity<Map> created = restTemplate.exchange(
                "/api/articles",
                HttpMethod.POST,
                authEntity(articleBody("مقالة عربية", "محتوى المقالة", true), token),
                Map.class);

        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String slug = (String) created.getBody().get("slug");
        assertThat(slug).isNotBlank();

        ResponseEntity<Map> detail = restTemplate.exchange(
                "/api/articles/{slug}", HttpMethod.GET, null, Map.class, slug);
        assertThat(detail.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(detail.getBody().get("title")).isEqualTo("مقالة عربية");
    }

    private Map<String, Object> articleBody(String title, String content, boolean published) {
        Map<String, Object> body = new HashMap<>();
        body.put("title", title);
        body.put("content", content);
        body.put("description", "A short description");
        body.put("category", "GENERAL");
        body.put("published", published);
        return body;
    }

    private HttpEntity<Map<String, Object>> authEntity(Map<String, Object> body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return new HttpEntity<>(body, headers);
    }

    private User createInstructor(String email) {
        return authRepository.save(User.builder()
                .email(email)
                .password("password")
                .firstName("First")
                .lastName("Last")
                .role(User.Role.INSTRUCTOR)
                .superAdmin(false)
                .enabled(true)
                .authProvider(User.AuthProvider.LOCAL)
                .build());
    }
}
