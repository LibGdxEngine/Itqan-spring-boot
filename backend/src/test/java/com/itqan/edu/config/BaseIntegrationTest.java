package com.itqan.edu.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.test.context.ActiveProfiles;

/**
 * Base class for integration tests using H2 in-memory database.
 * 
 * Note: To use Testcontainers with PostgreSQL instead, uncomment the 
 * Testcontainers annotations and configuration below once Docker API 
 * compatibility is resolved (Docker 29.x requires API 1.44+).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    /*
     * Testcontainers configuration (for PostgreSQL):
     * Uncomment when Docker API compatibility is resolved
     *
     * @Container
     * static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
     *         .withDatabaseName("itqan_edu_test")
     *         .withUsername("test")
     *         .withPassword("test");
     *
     * @DynamicPropertySource
     * static void configureProperties(DynamicPropertyRegistry registry) {
     *     registry.add("spring.datasource.url", postgres::getJdbcUrl);
     *     registry.add("spring.datasource.username", postgres::getUsername);
     *     registry.add("spring.datasource.password", postgres::getPassword);
     * }
     */

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected ObjectMapper objectMapper;
}
