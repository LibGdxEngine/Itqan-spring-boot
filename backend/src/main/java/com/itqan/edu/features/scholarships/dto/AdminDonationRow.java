package com.itqan.edu.features.scholarships.dto;

import com.itqan.edu.features.scholarships.Donation;
import com.itqan.edu.features.scholarships.DonationStatus;

import java.time.LocalDateTime;

public record AdminDonationRow(
        Long id,
        String donorName,
        String donorEmail,
        String message,
        Double amount,
        String currency,
        DonationStatus status,
        String gateway,
        String method,
        String reference,
        LocalDateTime createdAt,
        LocalDateTime completedAt) {

    public static AdminDonationRow from(Donation d) {
        return new AdminDonationRow(d.getId(), d.getDonorName(), d.getDonorEmail(), d.getMessage(),
                d.getAmount(), d.getCurrency(), d.getStatus(), d.getGateway(), d.getMethod(),
                d.getReference(), d.getCreatedAt(), d.getCompletedAt());
    }
}
