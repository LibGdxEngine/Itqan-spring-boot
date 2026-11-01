package com.itqan.edu.features.scholarships.dto;

public record ScholarshipFundSummary(
        double received,
        double used,
        double balance,
        long donationsCount,
        long pendingApplications,
        long approvedApplications) {
}
