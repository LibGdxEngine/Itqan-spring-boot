package com.itqan.edu.features.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthService {

    @Value("${google.client-id:}")
    private String clientId;

    private GoogleIdTokenVerifier verifier;

    @PostConstruct
    public void init() {
        if (clientId != null && !clientId.isBlank()) {
            verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(clientId))
                    .build();
        }
    }

    public GoogleUserInfo verifyToken(String idToken) {
        if (verifier == null) {
            throw new BusinessException(ErrorCode.GOOGLE_AUTH_FAILED);
        }

        try {
            GoogleIdToken googleIdToken = verifier.verify(idToken);
            
            if (googleIdToken == null) {
                log.error("Invalid Google ID token");
                throw new BusinessException(ErrorCode.GOOGLE_AUTH_FAILED);
            }

            GoogleIdToken.Payload payload = googleIdToken.getPayload();

            // Verify email is verified
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                log.error("Google email not verified");
                throw new BusinessException(ErrorCode.OAUTH_EMAIL_NOT_VERIFIED);
            }

            return GoogleUserInfo.builder()
                    .email(payload.getEmail())
                    .firstName((String) payload.get("given_name"))
                    .lastName((String) payload.get("family_name"))
                    .providerId(payload.getSubject())
                    .build();

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error verifying Google ID token", e);
            throw new BusinessException(ErrorCode.GOOGLE_AUTH_FAILED);
        }
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GoogleUserInfo {
        private String email;
        private String firstName;
        private String lastName;
        private String providerId;
    }
}
