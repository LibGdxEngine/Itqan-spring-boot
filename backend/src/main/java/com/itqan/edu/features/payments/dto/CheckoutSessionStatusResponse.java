package com.itqan.edu.features.payments.dto;

import com.itqan.edu.features.payments.PaymentStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckoutSessionStatusResponse {
    private String sessionId;
    private PaymentStatus status;
    private Long paymentId;
    private Long courseId;
}
