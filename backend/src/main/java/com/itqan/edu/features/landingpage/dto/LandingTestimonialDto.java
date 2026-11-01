package com.itqan.edu.features.landingpage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandingTestimonialDto {
    private Long id;
    private String authorName;
    private int rating;
    private String comment;
    private Long courseId;
    private String courseTitle;
    private LocalDateTime createdAt;
}
