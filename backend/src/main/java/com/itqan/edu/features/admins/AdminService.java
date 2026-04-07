package com.itqan.edu.features.admins;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.admins.dto.AdminCreateRequest;
import com.itqan.edu.features.admins.dto.AdminResponse;
import com.itqan.edu.features.admins.dto.AdminUpdateRequest;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;

    public List<AdminResponse> getAllAdmins() {
        return authRepository.findByRole(User.Role.ADMIN).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminResponse createAdmin(AdminCreateRequest request, User currentUser) {
        ensureSuperAdmin(currentUser);

        String normalizedEmail = normalizeEmail(request.getEmail());
        if (authRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User admin = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .authProvider(User.AuthProvider.LOCAL)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .role(User.Role.ADMIN)
                .superAdmin(Boolean.TRUE.equals(request.getSuperAdmin()))
                .enabled(!Boolean.FALSE.equals(request.getEnabled()))
                .build();

        admin = authRepository.save(admin);
        return toResponse(admin);
    }

    @Transactional
    public AdminResponse updateAdmin(Long adminId, AdminUpdateRequest request, User currentUser) {
        ensureSuperAdmin(currentUser);

        User admin = authRepository.findByIdAndRole(adminId, User.Role.ADMIN)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String normalizedEmail = normalizeEmail(request.getEmail());
        if (!admin.getEmail().equals(normalizedEmail) && authRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        boolean nextSuperAdmin = request.getSuperAdmin() == null
                ? Boolean.TRUE.equals(admin.getSuperAdmin())
                : request.getSuperAdmin();
        boolean nextEnabled = request.getEnabled() == null
                ? Boolean.TRUE.equals(admin.getEnabled())
                : request.getEnabled();

        enforceSuperAdminConstraints(admin, currentUser, nextSuperAdmin, nextEnabled);

        admin.setEmail(normalizedEmail);
        admin.setFirstName(request.getFirstName().trim());
        admin.setLastName(request.getLastName().trim());
        admin.setSuperAdmin(nextSuperAdmin);
        admin.setEnabled(nextEnabled);

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            admin.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        admin = authRepository.save(admin);
        return toResponse(admin);
    }

    private void ensureSuperAdmin(User currentUser) {
        if (currentUser.getRole() != User.Role.ADMIN || !Boolean.TRUE.equals(currentUser.getSuperAdmin())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private void enforceSuperAdminConstraints(User targetAdmin, User currentUser, boolean nextSuperAdmin, boolean nextEnabled) {
        boolean currentlySuperAdmin = Boolean.TRUE.equals(targetAdmin.getSuperAdmin());
        boolean removingSuperAdminFlag = currentlySuperAdmin && !nextSuperAdmin;
        boolean disablingSuperAdmin = currentlySuperAdmin && !nextEnabled;
        boolean affectsSuperAdminAvailability = removingSuperAdminFlag || disablingSuperAdmin;

        if (affectsSuperAdminAvailability && authRepository.countBySuperAdminTrueAndEnabledTrue() <= 1) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "At least one enabled super admin must remain");
        }

        boolean editingSelf = currentUser.getId() != null && currentUser.getId().equals(targetAdmin.getId());
        if (editingSelf && (!nextSuperAdmin || !nextEnabled)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "You cannot remove your own super admin access");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private AdminResponse toResponse(User user) {
        return AdminResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .enabled(user.getEnabled())
                .superAdmin(user.getSuperAdmin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
