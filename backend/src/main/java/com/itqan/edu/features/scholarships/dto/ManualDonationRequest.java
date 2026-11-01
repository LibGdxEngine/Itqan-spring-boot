package com.itqan.edu.features.scholarships.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ManualDonationRequest {
    @NotNull
    @Positive
    private Double amount;

    @NotBlank
    @Size(min = 3, max = 3)
    private String currency;

    /** VODAFONE_CASH, INSTAPAY, CASH, BANK_TRANSFER, OTHER */
    @NotBlank
    @Size(max = 40)
    private String method;

    /** Optional: donors who give offline may not share an email. */
    @Email
    @Size(max = 255)
    private String donorEmail;

    @Size(max = 200)
    private String donorName;

    @Size(max = 255)
    private String reference;

    @Size(max = 1000)
    private String message;
}
