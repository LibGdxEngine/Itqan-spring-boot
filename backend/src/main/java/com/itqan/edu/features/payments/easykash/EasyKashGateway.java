package com.itqan.edu.features.payments.easykash;

import java.util.Optional;

/** EasyKash Direct Pay HTTP API. */
public interface EasyKashGateway {

    /** Creates a Direct Pay link and returns the hosted payment page URL to send the buyer to. */
    String createPayLink(EasyKashPayRequest request);

    /** Looks a payment up by our reference. Empty when EasyKash has no answer for it (yet). */
    Optional<EasyKashResult> inquire(String customerReference);
}
