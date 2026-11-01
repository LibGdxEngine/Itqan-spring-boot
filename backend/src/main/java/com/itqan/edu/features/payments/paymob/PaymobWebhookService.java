package com.itqan.edu.features.payments.paymob;

import com.fasterxml.jackson.databind.JsonNode;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.payments.PaymentService;
import com.itqan.edu.features.payments.ProcessedStripeEvent;
import com.itqan.edu.features.payments.ProcessedStripeEventRepository;
import com.itqan.edu.features.scholarships.DonationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/** Routes verified Paymob callbacks to course payments ("PAY-...") or donations ("DON-..."). */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymobWebhookService {

    public static final String PAYMENT_PREFIX = "PAY-";
    public static final String DONATION_PREFIX = "DON-";

    private final PaymobProperties properties;
    private final PaymentService paymentService;
    private final DonationService donationService;
    private final ProcessedStripeEventRepository processedEventRepository;

    @Transactional
    public void handle(JsonNode payload, String hmac) {
        JsonNode tx = payload.path("obj");
        if (!"TRANSACTION".equalsIgnoreCase(payload.path("type").asText()) || tx.isMissingNode()) {
            return; // Token and delivery callbacks are not used.
        }
        if (!PaymobHmac.matches(tx, properties.getHmacSecret(), hmac)) {
            log.warn("Rejected Paymob callback with an invalid HMAC (transaction {})", tx.path("id").asText());
            throw new BusinessException(ErrorCode.PAYMENT_SIGNATURE_INVALID);
        }

        PaymobOutcome outcome = PaymobOutcome.of(tx);
        String transactionId = tx.path("id").asText();
        // Each transaction is applied once per outcome (a refund arrives as a later callback).
        String eventId = "paymob:" + transactionId + ":" + outcome;
        if (outcome == PaymobOutcome.PENDING || processedEventRepository.existsByEventId(eventId)) {
            return;
        }

        String reference = tx.path("order").path("merchant_order_id").asText("");
        if (reference.startsWith(PAYMENT_PREFIX)) {
            paymentService.applyPaymobTransaction(reference, transactionId, outcome);
        } else if (reference.startsWith(DONATION_PREFIX)) {
            donationService.applyPaymobTransaction(reference, transactionId, outcome);
        } else {
            log.warn("Paymob callback for unknown reference '{}' (transaction {})", reference, transactionId);
            return;
        }

        processedEventRepository.save(ProcessedStripeEvent.builder()
                .eventId(eventId)
                .eventType("paymob.transaction." + outcome.name().toLowerCase())
                .processedAt(LocalDateTime.now())
                .build());
    }
}
