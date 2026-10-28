package com.itqan.edu.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itqan.edu.features.auth.RefreshTokenRepository;
import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.test.context.ActiveProfiles;

/**
 * Base class for integration tests. They run on H2 by default; {@code mvn -Ppostgres test}
 * runs the same tests on PostgreSQL 16 (Testcontainers) with the Flyway migrations applied
 * and Hibernate validating the schema. See the "postgres" profile in pom.xml.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected RefreshTokenRepository refreshTokenRepository;

    /**
     * Clears refresh tokens after every test so that the per-test
     * {@code authRepository.deleteAll()} calls in subclasses cannot trip the
     * {@code refresh_tokens -> users} foreign key (refresh tokens reference users
     * and have no cascade). This is a pre-existing teardown-ordering issue,
     * independent of any single feature.
     */
    @AfterEach
    void clearRefreshTokensAfterEach() {
        refreshTokenRepository.deleteAll();
    }
}
