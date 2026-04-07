package com.itqan.edu.features.payments.stripe;

public interface StripeGateway {

    StripeCheckoutSessionResult createCheckoutSession(StripeCheckoutSessionRequest request);

    StripeWebhookEvent parseWebhookEvent(String payload, String signatureHeader);
}
