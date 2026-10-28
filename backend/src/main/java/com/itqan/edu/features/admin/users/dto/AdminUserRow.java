package com.itqan.edu.features.admin.users.dto;

import com.itqan.edu.features.auth.User;

import java.time.LocalDateTime;

public record AdminUserRow(
        Long id,
        String email,
        String firstName,
        String lastName,
        User.Role role,
        boolean enabled,
        boolean superAdmin,
        User.AuthProvider authProvider,
        LocalDateTime createdAt,
        LocalDateTime lastLoginAt) {

    public static AdminUserRow from(User user) {
        return new AdminUserRow(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.isEnabled(),
                Boolean.TRUE.equals(user.getSuperAdmin()),
                user.getAuthProvider(),
                user.getCreatedAt(),
                user.getLastLoginAt());
    }
}
