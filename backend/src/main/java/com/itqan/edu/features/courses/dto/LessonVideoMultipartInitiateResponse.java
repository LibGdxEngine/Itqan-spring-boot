package com.itqan.edu.features.courses.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonVideoMultipartInitiateResponse {
    private String uploadId;
    private String objectKey;
    private Long fileSizeBytes;
    private Long partSizeBytes;
    private Integer partCount;
    private LocalDateTime expiresAt;
    private List<PartUploadUrl> partUrls;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartUploadUrl {
        private Integer partNumber;
        private String url;
    }
}
