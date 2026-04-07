package com.itqan.edu.features.payments.stripe;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StripeCheckoutSessionResult {
    private String sessionId;
    private String checkoutUrl;
}
