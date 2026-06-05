package com.itqan.edu.features.payments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    List<Coupon> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    boolean existsByCodeIgnoreCase(String code);

    void deleteByCourseId(Long courseId);
}
