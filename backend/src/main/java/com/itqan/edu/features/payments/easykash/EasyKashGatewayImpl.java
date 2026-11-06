package com.itqan.edu.features.payments.easykash;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class EasyKashGatewayImpl implements EasyKashGateway {

    private final EasyKashProperties properties;
    private final ObjectMapper objectMapper;

    @Override
    public String createPayLink(EasyKashPayRequest request) {
        // paymentOptions is left out on purpose: EasyKash then offers everything enabled on the account.
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", request.amount());
        body.put("currency", request.currency());
        body.put("cashExpiry", properties.getCashExpiryHours());
        body.put("name", request.name());
        body.put("email", request.email());
        body.put("mobile", request.mobile());
        body.put("redirectUrl", request.redirectUrl());
        body.put("customerReference", request.customerReference());

        try {
            String payUrl = objectMapper.readTree(post("/api/directpayv1/pay", body)).path("redirectUrl").asText("");
            if (!StringUtils.hasText(payUrl)) {
                throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR, "EasyKash did not return a payment link");
            }
            return payUrl;
        } catch (RestClientResponseException e) {
            log.error("EasyKash pay failed for {}: {} {}", request.customerReference(), e.getStatusCode(),
                    e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR, "Could not start the EasyKash payment");
        } catch (RestClientException | JsonProcessingException e) {
            log.error("EasyKash pay failed for {}: {}", request.customerReference(), e.getMessage());
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR, "Could not start the EasyKash payment");
        }
    }

    @Override
    public Optional<EasyKashResult> inquire(String customerReference) {
        try {
            JsonNode response = objectMapper.readTree(
                    post("/api/cash-api/inquire", Map.of("customerReference", customerReference)));
            return response != null && response.hasNonNull("status")
                    ? Optional.of(EasyKashResult.from(response))
                    : Optional.empty();
        } catch (RestClientException | JsonProcessingException e) {
            // Expected until the buyer picks a method on the hosted page; the caller simply retries later.
            log.debug("EasyKash inquiry gave no answer for {}: {}", customerReference, e.getMessage());
            return Optional.empty();
        }
    }

    /** Read as text: the docs don't promise a JSON content type on responses. */
    private String post(String path, Object body) {
        return client().post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);
    }

    private RestClient client() {
        SimpleClientHttpRequestFactory timeouts = new SimpleClientHttpRequestFactory();
        timeouts.setConnectTimeout(Duration.ofSeconds(5));
        timeouts.setReadTimeout(Duration.ofSeconds(20));
        return RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .requestFactory(timeouts)
                .defaultHeader("authorization", properties.getApiKey())
                .build();
    }
}
