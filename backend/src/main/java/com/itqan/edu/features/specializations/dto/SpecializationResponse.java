package com.itqan.edu.features.specializations.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecializationResponse {
    private Long id;
    private String nameAr;
    private String nameEn;
    private String slug;
    private String icon;
    private Integer displayOrder;
    private Boolean active;
}
