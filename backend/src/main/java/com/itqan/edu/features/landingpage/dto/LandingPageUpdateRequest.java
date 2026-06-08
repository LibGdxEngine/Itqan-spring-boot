package com.itqan.edu.features.landingpage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandingPageUpdateRequest {
    private String heroVideoUrl;
    private String heroVideoTitleAr;
    private String heroVideoTitleEn;
    private String heroTeacherNameAr;
    private String heroTeacherNameEn;
    private String heroDurationLabelAr;
    private String heroDurationLabelEn;
    private List<Long> featuredCourseIds;
    private List<Long> featuredInstructorIds;
    private List<Long> featuredArticleIds;
}
