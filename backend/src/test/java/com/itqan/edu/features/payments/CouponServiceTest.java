package com.itqan.edu.features.payments;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private CouponRedemptionRepository couponRedemptionRepository;

    @Mock
    private CourseRepository courseRepository;

    private CouponService couponService;

    @BeforeEach
    void setUp() {
        couponService = new CouponService(couponRepository, couponRedemptionRepository, courseRepository);
    }

    @Test
    void validateForCheckout_With100PercentCoupon_ReturnsFreePricing() {
        Course course = course(10L, 120.0, 55L);
        Coupon coupon = coupon(course, 100, 10, 0, null);

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(couponRepository.findByCodeIgnoreCase("FREE100")).thenReturn(Optional.of(coupon));
        when(couponRedemptionRepository.countByCouponIdAndStatus(1L, CouponRedemptionStatus.RESERVED)).thenReturn(0L);
        when(couponRedemptionRepository.existsByCouponIdAndStudentIdAndStatus(1L, 9L, CouponRedemptionStatus.REDEEMED))
                .thenReturn(false);

        CouponService.CouponValidationResult result = couponService.validateForCheckout(10L, "FREE100", 9L);

        assertThat(result.getPricing().getFinalAmount()).isEqualTo(0.0);
        assertThat(result.getPricing().getDiscountAmount()).isEqualTo(120.0);
        assertThat(result.getPricing().getFree()).isTrue();
    }

    @Test
    void validateForCheckout_WithExpiredCoupon_ThrowsBusinessException() {
        Course course = course(10L, 120.0, 55L);
        Coupon coupon = coupon(course, 40, 10, 0, LocalDateTime.now().minusMinutes(1));

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(couponRepository.findByCodeIgnoreCase("OLD40")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> couponService.validateForCheckout(10L, "OLD40", 9L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COUPON_EXPIRED);
    }

    @Test
    void validateForCheckout_WithUsageLimitReached_ThrowsBusinessException() {
        Course course = course(10L, 120.0, 55L);
        Coupon coupon = coupon(course, 50, 1, 1, null);

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(couponRepository.findByCodeIgnoreCase("LIMIT1")).thenReturn(Optional.of(coupon));
        when(couponRedemptionRepository.countByCouponIdAndStatus(1L, CouponRedemptionStatus.RESERVED)).thenReturn(0L);

        assertThatThrownBy(() -> couponService.validateForCheckout(10L, "LIMIT1", 9L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COUPON_USAGE_EXHAUSTED);
    }

    @Test
    void validateForCheckout_WithAlreadyRedeemedCoupon_ThrowsBusinessException() {
        Course course = course(10L, 120.0, 55L);
        Coupon coupon = coupon(course, 50, 10, 1, null);

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(couponRepository.findByCodeIgnoreCase("REUSE50")).thenReturn(Optional.of(coupon));
        when(couponRedemptionRepository.countByCouponIdAndStatus(1L, CouponRedemptionStatus.RESERVED)).thenReturn(0L);
        when(couponRedemptionRepository.existsByCouponIdAndStudentIdAndStatus(1L, 9L, CouponRedemptionStatus.REDEEMED))
                .thenReturn(true);

        assertThatThrownBy(() -> couponService.validateForCheckout(10L, "REUSE50", 9L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COUPON_ALREADY_REDEEMED);
    }

    @Test
    void enforceCouponManagementAccess_InstructorWithoutOwnership_ThrowsBusinessException() {
        Course course = course(10L, 120.0, 77L);
        User instructor = User.builder()
                .id(99L)
                .email("inst@test.com")
                .firstName("Inst")
                .lastName("User")
                .role(User.Role.INSTRUCTOR)
                .build();

        assertThatThrownBy(() -> couponService.enforceCouponManagementAccess(instructor, course))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COUPON_NOT_ALLOWED);
    }

    private Course course(Long id, Double price, Long ownerUserId) {
        return Course.builder()
                .id(id)
                .title("Course")
                .description("Description")
                .instructor("Instructor")
                .ownerUserId(ownerUserId)
                .price(price)
                .duration(10)
                .level("BEGINNER")
                .category("GENERAL")
                .active(true)
                .build();
    }

    private Coupon coupon(Course course, int discountPercent, Integer usageLimit, int usedCount, LocalDateTime expiresAt) {
        return Coupon.builder()
                .id(1L)
                .code("CODE")
                .course(course)
                .discountPercent(discountPercent)
                .usageLimit(usageLimit)
                .usedCount(usedCount)
                .expiresAt(expiresAt)
                .createdByUserId(55L)
                .isActive(true)
                .build();
    }
}
