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
public class ModuleResponse {
    private Long id;
    private String title;
    private String description;
    private Integer orderIndex;
    private Boolean active;
    private Long courseId;
    private List<LessonResponse> lessons;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
