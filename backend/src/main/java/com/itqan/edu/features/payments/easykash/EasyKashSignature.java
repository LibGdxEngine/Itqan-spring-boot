package com.itqan.edu.features.payments.easykash;

import com.fasterxml.jackson.databind.JsonNode;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

/**
 * Verifies EasyKash callbacks: HMAC-SHA512 (hex) over these fields' values, concatenated in this
 * exact order with no separator, keyed with the account's HMAC secret.
 */
final class EasyKashSignature {

    private static final List<String> FIELDS = List.of(
            "ProductCode", "Amount", "ProductType", "PaymentMethod", "status", "easykashRef", "customerReference");

    private EasyKashSignature() {
    }

    static String compute(JsonNode payload, String secret) {
        StringBuilder data = new StringBuilder();
        for (String field : FIELDS) {
            JsonNode value = payload.get(field);
            if (value != null && !value.isNull()) {
                data.append(value.asText());
            }
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            return HexFormat.of().formatHex(mac.doFinal(data.toString().getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC computation failed", e);
        }
    }

    static boolean matches(JsonNode payload, String secret) {
        String received = payload.path("signatureHash").asText("");
        if (received.isBlank() || secret == null || secret.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
                compute(payload, secret).getBytes(StandardCharsets.UTF_8),
                received.trim().toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8));
    }
}
