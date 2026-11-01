package com.itqan.edu.features.payments.paymob;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/webhook/paymob")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payments and billing APIs")
public class PaymobWebhookController {

    private final PaymobWebhookService webhookService;

    @PostMapping
    @Operation(summary = "Paymob transaction processed callback")
    public ResponseEntity<Map<String, String>> callback(@RequestBody JsonNode payload,
                                                        @RequestParam(value = "hmac", required = false) String hmac) {
        webhookService.handle(payload, hmac);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
