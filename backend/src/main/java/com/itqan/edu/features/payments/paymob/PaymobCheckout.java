package com.itqan.edu.features.payments.paymob;

/** A created payment intention and the hosted checkout URL to send the payer to. */
public record PaymobCheckout(String intentionId, String checkoutUrl) {
}
