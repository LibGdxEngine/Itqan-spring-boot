package com.itqan.edu.features.landingpage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandingCourseDto {
    private Long id;
    private String title;
    private String instructor;
    private String category;
    private Integer durationHours;
    private Double price;
    private String thumbnailUrl;
    private String level;
}
