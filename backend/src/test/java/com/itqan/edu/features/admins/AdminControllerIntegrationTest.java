package com.itqan.edu.features.admins;

import com.itqan.edu.common.security.JwtTokenProvider;
import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AdminControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthRepository authRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        authRepository.deleteAll();
    }

    @Test
    @DisplayName("Super admin can create a new admin")
    void superAdminCanCreateAdmin() {
        User superAdmin = createAdmin("super@test.com", true, true);
        String token = jwtTokenProvider.generateToken(superAdmin);

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/admins",
                HttpMethod.POST,
                authEntity(Map.of(
                        "email", "new-admin@test.com",
                        "password", "Admin@12345",
                        "firstName", "New",
                        "lastName", "Admin",
                        "enabled", true,
                        "superAdmin", false
                ), token),
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("email")).isEqualTo("new-admin@test.com");
        assertThat(authRepository.findByEmail("new-admin@test.com")).isPresent();
    }

    @Test
    @DisplayName("Regular admin cannot create a new admin")
    void regularAdminCannotCreateAdmin() {
        User regularAdmin = createAdmin("admin@test.com", false, true);
        String token = jwtTokenProvider.generateToken(regularAdmin);

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/admins",
                HttpMethod.POST,
                authEntity(Map.of(
                        "email", "blocked-admin@test.com",
                        "password", "Admin@12345",
                        "firstName", "Blocked",
                        "lastName", "Admin"
                ), token),
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(authRepository.findByEmail("blocked-admin@test.com")).isNotPresent();
    }

    @Test
    @DisplayName("Super admin can edit existing admin")
    void superAdminCanEditAdmin() {
        User superAdmin = createAdmin("super@test.com", true, true);
        User targetAdmin = createAdmin("target@test.com", false, true);
        String token = jwtTokenProvider.generateToken(superAdmin);

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/admins/" + targetAdmin.getId(),
                HttpMethod.PUT,
                authEntity(Map.of(
                        "email", "updated-target@test.com",
                        "firstName", "Updated",
                        "lastName", "Admin",
                        "enabled", false,
                        "superAdmin", true
                ), token),
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        User updatedAdmin = authRepository.findById(targetAdmin.getId()).orElseThrow();
        assertThat(updatedAdmin.getEmail()).isEqualTo("updated-target@test.com");
        assertThat(updatedAdmin.getFirstName()).isEqualTo("Updated");
        assertThat(updatedAdmin.getEnabled()).isFalse();
        assertThat(updatedAdmin.getSuperAdmin()).isTrue();
    }

    @Test
    @DisplayName("Last super admin cannot remove own super-admin access")
    void lastSuperAdminCannotDemoteSelf() {
        User superAdmin = createAdmin("only-super@test.com", true, true);
        String token = jwtTokenProvider.generateToken(superAdmin);

        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/admins/" + superAdmin.getId(),
                HttpMethod.PUT,
                authEntity(Map.of(
                        "email", "only-super@test.com",
                        "firstName", "Only",
                        "lastName", "Super",
                        "enabled", true,
                        "superAdmin", false
                ), token),
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("code")).isEqualTo("VAL_001");
    }

    private HttpEntity<Map<String, Object>> authEntity(Map<String, Object> body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return new HttpEntity<>(body, headers);
    }

    private User createAdmin(String email, boolean superAdmin, boolean enabled) {
        return authRepository.save(User.builder()
                .email(email)
                .password("password")
                .firstName("First")
                .lastName("Last")
                .role(User.Role.ADMIN)
                .superAdmin(superAdmin)
                .enabled(enabled)
                .authProvider(User.AuthProvider.LOCAL)
                .build());
    }
}
