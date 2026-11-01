package com.itqan.edu.features.scholarships.dto;

import com.itqan.edu.features.scholarships.FundingSource;
import com.itqan.edu.features.scholarships.ScholarshipApplication;
import com.itqan.edu.features.scholarships.ScholarshipStatus;

import java.time.LocalDateTime;

public record AdminScholarshipRow(
        Long id,
        Long studentId,
        String studentName,
        String studentEmail,
        String phone,
        Long courseId,
        String courseTitle,
        Double coursePrice,
        String reason,
        String circumstances,
        ScholarshipStatus status,
        FundingSource fundingSource,
        Double fundAmount,
        String adminNote,
        LocalDateTime createdAt,
        LocalDateTime decidedAt) {

    public static AdminScholarshipRow from(ScholarshipApplication a) {
        var s = a.getStudent();
        var c = a.getCourse();
        return new AdminScholarshipRow(a.getId(), s.getId(),
                ((s.getFirstName() == null ? "" : s.getFirstName()) + " " + (s.getLastName() == null ? "" : s.getLastName())).trim(),
                s.getEmail(), a.getPhone() != null ? a.getPhone() : s.getPhoneNumber(),
                c.getId(), c.getTitle(), c.getPrice(), a.getReason(), a.getCircumstances(), a.getStatus(),
                a.getFundingSource(), a.getFundAmount(), a.getAdminNote(), a.getCreatedAt(), a.getDecidedAt());
    }
}
