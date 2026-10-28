package com.itqan.edu.features.payments.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GenerateEnrollmentCodesRequest {
    @NotNull
    private Long courseId;

    @NotNull
    @Min(1)
    @Max(500)
    private Integer quantity;

    /** Redemptions allowed per code; -1 = unlimited. */
    @Min(-1)
    private Integer usageLimit = 1;

    private LocalDateTime expiresAt;
}
