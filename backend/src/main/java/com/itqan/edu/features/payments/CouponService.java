package com.itqan.edu.features.payments;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.payments.dto.CouponPricingResponse;
import com.itqan.edu.features.payments.dto.CouponResponse;
import com.itqan.edu.features.payments.dto.CreateCouponRequest;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CouponRepository couponRepository;
    private final CouponRedemptionRepository couponRedemptionRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public CouponResponse createCoupon(CreateCouponRequest request, User currentUser) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        enforceCouponManagementAccess(currentUser, course);

        if (request.getExpiresAt() != null && request.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Coupon expiry must be in the future");
        }

        String normalizedCode = normalizeOrGenerateCode(request.getCode());
        if (couponRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Coupon code already exists");
        }

        Coupon coupon = Coupon.builder()
                .code(normalizedCode)
                .course(course)
                .discountPercent(request.getDiscountPercent())
                .usageLimit(request.getUsageLimit())
                .expiresAt(request.getExpiresAt())
                .createdByUserId(currentUser.getId())
                .isActive(true)
                .build();

        return toResponse(couponRepository.save(coupon));
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> getCourseCoupons(Long courseId, User currentUser) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        enforceCouponManagementAccess(currentUser, course);

        return couponRepository.findByCourseIdOrderByCreatedAtDesc(courseId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deactivateCoupon(Long couponId, User currentUser) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COUPON_INVALID));
        enforceCouponManagementAccess(currentUser, coupon.getCourse());
        coupon.setIsActive(false);
        couponRepository.save(coupon);
    }

    @Transactional(readOnly = true)
    public CouponPricingResponse validateCouponForCourse(Long courseId, String couponCode, Long studentId) {
        CouponValidationResult result = validateForCheckout(courseId, couponCode, studentId);
        return result.getPricing();
    }

    @Transactional(readOnly = true)
    public CouponValidationResult validateForCheckout(Long courseId, String couponCode, Long studentId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (couponCode == null || couponCode.isBlank()) {
            return CouponValidationResult.builder()
                    .coupon(null)
                    .pricing(priceForCourse(course, null))
                    .build();
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCase(couponCode.trim())
                .orElseThrow(() -> new BusinessException(ErrorCode.COUPON_INVALID));

        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            throw new BusinessException(ErrorCode.COUPON_INVALID);
        }

        if (!coupon.getCourse().getId().equals(courseId)) {
            throw new BusinessException(ErrorCode.COUPON_COURSE_MISMATCH);
        }

        if (coupon.isExpired()) {
            throw new BusinessException(ErrorCode.COUPON_EXPIRED);
        }

        long reservedCount = couponRedemptionRepository.countByCouponIdAndStatus(coupon.getId(), CouponRedemptionStatus.RESERVED);
        if (coupon.isUsageExhausted((int) reservedCount)) {
            throw new BusinessException(ErrorCode.COUPON_USAGE_EXHAUSTED);
        }

        if (studentId != null && couponRedemptionRepository.existsByCouponIdAndStudentIdAndStatus(
                coupon.getId(),
                studentId,
                CouponRedemptionStatus.REDEEMED)) {
            throw new BusinessException(ErrorCode.COUPON_ALREADY_REDEEMED);
        }

        return CouponValidationResult.builder()
                .coupon(coupon)
                .pricing(priceForCourse(course, coupon))
                .build();
    }

    public void enforceCouponManagementAccess(User currentUser, Course course) {
        if (currentUser.getRole() == User.Role.ADMIN) {
            return;
        }
        if (currentUser.getRole() != User.Role.INSTRUCTOR) {
            throw new BusinessException(ErrorCode.COUPON_NOT_ALLOWED);
        }
        if (course.getOwnerUserId() == null || !course.getOwnerUserId().equals(currentUser.getId())) {
            throw new BusinessException(ErrorCode.COUPON_NOT_ALLOWED);
        }
    }

    private CouponPricingResponse priceForCourse(Course course, Coupon coupon) {
        BigDecimal original = BigDecimal.valueOf(course.getPrice() == null ? 0.0 : course.getPrice())
                .setScale(2, RoundingMode.HALF_UP);

        int percent = coupon != null ? coupon.getDiscountPercent() : 0;
        BigDecimal discount = original
                .multiply(BigDecimal.valueOf(percent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal finalAmount = original.subtract(discount).max(BigDecimal.ZERO);

        return CouponPricingResponse.builder()
                .courseId(course.getId())
                .couponCode(coupon != null ? coupon.getCode() : null)
                .discountPercent(percent)
                .originalAmount(original.doubleValue())
                .discountAmount(discount.doubleValue())
                .finalAmount(finalAmount.doubleValue())
                .free(finalAmount.compareTo(BigDecimal.ZERO) == 0)
                .build();
    }

    private CouponResponse toResponse(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .courseId(coupon.getCourse().getId())
                .discountPercent(coupon.getDiscountPercent())
                .usageLimit(coupon.getUsageLimit())
                .usedCount(coupon.getUsedCount())
                .expiresAt(coupon.getExpiresAt())
                .active(coupon.getIsActive())
                .createdByUserId(coupon.getCreatedByUserId())
                .createdAt(coupon.getCreatedAt())
                .build();
    }

    private String normalizeOrGenerateCode(String rawCode) {
        if (rawCode != null && !rawCode.isBlank()) {
            return rawCode.trim().toUpperCase(Locale.ROOT);
        }

        String code;
        do {
            code = generateCode();
        } while (couponRepository.existsByCodeIgnoreCase(code));
        return code;
    }

    private String generateCode() {
        StringBuilder builder = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            builder.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return builder.substring(0, 5) + "-" + builder.substring(5);
    }

    @Data
    @Builder
    public static class CouponValidationResult {
        private Coupon coupon;
        private CouponPricingResponse pricing;
    }
}
