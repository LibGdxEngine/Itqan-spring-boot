package com.itqan.edu.features.payments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ValidateCouponRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotBlank(message = "Coupon code is required")
    private String couponCode;
}
