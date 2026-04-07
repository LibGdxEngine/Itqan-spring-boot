package com.itqan.edu.features.payments;

import com.itqan.edu.features.courses.Course;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "coupons", indexes = {
        @Index(name = "idx_coupons_code", columnList = "code", unique = true),
        @Index(name = "idx_coupons_course", columnList = "course_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private Integer discountPercent;

    private Integer usageLimit; // null means unlimited

    @Column(nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Long createdByUserId;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isUsageExhausted(int reservedCount) {
        if (usageLimit == null || usageLimit < 0) {
            return false;
        }
        return usedCount + reservedCount >= usageLimit;
    }
}
