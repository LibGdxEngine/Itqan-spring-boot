package com.itqan.edu.features.courses.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonVideoPlaybackResponse {
    private String url;
    private LocalDateTime expiresAt;
}
