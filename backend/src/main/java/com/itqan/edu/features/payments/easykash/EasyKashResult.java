package com.itqan.edu.features.payments.easykash;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.Locale;

/** What EasyKash reports about a payment, from a verified callback or the Inquiry API. */
public record EasyKashResult(Outcome outcome, String easykashRef, String paymentMethod, String amount) {

    public enum Outcome {
        PAID, PENDING, FAILED
    }

    static EasyKashResult from(JsonNode body) {
        return new EasyKashResult(
                outcomeOf(body.path("status").asText("")),
                body.path("easykashRef").asText(""),
                body.path("PaymentMethod").asText(""),
                body.path("Amount").asText(""));
    }

    /** Unknown values stay PENDING: only an explicit status may grant or close a payment. */
    static Outcome outcomeOf(String status) {
        return switch (status.trim().toUpperCase(Locale.ROOT)) {
            case "PAID", "DELIVERED" -> Outcome.PAID;
            case "EXPIRED", "FAILED", "CANCELED", "REFUNDED" -> Outcome.FAILED;
            default -> Outcome.PENDING;
        };
    }
}
