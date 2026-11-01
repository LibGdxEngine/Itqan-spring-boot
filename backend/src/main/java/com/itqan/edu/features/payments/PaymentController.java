package com.itqan.edu.features.payments;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.payments.dto.CheckoutSessionStatusResponse;
import com.itqan.edu.features.payments.dto.CreateCheckoutSessionRequest;
import com.itqan.edu.features.payments.dto.CreateCheckoutSessionResponse;
import com.itqan.edu.features.payments.dto.PaymentResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payments and billing APIs")
public class PaymentController {

    private final PaymentService paymentService;
    private final CurrentUserService currentUserService;

    @PostMapping("/checkout-sessions")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Create checkout session", description = "Create Stripe checkout session for course purchase")
    public ResponseEntity<CreateCheckoutSessionResponse> createCheckoutSession(
            @Valid @RequestBody CreateCheckoutSessionRequest request,
            Authentication authentication) {
        Long studentId = currentUserService.getCurrentStudentId(authentication);
        CreateCheckoutSessionResponse response = paymentService.createCheckoutSession(request, studentId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/paymob/checkout")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Start a Paymob checkout", description = "Returns the Paymob hosted checkout URL for a course")
    public ResponseEntity<CreateCheckoutSessionResponse> createPaymobCheckout(
            @Valid @RequestBody CreateCheckoutSessionRequest request,
            Authentication authentication) {
        Long studentId = currentUserService.getCurrentStudentId(authentication);
        return ResponseEntity.ok(paymentService.createPaymobCheckout(request, studentId));
    }

    @PostMapping("/webhook/stripe")
    @Operation(summary = "Stripe webhook endpoint", description = "Handles Stripe checkout webhook events")
    public ResponseEntity<Map<String, String>> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signatureHeader) {
        paymentService.processStripeWebhook(payload, signatureHeader);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get current student payment history", description = "Returns payment history for current student")
    public ResponseEntity<List<PaymentResponse>> myPayments(Authentication authentication) {
        Long studentId = currentUserService.getCurrentStudentId(authentication);
        return ResponseEntity.ok(paymentService.getPaymentHistory(studentId));
    }

    @GetMapping("/checkout-sessions/{sessionId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get checkout session status", description = "Returns payment status for checkout session")
    public ResponseEntity<CheckoutSessionStatusResponse> checkoutSessionStatus(
            @PathVariable String sessionId,
            Authentication authentication) {
        Long studentId = currentUserService.getCurrentStudentId(authentication);
        return ResponseEntity.ok(paymentService.getCheckoutSessionStatus(sessionId, studentId));
    }
}
