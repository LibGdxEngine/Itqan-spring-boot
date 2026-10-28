package com.itqan.edu.features.courses.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private String instructor;
    private Long ownerUserId;
    private Double price;
    private Integer duration;
    private String level;
    private String category;
    private String thumbnailUrl;
    private String previewVideoUrl;
    private java.util.List<String> learningOutcomes;
    private java.util.List<String> requirements;
    private java.util.List<String> tags;
    private Boolean active;
    private java.util.List<ModuleResponse> modules;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
