package com.itqan.edu.features.admins;

import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class SuperAdminInitializer {

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.super-admin.email:superadmin@itqan.edu}")
    private String superAdminEmail;

    @Value("${app.super-admin.password:Admin@123456}")
    private String superAdminPassword;

    @Value("${app.super-admin.first-name:Super}")
    private String superAdminFirstName;

    @Value("${app.super-admin.last-name:Admin}")
    private String superAdminLastName;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void ensureSuperAdminExists() {
        if (authRepository.existsBySuperAdminTrueAndEnabledTrue()) {
            return;
        }

        String normalizedEmail = superAdminEmail.trim().toLowerCase();

        User superAdmin = authRepository.findByEmail(normalizedEmail)
                .map(existingUser -> {
                    existingUser.setRole(User.Role.ADMIN);
                    existingUser.setSuperAdmin(true);
                    existingUser.setEnabled(true);
                    existingUser.setFirstName(superAdminFirstName.trim());
                    existingUser.setLastName(superAdminLastName.trim());
                    if (existingUser.getPassword() == null || existingUser.getPassword().isBlank()) {
                        existingUser.setAuthProvider(User.AuthProvider.LOCAL);
                        existingUser.setPassword(passwordEncoder.encode(superAdminPassword));
                    }
                    return existingUser;
                })
                .orElseGet(() -> User.builder()
                        .email(normalizedEmail)
                        .password(passwordEncoder.encode(superAdminPassword))
                        .authProvider(User.AuthProvider.LOCAL)
                        .firstName(superAdminFirstName.trim())
                        .lastName(superAdminLastName.trim())
                        .role(User.Role.ADMIN)
                        .superAdmin(true)
                        .enabled(true)
                        .build());

        authRepository.save(superAdmin);
        log.info("Ensured default super admin account exists for email {}", normalizedEmail);
    }
}
