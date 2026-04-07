package com.itqan.edu.features.enrollments.dto;

import com.itqan.edu.features.courses.dto.CourseResponse;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentResponse {
    private Long id;
    private Long studentId;
    private Long courseId;
    private CourseResponse course;
    private EnrollmentStatus status;
    private Integer progress;
    private LocalDateTime enrolledAt;
    private LocalDateTime completedAt;
    private LocalDateTime lastAccessedAt;
}
