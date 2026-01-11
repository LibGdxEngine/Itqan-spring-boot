package com.itqan.edu.features.auth;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.common.security.JwtTokenProvider;
import com.itqan.edu.common.service.EmailService;
import com.itqan.edu.features.auth.dto.*;
import com.itqan.edu.features.auth.mapper.AuthMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthRepository authRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final AuthMapper authMapper;
    private final EmailService emailService;
    private final GoogleAuthService googleAuthService;

    @Value("${otp.expiry-minutes:15}")
    private int otpExpiryMinutes;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (authRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = authMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.STUDENT);
        user = authRepository.save(user);

        String token = jwtTokenProvider.generateToken(user);
        AuthResponse response = authMapper.toResponse(user);
        response.setToken(token);

        return response;
    }

    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            User user = (User) authentication.getPrincipal();
            String token = jwtTokenProvider.generateToken(user);
            AuthResponse response = authMapper.toResponse(user);
            response.setToken(token);

            return response;
        } catch (BadCredentialsException e) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    @Transactional
    public AuthResponse authenticateWithGoogle(GoogleAuthRequest request) {
        GoogleAuthService.GoogleUserInfo googleUser = googleAuthService.verifyToken(request.getIdToken());
        String email = googleUser.getEmail().toLowerCase();

        User user = authRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // Create new user from Google account
            user = User.builder()
                    .email(email)
                    .firstName(googleUser.getFirstName() != null ? googleUser.getFirstName() : "User")
                    .lastName(googleUser.getLastName() != null ? googleUser.getLastName() : "")
                    .authProvider(User.AuthProvider.GOOGLE)
                    .providerId(googleUser.getProviderId())
                    .role(User.Role.STUDENT)
                    .enabled(true)
                    .build();
            user = authRepository.save(user);
            log.info("New user created from Google auth: {}", email);
        } else if (user.getAuthProvider() == User.AuthProvider.LOCAL) {
            // Link Google account to existing local account
            user.setAuthProvider(User.AuthProvider.GOOGLE);
            user.setProviderId(googleUser.getProviderId());
            user = authRepository.save(user);
            log.info("Linked Google account to existing user: {}", email);
        }

        String token = jwtTokenProvider.generateToken(user);
        AuthResponse response = authMapper.toResponse(user);
        response.setToken(token);

        return response;
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase();
        
        // Always return success to prevent email enumeration attacks
        if (!authRepository.existsByEmail(email)) {
            log.info("Password reset requested for non-existent email: {}", email);
            return;
        }

        // Delete any existing tokens for this email
        passwordResetRepository.deleteByEmail(email);

        // Generate 6-digit OTP
        String otp = generateOtp();
        
        // Store hashed OTP
        PasswordResetToken token = PasswordResetToken.builder()
                .email(email)
                .otpHash(passwordEncoder.encode(otp))
                .expiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .build();
        passwordResetRepository.save(token);

        // Send email
        emailService.sendOtpEmail(email, otp);
        log.info("Password reset OTP sent to: {}", email);
    }

    public boolean verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail().toLowerCase();
        
        PasswordResetToken token = passwordResetRepository.findByEmailAndUsedFalse(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.OTP_INVALID));

        if (token.isExpired()) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }

        if (!passwordEncoder.matches(request.getOtp(), token.getOtpHash())) {
            throw new BusinessException(ErrorCode.OTP_INVALID);
        }

        return true;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().toLowerCase();
        
        PasswordResetToken token = passwordResetRepository.findByEmailAndUsedFalse(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.OTP_INVALID));

        if (token.isExpired()) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }

        if (!passwordEncoder.matches(request.getOtp(), token.getOtpHash())) {
            throw new BusinessException(ErrorCode.OTP_INVALID);
        }

        // Mark token as used
        token.setUsed(true);
        passwordResetRepository.save(token);

        // Update password
        User user = authRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        authRepository.save(user);

        log.info("Password reset successful for: {}", email);
    }

    private String generateOtp() {
        int otp = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(otp);
    }
}
