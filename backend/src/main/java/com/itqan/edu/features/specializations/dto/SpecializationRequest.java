package com.itqan.edu.features.specializations.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecializationRequest {
    @NotBlank
    @Size(max = 120)
    private String nameAr;

    @NotBlank
    @Size(max = 120)
    private String nameEn;

    @NotBlank
    @Size(max = 80)
    private String slug;

    @Size(max = 100)
    private String icon;

    private Integer displayOrder;

    private Boolean active;
}
