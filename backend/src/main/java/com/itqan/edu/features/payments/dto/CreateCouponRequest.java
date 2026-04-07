package com.itqan.edu.features.payments.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateCouponRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @Size(min = 3, max = 64, message = "Coupon code must be between 3 and 64 characters")
    private String code;

    @NotNull(message = "Discount percent is required")
    @Min(value = 1, message = "Discount percent must be at least 1")
    @Max(value = 100, message = "Discount percent must be at most 100")
    private Integer discountPercent;

    @Min(value = 1, message = "Usage limit must be at least 1")
    private Integer usageLimit;

    private LocalDateTime expiresAt;
}
