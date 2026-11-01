package com.itqan.edu.features.scholarships.dto;

import com.itqan.edu.features.scholarships.ScholarshipApplication;
import com.itqan.edu.features.scholarships.ScholarshipStatus;

import java.time.LocalDateTime;

/** What a student sees about their own request. Funding details stay internal. */
public record MyScholarshipApplication(
        Long id,
        Long courseId,
        String courseTitle,
        ScholarshipStatus status,
        String adminNote,
        LocalDateTime createdAt,
        LocalDateTime decidedAt) {

    public static MyScholarshipApplication from(ScholarshipApplication a) {
        return new MyScholarshipApplication(a.getId(), a.getCourse().getId(), a.getCourse().getTitle(),
                a.getStatus(), a.getAdminNote(), a.getCreatedAt(), a.getDecidedAt());
    }
}
