package com.itqan.edu.features.payments.paymob;

/** What a Paymob transaction callback means for the payment or donation it refers to. */
public enum PaymobOutcome {
    PAID, FAILED, REFUNDED, PENDING;

    public static PaymobOutcome of(com.fasterxml.jackson.databind.JsonNode tx) {
        boolean success = tx.path("success").asBoolean(false);
        boolean pending = tx.path("pending").asBoolean(false);
        boolean refunded = tx.path("is_refunded").asBoolean(false) || tx.path("is_refund").asBoolean(false)
                || tx.path("is_voided").asBoolean(false) || tx.path("is_void").asBoolean(false);
        if (pending) {
            return PENDING;
        }
        if (success && refunded) {
            return REFUNDED;
        }
        return success ? PAID : FAILED;
    }
}
