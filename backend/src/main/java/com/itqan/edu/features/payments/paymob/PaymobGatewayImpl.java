package com.itqan.edu.features.payments.paymob;

import com.fasterxml.jackson.databind.JsonNode;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Paymob Intention API (unified checkout) and refunds. */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymobGatewayImpl implements PaymobGateway {

    private static final int MAX_ITEM_NAME = 50;

    private final PaymobProperties properties;

    @Override
    public PaymobCheckout createIntention(PaymobIntentionRequest request) {
        requireConfigured();

        Map<String, Object> billing = new LinkedHashMap<>();
        billing.put("first_name", orNa(request.getFirstName()));
        billing.put("last_name", orNa(request.getLastName()));
        billing.put("email", orNa(request.getEmail()));
        billing.put("phone_number", orNa(request.getPhone()));

        String name = request.getItemName() == null ? "Itqan" : request.getItemName();
        if (name.length() > MAX_ITEM_NAME) {
            name = name.substring(0, MAX_ITEM_NAME);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", request.getAmountCents());
        body.put("currency", request.getCurrency());
        body.put("payment_methods", properties.getIntegrationIds());
        body.put("items", List.of(Map.of("name", name, "amount", request.getAmountCents(), "quantity", 1)));
        body.put("billing_data", billing);
        body.put("special_reference", request.getReference());
        body.put("notification_url", request.getNotificationUrl());
        body.put("redirection_url", request.getRedirectionUrl());

        try {
            JsonNode response = client().post()
                    .uri("/v1/intention/")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            String clientSecret = response == null ? null : response.path("client_secret").asText(null);
            if (!StringUtils.hasText(clientSecret)) {
                throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR, "Paymob did not return a client secret");
            }
            String checkoutUrl = UriComponentsBuilder.fromUriString(properties.getBaseUrl())
                    .path("/unifiedcheckout/")
                    .queryParam("publicKey", properties.getPublicKey())
                    .queryParam("clientSecret", clientSecret)
                    .build().toUriString();
            return new PaymobCheckout(response.path("id").asText(null), checkoutUrl);
        } catch (RestClientResponseException e) {
            log.error("Paymob intention failed: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR, "Could not start the Paymob payment");
        }
    }

    @Override
    public void refund(String transactionId, long amountCents) {
        requireConfigured();
        try {
            client().post()
                    .uri("/api/acceptance/void_refund/refund")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("transaction_id", transactionId, "amount_cents", amountCents))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            log.error("Paymob refund failed for {}: {} {}", transactionId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR, "Paymob refund failed");
        }
    }

    private RestClient client() {
        return RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader("Authorization", "Token " + properties.getSecretKey())
                .build();
    }

    private void requireConfigured() {
        if (!properties.isConfigured()) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR, "Online payment is not enabled");
        }
    }

    private static String orNa(String value) {
        return StringUtils.hasText(value) ? value.trim() : "NA";
    }
}
