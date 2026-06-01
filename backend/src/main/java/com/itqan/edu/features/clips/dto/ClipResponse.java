package com.itqan.edu.features.clips.dto;

import com.itqan.edu.features.clips.ClipType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ClipResponse {
    private Long id;
    private String title;
    private ClipType type;
    private String fileUrl;
    private String mimeType;
    private Long sizeBytes;
    private LocalDateTime createdAt;
}
