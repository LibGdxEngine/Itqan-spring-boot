package com.itqan.edu.features.payments.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CouponPricingResponse {
    private Long courseId;
    private String couponCode;
    private Integer discountPercent;
    private Double originalAmount;
    private Double discountAmount;
    private Double finalAmount;
    private Boolean free;
}
