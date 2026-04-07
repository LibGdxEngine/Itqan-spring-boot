package com.itqan.edu.features.video.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoBookmarkResponse {

    private Long id;
    private Long studentId;
    private Long lessonId;
    private Double timestamp;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
