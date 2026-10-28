package com.itqan.edu.features.admin.payments;

import com.itqan.edu.features.admin.payments.dto.AdminPaymentRow;
import com.itqan.edu.features.admin.payments.dto.ManualPaymentRequest;
import com.itqan.edu.features.payments.PaymentStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin - Payments", description = "Payment ledger, manual payments and refunds")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    @GetMapping
    @Operation(summary = "Search payments")
    public ResponseEntity<Page<AdminPaymentRow>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) String gateway,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminPaymentService.search(q, status, courseId, gateway, pageable));
    }

    @GetMapping("/export")
    @Operation(summary = "All payments matching the filters (for CSV export)")
    public ResponseEntity<List<AdminPaymentRow>> export(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) String gateway) {
        return ResponseEntity.ok(adminPaymentService.export(q, status, courseId, gateway));
    }

    @PostMapping("/manual")
    @Operation(summary = "Record an offline payment and enroll the student")
    public ResponseEntity<AdminPaymentRow> recordManual(@Valid @RequestBody ManualPaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminPaymentService.recordManualPayment(request));
    }

    @PostMapping("/{id}/refund")
    @Operation(summary = "Refund a completed payment and revoke course access",
            description = "Body (optional): {\"reason\": \"...\"}")
    public ResponseEntity<AdminPaymentRow> refund(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body == null ? null : body.get("reason");
        return ResponseEntity.ok(adminPaymentService.refund(id, reason));
    }
}
