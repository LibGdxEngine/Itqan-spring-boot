package com.itqan.edu.features.auth;

import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.auth.dto.AuthResponse;
import com.itqan.edu.features.auth.dto.LoginRequest;
import com.itqan.edu.features.auth.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AuthControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthRepository authRepository;

    private static final String BASE_URL = "/api/auth";

    @BeforeEach
    void setUp() {
        authRepository.deleteAll();
    }

    @Test
    @DisplayName("Register new user - should return 201 with token")
    void testRegister_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .email("newuser@test.com")
                .password("password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                BASE_URL + "/register",
                request,
                AuthResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getToken()).isNotBlank();
        assertThat(response.getBody().getEmail()).isEqualTo("newuser@test.com");
        assertThat(response.getBody().getFirstName()).isEqualTo("John");
        assertThat(response.getBody().getLastName()).isEqualTo("Doe");
        assertThat(response.getBody().getRole()).isEqualTo(User.Role.STUDENT);
    }

    @Test
    @DisplayName("Register with duplicate email - should return 409")
    void testRegister_DuplicateEmail() {
        // First registration
        RegisterRequest request = RegisterRequest.builder()
                .email("duplicate@test.com")
                .password("password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        restTemplate.postForEntity(BASE_URL + "/register", request, AuthResponse.class);

        // Second registration with same email
        RegisterRequest duplicateRequest = RegisterRequest.builder()
                .email("duplicate@test.com")
                .password("different123")
                .firstName("Jane")
                .lastName("Smith")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/register",
                duplicateRequest,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Register with invalid email - should return 400")
    void testRegister_InvalidEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .email("invalid-email")
                .password("password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/register",
                request,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Login with valid credentials - should return 200 with token")
    void testLogin_Success() {
        // First register a user
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email("login@test.com")
                .password("password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        restTemplate.postForEntity(BASE_URL + "/register", registerRequest, AuthResponse.class);

        // Then login
        LoginRequest loginRequest = LoginRequest.builder()
                .email("login@test.com")
                .password("password123")
                .build();

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                BASE_URL + "/login",
                loginRequest,
                AuthResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getToken()).isNotBlank();
        assertThat(response.getBody().getEmail()).isEqualTo("login@test.com");
    }

    @Test
    @DisplayName("Login with invalid password - should return 401")
    void testLogin_InvalidCredentials() {
        // First register a user
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email("wrong-password@test.com")
                .password("password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        restTemplate.postForEntity(BASE_URL + "/register", registerRequest, AuthResponse.class);

        // Then login with wrong password
        LoginRequest loginRequest = LoginRequest.builder()
                .email("wrong-password@test.com")
                .password("wrongpassword")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/login",
                loginRequest,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Login with non-existent user - should return 401")
    void testLogin_NonExistentUser() {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("nonexistent@test.com")
                .password("password123")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/login",
                loginRequest,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Login with empty password - should return 400")
    void testLogin_EmptyPassword() {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("test@test.com")
                .password("")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/login",
                loginRequest,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
