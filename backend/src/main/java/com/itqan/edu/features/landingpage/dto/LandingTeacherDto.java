package com.itqan.edu.features.landingpage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandingTeacherDto {
    private Long id;
    private String name;
    private String specialty;
    private String photoUrl;
    private String titleAr;
    private String titleEn;
    private String bioAr;
    private String bioEn;
    private long coursesCount;
    private long studentsCount;
}
