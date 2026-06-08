package com.itqan.edu.features.clips.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClipUpdateRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 2000)
    private String description;
}
