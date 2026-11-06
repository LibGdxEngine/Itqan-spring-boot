package com.itqan.edu.features.payments.easykash;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.payments.Payment;
import com.itqan.edu.features.payments.PaymentRepository;
import com.itqan.edu.features.payments.PaymentService;
import com.itqan.edu.features.payments.PaymentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Turns EasyKash's reports into payment changes. The callback is the primary signal but only fires on
 * success and its retry behaviour is undocumented, so pending payments are also checked through the
 * Inquiry API: when the buyer returns to the site, and periodically for vouchers paid later.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EasyKashService {

    /** Grace on top of the voucher lifetime before an attempt with no answer is closed. */
    private static final int ABANDON_GRACE_HOURS = 24;

    private final EasyKashProperties properties;
    private final EasyKashGateway gateway;
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final ObjectMapper objectMapper;

    public void handleCallback(String rawBody) {
        JsonNode payload = parse(rawBody);
        if (!EasyKashSignature.matches(payload, properties.getHmacSecret())) {
            log.warn("Rejected EasyKash callback with an invalid signature (reference {})",
                    payload.path("customerReference").asText(""));
            throw new BusinessException(ErrorCode.PAYMENT_SIGNATURE_INVALID);
        }
        paymentService.applyEasyKashResult(payload.path("customerReference").asText(""), EasyKashResult.from(payload));
    }

    /** Asks EasyKash about a payment that is still pending, so a lost callback can't strand the buyer. */
    public void refreshIfPending(String reference) {
        if (properties.isConfigured() && paymentRepository.existsByGatewayReferenceAndPaymentGatewayAndStatus(
                reference, PaymentService.EASYKASH_GATEWAY, PaymentStatus.PENDING)) {
            gateway.inquire(reference).ifPresent(result -> paymentService.applyEasyKashResult(reference, result));
        }
    }

    @Scheduled(fixedDelayString = "${easykash.reconcile-interval-ms:600000}",
            initialDelayString = "${easykash.reconcile-interval-ms:600000}")
    public void reconcilePendingPayments() {
        if (!properties.isConfigured()) {
            return;
        }
        LocalDateTime abandonBefore = LocalDateTime.now()
                .minusHours(properties.getCashExpiryHours() + (long) ABANDON_GRACE_HOURS);
        for (Payment payment : paymentRepository.findByPaymentGatewayAndStatus(
                PaymentService.EASYKASH_GATEWAY, PaymentStatus.PENDING)) {
            String reference = payment.getGatewayReference();
            try {
                var result = gateway.inquire(reference);
                boolean undecided = result.isEmpty() || result.get().outcome() == EasyKashResult.Outcome.PENDING;
                if (undecided && payment.getCreatedAt().isBefore(abandonBefore)) {
                    paymentService.abandonEasyKashPayment(reference);
                } else {
                    result.ifPresent(r -> paymentService.applyEasyKashResult(reference, r));
                }
            } catch (RuntimeException e) {
                log.error("Could not reconcile EasyKash payment {}", reference, e);
            }
        }
    }

    /** Exact decimals: a numeric Amount of 11.00 must stay "11.00" or the signature won't match. */
    private JsonNode parse(String rawBody) {
        try {
            JsonNode payload = objectMapper.reader()
                    .with(JsonNodeFactory.withExactBigDecimals(true))
                    .with(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS)
                    .readTree(rawBody);
            if (payload == null || !payload.isObject()) {
                throw new BusinessException(ErrorCode.PAYMENT_SIGNATURE_INVALID);
            }
            return payload;
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.PAYMENT_SIGNATURE_INVALID);
        }
    }
}
