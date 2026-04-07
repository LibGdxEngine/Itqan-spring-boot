package com.itqan.edu.features.courses.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class LessonVideoMultipartCompleteRequest {

    @NotBlank(message = "Upload ID is required")
    private String uploadId;

    @NotBlank(message = "Object key is required")
    private String objectKey;

    @NotEmpty(message = "Parts are required")
    @Valid
    private List<UploadedPart> parts;

    @Data
    public static class UploadedPart {
        private Integer partNumber;
        private String etag;
    }
}
