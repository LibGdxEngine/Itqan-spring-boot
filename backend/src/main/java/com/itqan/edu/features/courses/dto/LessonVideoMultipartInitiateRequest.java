package com.itqan.edu.features.courses.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LessonVideoMultipartInitiateRequest {

    @NotBlank(message = "Filename is required")
    private String filename;

    @NotBlank(message = "MIME type is required")
    private String mimeType;

    @NotNull(message = "File size is required")
    @Min(value = 1, message = "File size must be positive")
    private Long fileSizeBytes;
}
