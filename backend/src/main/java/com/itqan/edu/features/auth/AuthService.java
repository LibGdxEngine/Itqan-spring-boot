package com.itqan.edu.features.auth;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.common.security.JwtTokenProvider;
import com.itqan.edu.common.service.EmailService;
import com.itqan.edu.features.auth.dto.*;
import com.itqan.edu.features.auth.mapper.AuthMapper;
import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
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
    private final StudentRepository studentRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final AuthMapper authMapper;
    private final EmailService emailService;
    private final GoogleAuthService googleAuthService;
    private final RefreshTokenService refreshTokenService;

    @Value("${otp.expiry-minutes:15}")
    private int otpExpiryMinutes;

    @Value("${security.account-lockout.max-attempts:5}")
    private int maxFailedAttempts;

    @Value("${security.account-lockout.duration-minutes:15}")
    private int lockoutDurationMinutes;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (authRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = authMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.STUDENT);
        user.setSuperAdmin(false);
        user = authRepository.save(user);

        // Create corresponding student profile
        Student student = Student.builder()
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .active(true)
                .build();
        studentRepository.save(student);

        String token = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        AuthResponse response = authMapper.toResponse(user);
        response.setToken(token);
        response.setRefreshToken(refreshToken.getToken());

        return response;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Check lockout before attempting authentication
        User user = authRepository.findByEmail(request.getEmail()).orElse(null);
        if (user != null) {
            checkAccountLockout(user);
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()));

            user = (User) authentication.getPrincipal();

            // Reset failed attempts on successful login
            if (user.getFailedLoginAttempts() > 0) {
                user.setFailedLoginAttempts(0);
                user.setLockedUntil(null);
            }
            user.setLastLoginAt(LocalDateTime.now());
            authRepository.save(user);

            String token = jwtTokenProvider.generateToken(user);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

            AuthResponse response = authMapper.toResponse(user);
            response.setToken(token);
            response.setRefreshToken(refreshToken.getToken());

            return response;
        } catch (LockedException e) {
            throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
        } catch (BadCredentialsException e) {
            // Increment failed attempts
            if (user != null) {
                handleFailedLogin(user);
            }
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    @Transactional
    public AuthResponse refreshAccessToken(RefreshTokenRequest request) {
        RefreshToken rotated = refreshTokenService.verifyAndRotate(request.getRefreshToken());
        User user = rotated.getUser();

        String newAccessToken = jwtTokenProvider.generateToken(user);

        AuthResponse response = authMapper.toResponse(user);
        response.setToken(newAccessToken);
        response.setRefreshToken(rotated.getToken());
        return response;
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenService.revokeAllUserTokens(userId);
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
                    .superAdmin(false)
                    .enabled(true)
                    .build();
            user = authRepository.save(user);

            // Create corresponding student profile
            Student student = Student.builder()
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .active(true)
                    .build();
            studentRepository.save(student);

            log.info("New user created from Google auth: {}", email);
        } else if (user.getAuthProvider() == User.AuthProvider.LOCAL) {
            // Link Google account to existing local account
            user.setAuthProvider(User.AuthProvider.GOOGLE);
            user.setProviderId(googleUser.getProviderId());
            user = authRepository.save(user);
            log.info("Linked Google account to existing user: {}", email);
        }

        user.setLastLoginAt(LocalDateTime.now());
        user = authRepository.save(user);

        String token = jwtTokenProvider.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        AuthResponse response = authMapper.toResponse(user);
        response.setToken(token);
        response.setRefreshToken(refreshToken.getToken());

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
        // Reset lockout on password reset
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        authRepository.save(user);

        // Revoke all existing refresh tokens
        refreshTokenService.revokeAllUserTokens(user.getId());

        log.info("Password reset successful for: {}", email);
    }

    private void checkAccountLockout(User user) {
        if (user.getLockedUntil() != null && LocalDateTime.now().isBefore(user.getLockedUntil())) {
            throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
        }
        // Auto-unlock if lockout has expired
        if (user.getLockedUntil() != null && LocalDateTime.now().isAfter(user.getLockedUntil())) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            authRepository.save(user);
        }
    }

    private void handleFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);

        if (attempts >= maxFailedAttempts) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutDurationMinutes));
            log.warn("Account locked for user {} after {} failed attempts", user.getEmail(), attempts);
        }

        authRepository.save(user);
    }

    private String generateOtp() {
        int otp = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(otp);
    }
}
