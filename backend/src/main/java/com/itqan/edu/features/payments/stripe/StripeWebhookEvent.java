package com.itqan.edu.features.payments.stripe;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StripeWebhookEvent {
    private String eventId;
    private String eventType;
    private String checkoutSessionId;
    private String paymentIntentId;
}
