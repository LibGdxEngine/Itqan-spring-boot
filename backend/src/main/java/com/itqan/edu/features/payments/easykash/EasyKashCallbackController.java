package com.itqan.edu.features.payments.easykash;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** The Callback URL configured in EasyKash's Integration Settings. */
@RestController
@RequestMapping("/api/payments/webhook/easykash")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payments and billing APIs")
public class EasyKashCallbackController {

    private final EasyKashService easyKashService;

    @PostMapping
    @Operation(summary = "EasyKash payment callback")
    public ResponseEntity<Map<String, String>> callback(@RequestBody(required = false) String payload) {
        easyKashService.handleCallback(payload);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    /** Lets a "is this URL working?" check succeed. Only a signed POST can change anything. */
    @GetMapping
    @Operation(summary = "EasyKash callback URL availability check")
    public ResponseEntity<Map<String, String>> availability() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
