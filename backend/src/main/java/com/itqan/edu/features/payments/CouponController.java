package com.itqan.edu.features.payments;

import com.itqan.edu.common.security.CurrentUserService;
import com.itqan.edu.features.payments.dto.CouponPricingResponse;
import com.itqan.edu.features.payments.dto.CouponResponse;
import com.itqan.edu.features.payments.dto.CreateCouponRequest;
import com.itqan.edu.features.payments.dto.ValidateCouponRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupons", description = "Course coupon management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class CouponController {

    private final CouponService couponService;
    private final CurrentUserService currentUserService;

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Create coupon", description = "Create a course coupon by admin or owning instructor")
    public ResponseEntity<CouponResponse> createCoupon(
            @Valid @RequestBody CreateCouponRequest request,
            Authentication authentication) {
        CouponResponse response = couponService.createCoupon(request, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Get course coupons", description = "Get coupons for a specific course")
    public ResponseEntity<List<CouponResponse>> getCourseCoupons(
            @PathVariable Long courseId,
            Authentication authentication) {
        List<CouponResponse> coupons = couponService.getCourseCoupons(courseId, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.ok(coupons);
    }

    @PatchMapping("/{couponId}/deactivate")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    @Operation(summary = "Deactivate coupon", description = "Deactivate a coupon")
    public ResponseEntity<Void> deactivateCoupon(
            @PathVariable Long couponId,
            Authentication authentication) {
        couponService.deactivateCoupon(couponId, currentUserService.getCurrentUser(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/validate")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @Operation(summary = "Validate coupon", description = "Validate a coupon and return computed pricing")
    public ResponseEntity<CouponPricingResponse> validateCoupon(
            @Valid @RequestBody ValidateCouponRequest request,
            Authentication authentication) {
        Long studentId = currentUserService.getCurrentStudentId(authentication);
        CouponPricingResponse response = couponService.validateCouponForCourse(
                request.getCourseId(),
                request.getCouponCode(),
                studentId);
        return ResponseEntity.ok(response);
    }
}
