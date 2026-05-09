package com.itqan.edu.features.landingpage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandingHeroDto {
    private String videoUrl;
    private String titleAr;
    private String titleEn;
    private String teacherNameAr;
    private String teacherNameEn;
    private String durationLabelAr;
    private String durationLabelEn;
}
