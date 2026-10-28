package com.itqan.edu.features.admin.enrollments.dto;

import com.itqan.edu.features.enrollments.Enrollment;
import com.itqan.edu.features.enrollments.EnrollmentStatus;

import java.time.LocalDateTime;

public record AdminEnrollmentRow(
        Long id,
        Long studentId,
        String studentName,
        String studentEmail,
        Long courseId,
        String courseTitle,
        EnrollmentStatus status,
        Integer progress,
        LocalDateTime enrolledAt,
        LocalDateTime lastAccessedAt) {

    public static AdminEnrollmentRow from(Enrollment e) {
        return new AdminEnrollmentRow(
                e.getId(),
                e.getStudent().getId(),
                (e.getStudent().getFirstName() + " " + e.getStudent().getLastName()).trim(),
                e.getStudent().getEmail(),
                e.getCourse().getId(),
                e.getCourse().getTitle(),
                e.getStatus(),
                e.getProgress(),
                e.getEnrolledAt(),
                e.getLastAccessedAt());
    }
}
