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
    private long coursesCount;
    private long studentsCount;
}
