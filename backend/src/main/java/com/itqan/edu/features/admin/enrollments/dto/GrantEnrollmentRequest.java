package com.itqan.edu.features.admin.enrollments.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GrantEnrollmentRequest {
    @NotBlank
    @Email
    private String studentEmail;

    @NotNull
    private Long courseId;
}
