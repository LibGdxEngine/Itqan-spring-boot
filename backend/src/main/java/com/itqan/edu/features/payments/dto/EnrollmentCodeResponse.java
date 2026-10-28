package com.itqan.edu.features.payments.dto;

import com.itqan.edu.features.payments.EnrollmentCode;

import java.time.LocalDateTime;

public record EnrollmentCodeResponse(
        Long id,
        String code,
        Long courseId,
        String courseTitle,
        Integer usageLimit,
        Integer usedCount,
        LocalDateTime expiresAt,
        boolean active,
        boolean usable,
        LocalDateTime createdAt) {

    public static EnrollmentCodeResponse from(EnrollmentCode c) {
        return new EnrollmentCodeResponse(
                c.getId(),
                c.getCode(),
                c.getCourse().getId(),
                c.getCourse().getTitle(),
                c.getUsageLimit(),
                c.getUsedCount(),
                c.getExpiresAt(),
                Boolean.TRUE.equals(c.getIsActive()),
                c.isValid(),
                c.getCreatedAt());
    }
}
