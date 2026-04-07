package com.itqan.edu.features.courses.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LessonVideoMultipartAbortRequest {

    @NotBlank(message = "Upload ID is required")
    private String uploadId;

    @NotBlank(message = "Object key is required")
    private String objectKey;
}
