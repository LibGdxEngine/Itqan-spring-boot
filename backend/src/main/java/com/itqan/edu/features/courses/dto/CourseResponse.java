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
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private String instructor;
    private Double price;
    private Integer duration;
    private String level;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
