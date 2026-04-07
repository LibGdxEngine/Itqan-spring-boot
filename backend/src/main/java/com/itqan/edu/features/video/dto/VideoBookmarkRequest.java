package com.itqan.edu.features.video.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoBookmarkRequest {

    @NotNull(message = "Timestamp is required")
    @PositiveOrZero(message = "Timestamp must be positive or zero")
    private Double timestamp;

    @Size(max = 1000, message = "Note must not exceed 1000 characters")
    private String note;
}
