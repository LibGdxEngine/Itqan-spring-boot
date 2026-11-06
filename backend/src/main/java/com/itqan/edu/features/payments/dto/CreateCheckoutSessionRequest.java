package com.itqan.edu.features.payments.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCheckoutSessionRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    private String couponCode;

    /** Buyer's mobile number; EasyKash requires one. Falls back to the number on the student's profile. */
    @Size(max = 32, message = "Mobile number is too long")
    private String phone;
}
