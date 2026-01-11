package com.itqan.edu.features.auth;

import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.auth.dto.AuthResponse;
import com.itqan.edu.features.auth.dto.GoogleAuthRequest;
import com.itqan.edu.features.auth.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class GoogleAuthIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthRepository authRepository;

    @MockBean
    private GoogleAuthService googleAuthService;

    private static final String BASE_URL = "/api/auth";

    @BeforeEach
    void setUp() {
        authRepository.deleteAll();
    }

    @Test
    @DisplayName("Google auth for new user - should create account and return token")
    void testGoogleAuth_NewUser() {
        // Mock Google token verification
        GoogleAuthService.GoogleUserInfo googleUser = GoogleAuthService.GoogleUserInfo.builder()
                .email("newgoogleuser@gmail.com")
                .firstName("Google")
                .lastName("User")
                .providerId("google-id-12345")
                .build();
        when(googleAuthService.verifyToken(anyString())).thenReturn(googleUser);

        GoogleAuthRequest request = GoogleAuthRequest.builder()
                .idToken("valid-google-id-token")
                .build();

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                BASE_URL + "/google",
                request,
                AuthResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getToken()).isNotBlank();
        assertThat(response.getBody().getEmail()).isEqualTo("newgoogleuser@gmail.com");
        assertThat(response.getBody().getFirstName()).isEqualTo("Google");
        assertThat(response.getBody().getLastName()).isEqualTo("User");
        assertThat(response.getBody().getRole()).isEqualTo(User.Role.STUDENT);

        // Verify user was created in database
        User createdUser = authRepository.findByEmail("newgoogleuser@gmail.com").orElse(null);
        assertThat(createdUser).isNotNull();
        assertThat(createdUser.getAuthProvider()).isEqualTo(User.AuthProvider.GOOGLE);
        assertThat(createdUser.getProviderId()).isEqualTo("google-id-12345");
    }

    @Test
    @DisplayName("Google auth for existing Google user - should return token")
    void testGoogleAuth_ExistingGoogleUser() {
        // First, create a Google user
        GoogleAuthService.GoogleUserInfo googleUser = GoogleAuthService.GoogleUserInfo.builder()
                .email("existinggoogle@gmail.com")
                .firstName("Existing")
                .lastName("GoogleUser")
                .providerId("google-id-existing")
                .build();
        when(googleAuthService.verifyToken(anyString())).thenReturn(googleUser);

        // First auth creates the user
        GoogleAuthRequest firstRequest = GoogleAuthRequest.builder()
                .idToken("first-token")
                .build();
        restTemplate.postForEntity(BASE_URL + "/google", firstRequest, AuthResponse.class);

        // Second auth should just log them in
        GoogleAuthRequest secondRequest = GoogleAuthRequest.builder()
                .idToken("second-token")
                .build();

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                BASE_URL + "/google",
                secondRequest,
                AuthResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getToken()).isNotBlank();
        assertThat(response.getBody().getEmail()).isEqualTo("existinggoogle@gmail.com");
    }

    @Test
    @DisplayName("Google auth for existing local user - should link account and return token")
    void testGoogleAuth_ExistingLocalUser() {
        // First, create a local user
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email("localuser@gmail.com")
                .password("password123")
                .firstName("Local")
                .lastName("User")
                .build();
        restTemplate.postForEntity(BASE_URL + "/register", registerRequest, AuthResponse.class);

        // Verify user is LOCAL
        User localUser = authRepository.findByEmail("localuser@gmail.com").orElse(null);
        assertThat(localUser).isNotNull();
        assertThat(localUser.getAuthProvider()).isEqualTo(User.AuthProvider.LOCAL);

        // Now auth with Google using same email
        GoogleAuthService.GoogleUserInfo googleUser = GoogleAuthService.GoogleUserInfo.builder()
                .email("localuser@gmail.com")
                .firstName("Google")
                .lastName("Name")
                .providerId("google-id-link")
                .build();
        when(googleAuthService.verifyToken(anyString())).thenReturn(googleUser);

        GoogleAuthRequest googleRequest = GoogleAuthRequest.builder()
                .idToken("google-token")
                .build();

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                BASE_URL + "/google",
                googleRequest,
                AuthResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getToken()).isNotBlank();

        // Verify account was linked to Google
        User updatedUser = authRepository.findByEmail("localuser@gmail.com").orElse(null);
        assertThat(updatedUser).isNotNull();
        assertThat(updatedUser.getAuthProvider()).isEqualTo(User.AuthProvider.GOOGLE);
        assertThat(updatedUser.getProviderId()).isEqualTo("google-id-link");
    }

    @Test
    @DisplayName("Google auth with invalid token - should return 401")
    void testGoogleAuth_InvalidToken() {
        // Mock Google token verification to throw exception
        when(googleAuthService.verifyToken(anyString()))
                .thenThrow(new com.itqan.edu.common.exception.BusinessException(
                        com.itqan.edu.common.exception.ErrorCode.GOOGLE_AUTH_FAILED));

        GoogleAuthRequest request = GoogleAuthRequest.builder()
                .idToken("invalid-token")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/google",
                request,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Google auth with empty token - should return 400")
    void testGoogleAuth_EmptyToken() {
        GoogleAuthRequest request = GoogleAuthRequest.builder()
                .idToken("")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/google",
                request,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Google auth with missing name fields - should use defaults")
    void testGoogleAuth_MissingNameFields() {
        // Mock Google user with null name fields
        GoogleAuthService.GoogleUserInfo googleUser = GoogleAuthService.GoogleUserInfo.builder()
                .email("noname@gmail.com")
                .firstName(null)
                .lastName(null)
                .providerId("google-id-noname")
                .build();
        when(googleAuthService.verifyToken(anyString())).thenReturn(googleUser);

        GoogleAuthRequest request = GoogleAuthRequest.builder()
                .idToken("token")
                .build();

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                BASE_URL + "/google",
                request,
                AuthResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getFirstName()).isEqualTo("User"); // Default
        assertThat(response.getBody().getLastName()).isEqualTo(""); // Default
    }
}
