package com.itqan.edu.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class SecurityConfigValidator {

    private static final String DEFAULT_JWT_SECRET =
            "itqan-education-platform-secret-key-change-in-production-environment-minimum-256-bits";
    private static final int MIN_SECRET_LENGTH = 32;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    @Value("${jwt.expiration}")
    private long accessExpiration;

    @Value("${stripe.secret-key:sk_test_dummy}")
    private String stripeSecretKey;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    // Additional env vars for comprehensive validation
    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${google.client-id:}")
    private String googleClientId;

    @Value("${stripe.webhook-secret:whsec_dummy}")
    private String stripeWebhookSecret;

    @Value("${app.storage.s3.access-key:minioadmin}")
    private String s3AccessKey;

    @Value("${app.storage.s3.secret-key:minioadmin}")
    private String s3SecretKey;

    @Value("${meili.master-key:masterKey123}")
    private String meiliMasterKey;

    @Value("${app.super-admin.password:Admin@123456}")
    private String superAdminPassword;

    @EventListener(ApplicationReadyEvent.class)
    public void validateSecurityConfig() {
        boolean isProduction = activeProfile.contains("prod");

        // JWT Secret validation
        if (DEFAULT_JWT_SECRET.equals(jwtSecret)) {
            String msg = "JWT secret is using the default value. Set JWT_SECRET to a strong, unique value.";
            if (isProduction) {
                throw new IllegalStateException("FATAL: " + msg);
            }
            log.warn("WARNING: {}", msg);
        }

        if (jwtSecret.length() < MIN_SECRET_LENGTH) {
            String msg = "JWT secret must be at least " + MIN_SECRET_LENGTH + " characters (current: " + jwtSecret.length() + ")";
            if (isProduction) {
                throw new IllegalStateException("FATAL: " + msg);
            }
            log.warn("WARNING: {}", msg);
        }

        // Stripe key validation
        if (isProduction && (stripeSecretKey.equals("sk_test_dummy") || stripeSecretKey.startsWith("sk_test_"))) {
            log.warn("WARNING: Stripe is using a test key in production mode");
        }

        // Token expiry sanity check
        if (accessExpiration > 3600000) { // > 1 hour
            log.warn("WARNING: Access token expiration ({} ms) is longer than recommended (1 hour). Consider using shorter tokens with refresh.", accessExpiration);
        }

        if (refreshExpiration > 2592000000L) { // > 30 days
            log.warn("WARNING: Refresh token expiration ({} ms) exceeds 30 days", refreshExpiration);
        }

        validateRequiredEnvVars(isProduction);

        log.info("Security configuration validated successfully");
    }

    private void validateRequiredEnvVars(boolean isProduction) {
        // Mail credentials
        if (mailUsername == null || mailUsername.isBlank()) {
            String msg = "MAIL_USERNAME (spring.mail.username) is not configured. Email features will not work.";
            if (isProduction) {
                throw new IllegalStateException("FATAL: " + msg);
            }
            log.warn("WARNING: {}", msg);
        }
        if (mailPassword == null || mailPassword.isBlank()) {
            String msg = "MAIL_PASSWORD (spring.mail.password) is not configured. Email features will not work.";
            if (isProduction) {
                throw new IllegalStateException("FATAL: " + msg);
            }
            log.warn("WARNING: {}", msg);
        }

        // Google OAuth
        if (googleClientId == null || googleClientId.isBlank()) {
            String msg = "GOOGLE_CLIENT_ID (google.client-id) is not configured. Google OAuth will not work.";
            if (isProduction) {
                throw new IllegalStateException("FATAL: " + msg);
            }
            log.warn("WARNING: {}", msg);
        }

        // Stripe webhook secret
        if ("whsec_dummy".equals(stripeWebhookSecret)) {
            String msg = "STRIPE_WEBHOOK_SECRET (stripe.webhook-secret) is using the dummy default value. Stripe webhooks will not be verified.";
            if (isProduction) {
                throw new IllegalStateException("FATAL: " + msg);
            }
            log.warn("WARNING: {}", msg);
        }

        // Well-known default credentials must never reach production.
        if ("minioadmin".equals(s3AccessKey) || "minioadmin".equals(s3SecretKey)) {
            failInProduction(isProduction,
                    "APP_STORAGE_S3_ACCESS_KEY / APP_STORAGE_S3_SECRET_KEY use the default 'minioadmin' value.");
        }
        if ("masterKey123".equals(meiliMasterKey)) {
            failInProduction(isProduction, "MEILI_MASTER_KEY uses the default 'masterKey123' value.");
        }
        if ("Admin@123456".equals(superAdminPassword)) {
            failInProduction(isProduction, "APP_SUPER_ADMIN_PASSWORD uses the default 'Admin@123456' value.");
        }
    }

    private void failInProduction(boolean isProduction, String msg) {
        if (isProduction) {
            throw new IllegalStateException("FATAL: " + msg);
        }
        log.warn("WARNING: {}", msg);
    }
}
