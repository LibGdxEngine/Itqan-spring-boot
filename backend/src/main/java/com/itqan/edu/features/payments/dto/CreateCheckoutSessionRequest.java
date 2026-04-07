package com.itqan.edu.features.payments.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCheckoutSessionRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    private String couponCode;
}
