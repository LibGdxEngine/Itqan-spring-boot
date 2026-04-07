package com.itqan.edu.features.payments.dto;

import com.itqan.edu.features.payments.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {
    private Long id;
    private Long courseId;
    private String courseTitle;
    private Double amount;
    private Double originalAmount;
    private Double discountAmount;
    private String currency;
    private PaymentStatus status;
    private String paymentGateway;
    private String transactionId;
    private String couponCode;
    private String checkoutSessionId;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
