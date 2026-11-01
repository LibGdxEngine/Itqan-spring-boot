package com.itqan.edu.features.scholarships.dto;

import com.itqan.edu.features.scholarships.DonationStatus;

public record DonationStatusResponse(DonationStatus status, Double amount, String currency) {
}
