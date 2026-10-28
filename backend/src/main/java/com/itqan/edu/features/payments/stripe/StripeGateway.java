package com.itqan.edu.features.payments.stripe;

public interface StripeGateway {

    StripeCheckoutSessionResult createCheckoutSession(StripeCheckoutSessionRequest request);

    StripeWebhookEvent parseWebhookEvent(String payload, String signatureHeader);

    /** Refunds the full amount of a captured payment intent. */
    void refundPaymentIntent(String paymentIntentId);
}
