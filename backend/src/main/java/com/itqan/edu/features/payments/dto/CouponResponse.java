package com.itqan.edu.features.payments.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CouponResponse {
    private Long id;
    private String code;
    private Long courseId;
    private Integer discountPercent;
    private Integer usageLimit;
    private Integer usedCount;
    private LocalDateTime expiresAt;
    private Boolean active;
    private Long createdByUserId;
    private LocalDateTime createdAt;
}
