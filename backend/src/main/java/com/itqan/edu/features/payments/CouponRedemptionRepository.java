package com.itqan.edu.features.payments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CouponRedemptionRepository extends JpaRepository<CouponRedemption, Long> {

    boolean existsByCouponIdAndStudentIdAndStatus(Long couponId, Long studentId, CouponRedemptionStatus status);

    long countByCouponIdAndStatus(Long couponId, CouponRedemptionStatus status);

    Optional<CouponRedemption> findByStripeCheckoutSessionId(String stripeCheckoutSessionId);

    @Query("SELECT cr FROM CouponRedemption cr WHERE cr.payment.id = :paymentId")
    Optional<CouponRedemption> findByPaymentId(@Param("paymentId") Long paymentId);
}
