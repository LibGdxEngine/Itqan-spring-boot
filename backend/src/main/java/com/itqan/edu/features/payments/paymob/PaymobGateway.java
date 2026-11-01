package com.itqan.edu.features.payments.paymob;

/** Calls to the Paymob API. An interface so tests can replace it. */
public interface PaymobGateway {

    PaymobCheckout createIntention(PaymobIntentionRequest request);

    void refund(String transactionId, long amountCents);
}
