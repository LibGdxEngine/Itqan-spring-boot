package com.itqan.edu.features.payments.stripe;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class StripeCheckoutSessionRequest {
    private Long amountInCents;
    private String currency;
    private String productName;
    private String successUrl;
    private String cancelUrl;
    private Map<String, String> metadata;
}
