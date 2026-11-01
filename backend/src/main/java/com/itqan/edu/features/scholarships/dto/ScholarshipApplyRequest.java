package com.itqan.edu.features.scholarships.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ScholarshipApplyRequest {
    @NotNull
    private Long courseId;

    @NotBlank
    @Size(min = 20, max = 3000)
    private String reason;

    @Size(max = 3000)
    private String circumstances;

    @Size(max = 40)
    private String phone;
}
