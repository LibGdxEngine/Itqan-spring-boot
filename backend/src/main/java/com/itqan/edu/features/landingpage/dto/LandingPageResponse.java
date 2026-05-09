package com.itqan.edu.features.landingpage.dto;

import com.itqan.edu.features.specializations.dto.SpecializationResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandingPageResponse {
    private LandingHeroDto hero;
    private LandingStatsDto stats;
    private List<SpecializationResponse> specializations;
    private List<LandingCourseDto> featuredCourses;
    private List<LandingTeacherDto> featuredInstructors;
}
