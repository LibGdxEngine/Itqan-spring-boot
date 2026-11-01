package com.itqan.edu.features.landingpage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Admin-editable heading of the landing page teachers ("sheikhs and scholars") section. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandingTeachersSectionDto {
    private String titleAr;
    private String titleEn;
    private String subtitleAr;
    private String subtitleEn;
}
