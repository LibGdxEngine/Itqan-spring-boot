package com.itqan.edu.features.auth;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpirationMs;

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshToken verifyAndRotate(String token) {
        RefreshToken existing = refreshTokenRepository.findByTokenAndRevokedFalse(token)
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID));

        if (existing.isExpired()) {
            existing.setRevoked(true);
            refreshTokenRepository.save(existing);
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        // Rotate: revoke old token and create new one
        existing.setRevoked(true);
        refreshTokenRepository.save(existing);

        return createRefreshToken(existing.getUser());
    }

    @Transactional
    public void revokeAllUserTokens(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    @Scheduled(cron = "0 0 3 * * *") // Daily at 3 AM
    @Transactional
    public void purgeExpiredTokens() {
        refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.debug("Purged expired refresh tokens");
    }
}
