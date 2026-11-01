package com.itqan.edu.features.scholarships.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DonationCheckoutRequest {
    @NotNull
    private Double amount;

    @NotBlank
    @Email
    @Size(max = 255)
    private String donorEmail;

    @Size(max = 200)
    private String donorName;

    @Size(max = 1000)
    private String message;
}
