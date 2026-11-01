package com.itqan.edu.features.instructors.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private Boolean enabled;
    private String photoUrl;
    private String titleAr;
    private String titleEn;
    private String bioAr;
    private String bioEn;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
