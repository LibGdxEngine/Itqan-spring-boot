package com.itqan.edu.features.scholarships;

import com.itqan.edu.features.scholarships.dto.DonationCheckoutRequest;
import com.itqan.edu.features.scholarships.dto.DonationCheckoutResponse;
import com.itqan.edu.features.scholarships.dto.DonationStatusResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Public: guests can give to the scholarship fund without an account. */
@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
@Tag(name = "Donations", description = "Donations to the scholarship fund")
public class DonationController {

    private final DonationService donationService;

    @PostMapping("/checkout")
    @Operation(summary = "Start a card donation (Stripe Checkout)")
    public ResponseEntity<DonationCheckoutResponse> checkout(@Valid @RequestBody DonationCheckoutRequest request) {
        return ResponseEntity.ok(donationService.createCheckout(request));
    }

    @GetMapping("/checkout/{sessionId}")
    @Operation(summary = "Status of a donation checkout, for the thank-you page")
    public ResponseEntity<DonationStatusResponse> status(@PathVariable String sessionId) {
        return ResponseEntity.ok(donationService.getStatus(sessionId));
    }
}
