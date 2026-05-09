package com.itqan.edu.features.courses.dto;

import com.itqan.edu.features.courses.LessonType;
import com.itqan.edu.features.courses.LessonVideoStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonResponse {
    private Long id;
    private String title;
    private String description;
    private LessonType type;
    private String videoUrl;
    private String videoObjectKey;
    private String videoMimeType;
    private Long videoSizeBytes;
    private LessonVideoStatus videoStatus;
    private LocalDateTime videoUploadedAt;
    private String content;
    private String resourceUrl;
    private Integer duration;
    private Integer orderIndex;
    private Boolean isFree;
    private Boolean active;
    private Long moduleId;
    private Long quizId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
