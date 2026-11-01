package com.itqan.edu.features.scholarships;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.scholarships.dto.AdminDonationRow;
import com.itqan.edu.features.scholarships.dto.AdminScholarshipRow;
import com.itqan.edu.features.scholarships.dto.ManualDonationRequest;
import com.itqan.edu.features.scholarships.dto.ScholarshipDecisionRequest;
import com.itqan.edu.features.scholarships.dto.ScholarshipFundSummary;
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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin - Scholarships", description = "Review scholarship requests and manage the donor fund")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminScholarshipController {

    private final ScholarshipService scholarshipService;
    private final DonationService donationService;
    private final CurrentUserService currentUserService;

    @GetMapping("/scholarships")
    @Operation(summary = "Search scholarship requests")
    public ResponseEntity<Page<AdminScholarshipRow>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ScholarshipStatus status,
            @RequestParam(required = false) Long courseId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(scholarshipService.search(q, status, courseId, pageable));
    }

    @PostMapping("/scholarships/{id}/approve")
    @Operation(summary = "Approve a request and enroll the student for free")
    public ResponseEntity<AdminScholarshipRow> approve(@PathVariable Long id,
                                                       @Valid @RequestBody ScholarshipDecisionRequest request,
                                                       Authentication authentication) {
        Long adminId = currentUserService.getCurrentUser(authentication).getId();
        return ResponseEntity.ok(scholarshipService.approve(id, request, adminId));
    }

    @PostMapping("/scholarships/{id}/reject")
    @Operation(summary = "Reject a request")
    public ResponseEntity<AdminScholarshipRow> reject(@PathVariable Long id,
                                                      @Valid @RequestBody(required = false) ScholarshipDecisionRequest request,
                                                      Authentication authentication) {
        Long adminId = currentUserService.getCurrentUser(authentication).getId();
        return ResponseEntity.ok(scholarshipService.reject(id, request, adminId));
    }

    @GetMapping("/scholarships/fund")
    @Operation(summary = "Fund totals: received, used and balance")
    public ResponseEntity<ScholarshipFundSummary> fund() {
        return ResponseEntity.ok(donationService.summary());
    }

    @GetMapping("/donations")
    @Operation(summary = "Search donations")
    public ResponseEntity<Page<AdminDonationRow>> donations(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) DonationStatus status,
            @RequestParam(required = false) String gateway,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(donationService.search(q, status, gateway, pageable));
    }

    @PostMapping("/donations/manual")
    @Operation(summary = "Record a donation received offline")
    public ResponseEntity<AdminDonationRow> recordManual(@Valid @RequestBody ManualDonationRequest request,
                                                         Authentication authentication) {
        Long adminId = currentUserService.getCurrentUser(authentication).getId();
        return ResponseEntity.status(HttpStatus.CREATED).body(donationService.recordManual(request, adminId));
    }
}
