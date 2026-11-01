package com.itqan.edu.features.payments.paymob;

import com.fasterxml.jackson.databind.JsonNode;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;

/**
 * Verifies Paymob "transaction processed" callbacks: HMAC-SHA512 over these fields of the
 * transaction object, concatenated in this exact order, keyed with the account's HMAC secret.
 */
public final class PaymobHmac {

    static final List<String> FIELDS = List.of(
            "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction", "id",
            "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
            "is_voided", "order.id", "owner", "pending", "source_data.pan", "source_data.sub_type",
            "source_data.type", "success");

    private PaymobHmac() {
    }

    public static String compute(JsonNode transaction, String secret) {
        StringBuilder data = new StringBuilder();
        for (String field : FIELDS) {
            JsonNode node = transaction;
            for (String part : field.split("\\.")) {
                node = node == null ? null : node.get(part);
            }
            if (node != null && !node.isNull()) {
                data.append(node.asText());
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

    public static boolean matches(JsonNode transaction, String secret, String received) {
        if (received == null || secret == null || secret.isBlank()) {
            return false;
        }
        byte[] expected = compute(transaction, secret).getBytes(StandardCharsets.UTF_8);
        byte[] actual = received.trim().toLowerCase().getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, actual);
    }
}
