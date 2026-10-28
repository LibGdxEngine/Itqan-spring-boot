package com.itqan.edu.features.auth;

import com.itqan.edu.common.service.EmailService;
import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.auth.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class PasswordResetIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthRepository authRepository;

    @Autowired
    private PasswordResetRepository passwordResetRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private EmailService emailService;

    private static final String BASE_URL = "/api/auth";
    private String capturedOtp;

    @BeforeEach
    void setUp() {
        passwordResetRepository.deleteAll();
        authRepository.deleteAll();
        capturedOtp = null;

        // Capture OTP when email is sent
        doAnswer(invocation -> {
            capturedOtp = invocation.getArgument(1);
            return null;
        }).when(emailService).sendOtpEmail(anyString(), anyString());
    }

    private void registerUser(String email) {
        RegisterRequest request = RegisterRequest.builder()
                .email(email)
                .password("oldpassword123")
                .firstName("Test")
                .lastName("User")
                .build();
        restTemplate.postForEntity(BASE_URL + "/register", request, AuthResponse.class);
    }

    @Test
    @DisplayName("Forgot password - should return 200 and send OTP")
    void testForgotPassword_Success() {
        registerUser("reset@test.com");

        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("reset@test.com")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/forgot-password",
                request,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("message");
        verify(emailService).sendOtpEmail(eq("reset@test.com"), anyString());
    }

    @Test
    @DisplayName("Forgot password for non-existent email - should return 200 (security)")
    void testForgotPassword_NonExistentEmail() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("nonexistent@test.com")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/forgot-password",
                request,
                Map.class
        );

        // Should return 200 to prevent email enumeration
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        // But no email should be sent
        verify(emailService, never()).sendOtpEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("Verify valid OTP - should return 200 with valid=true")
    void testVerifyOtp_Success() {
        registerUser("verify@test.com");

        // Request OTP
        ForgotPasswordRequest forgotRequest = ForgotPasswordRequest.builder()
                .email("verify@test.com")
                .build();
        restTemplate.postForEntity(BASE_URL + "/forgot-password", forgotRequest, Map.class);

        // Verify OTP
        VerifyOtpRequest verifyRequest = VerifyOtpRequest.builder()
                .email("verify@test.com")
                .otp(capturedOtp)
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/verify-otp",
                verifyRequest,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("valid", true);
    }

    @Test
    @DisplayName("Verify invalid OTP - should return 400")
    void testVerifyOtp_Invalid() {
        registerUser("invalid-otp@test.com");

        // Request OTP
        ForgotPasswordRequest forgotRequest = ForgotPasswordRequest.builder()
                .email("invalid-otp@test.com")
                .build();
        restTemplate.postForEntity(BASE_URL + "/forgot-password", forgotRequest, Map.class);

        // Verify with wrong OTP
        VerifyOtpRequest verifyRequest = VerifyOtpRequest.builder()
                .email("invalid-otp@test.com")
                .otp("000000")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/verify-otp",
                verifyRequest,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Verify expired OTP - should return 400")
    void testVerifyOtp_Expired() {
        registerUser("expired@test.com");

        // Create an expired token directly
        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .email("expired@test.com")
                .otpHash(passwordEncoder.encode("123456"))
                .expiresAt(LocalDateTime.now().minusMinutes(1)) // Already expired
                .build();
        passwordResetRepository.save(expiredToken);

        VerifyOtpRequest verifyRequest = VerifyOtpRequest.builder()
                .email("expired@test.com")
                .otp("123456")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/verify-otp",
                verifyRequest,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Reset password - should return 200 and update password")
    void testResetPassword_Success() {
        registerUser("reset-success@test.com");

        // Request OTP
        ForgotPasswordRequest forgotRequest = ForgotPasswordRequest.builder()
                .email("reset-success@test.com")
                .build();
        restTemplate.postForEntity(BASE_URL + "/forgot-password", forgotRequest, Map.class);

        // Reset password
        ResetPasswordRequest resetRequest = ResetPasswordRequest.builder()
                .email("reset-success@test.com")
                .otp(capturedOtp)
                .newPassword("newpassword123")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/reset-password",
                resetRequest,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Verify can login with new password
        LoginRequest loginRequest = LoginRequest.builder()
                .email("reset-success@test.com")
                .password("newpassword123")
                .build();

        ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(
                BASE_URL + "/login",
                loginRequest,
                AuthResponse.class
        );

        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody().getToken()).isNotBlank();
    }

    @Test
    @DisplayName("Reset password with invalid OTP - should return 400")
    void testResetPassword_InvalidOtp() {
        registerUser("reset-invalid@test.com");

        // Request OTP
        ForgotPasswordRequest forgotRequest = ForgotPasswordRequest.builder()
                .email("reset-invalid@test.com")
                .build();
        restTemplate.postForEntity(BASE_URL + "/forgot-password", forgotRequest, Map.class);

        // Try to reset with wrong OTP
        ResetPasswordRequest resetRequest = ResetPasswordRequest.builder()
                .email("reset-invalid@test.com")
                .otp("000000")
                .newPassword("newpassword123")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/reset-password",
                resetRequest,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Reset password with already used OTP - should return 400")
    void testResetPassword_AlreadyUsedOtp() {
        registerUser("used-otp@test.com");

        // Request OTP
        ForgotPasswordRequest forgotRequest = ForgotPasswordRequest.builder()
                .email("used-otp@test.com")
                .build();
        restTemplate.postForEntity(BASE_URL + "/forgot-password", forgotRequest, Map.class);

        // First reset
        ResetPasswordRequest resetRequest = ResetPasswordRequest.builder()
                .email("used-otp@test.com")
                .otp(capturedOtp)
                .newPassword("newpassword123")
                .build();
        restTemplate.postForEntity(BASE_URL + "/reset-password", resetRequest, Map.class);

        // Try to use the same OTP again
        ResetPasswordRequest secondResetRequest = ResetPasswordRequest.builder()
                .email("used-otp@test.com")
                .otp(capturedOtp)
                .newPassword("anotherpassword123")
                .build();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                BASE_URL + "/reset-password",
                secondResetRequest,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("OTP is burned after 5 wrong guesses - even the correct code then fails")
    void testVerifyOtp_BurnedAfterTooManyWrongAttempts() {
        registerUser("bruteforce@test.com");
        restTemplate.postForEntity(BASE_URL + "/forgot-password",
                ForgotPasswordRequest.builder().email("bruteforce@test.com").build(), Map.class);
        String wrongOtp = "000000".equals(capturedOtp) ? "111111" : "000000";

        for (int i = 0; i < 5; i++) {
            ResponseEntity<Map> wrong = restTemplate.postForEntity(BASE_URL + "/verify-otp",
                    VerifyOtpRequest.builder().email("bruteforce@test.com").otp(wrongOtp).build(), Map.class);
            assertThat(wrong.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        }

        ResponseEntity<Map> response = restTemplate.postForEntity(BASE_URL + "/reset-password",
                ResetPasswordRequest.builder()
                        .email("bruteforce@test.com")
                        .otp(capturedOtp)
                        .newPassword("newpassword123")
                        .build(),
                Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
