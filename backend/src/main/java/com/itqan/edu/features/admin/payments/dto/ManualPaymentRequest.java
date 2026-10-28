package com.itqan.edu.features.admin.payments.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ManualPaymentRequest {
    @NotBlank
    @Email
    private String studentEmail;

    @NotNull
    private Long courseId;

    @NotNull
    @PositiveOrZero
    private Double amount;

    @NotBlank
    @Size(min = 3, max = 3)
    private String currency;

    /** VODAFONE_CASH, INSTAPAY, CASH, BANK_TRANSFER, OTHER */
    @NotBlank
    private String method;

    /** Transfer / receipt reference shown in the ledger. */
    @Size(max = 255)
    private String reference;

    @Size(max = 1000)
    private String notes;
}
