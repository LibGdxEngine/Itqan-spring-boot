package com.itqan.edu.features.payments.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateCheckoutSessionResponse {
    private CheckoutMode mode;
    private String checkoutUrl;
    private String sessionId;
    private Long paymentId;
    private Long enrollmentId;
    private CouponPricingResponse pricing;
}
