package com.itqan.edu.features.admin.payments.dto;

import com.itqan.edu.features.payments.Payment;
import com.itqan.edu.features.payments.PaymentStatus;

import java.time.LocalDateTime;

public record AdminPaymentRow(
        Long id,
        Long studentId,
        String studentName,
        String studentEmail,
        Long courseId,
        String courseTitle,
        Double amount,
        Double discountAmount,
        String currency,
        PaymentStatus status,
        String gateway,
        String method,
        String transactionId,
        String couponCode,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime completedAt) {

    public static AdminPaymentRow from(Payment p) {
        return new AdminPaymentRow(
                p.getId(),
                p.getStudent().getId(),
                (p.getStudent().getFirstName() + " " + p.getStudent().getLastName()).trim(),
                p.getStudent().getEmail(),
                p.getCourse().getId(),
                p.getCourse().getTitle(),
                p.getAmount(),
                p.getDiscountAmount(),
                p.getCurrency(),
                p.getStatus(),
                p.getPaymentGateway(),
                p.getPaymentMethod(),
                p.getTransactionId(),
                p.getCoupon() != null ? p.getCoupon().getCode() : null,
                p.getNotes(),
                p.getCreatedAt(),
                p.getCompletedAt());
    }
}
