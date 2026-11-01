package com.itqan.edu.features.payments;

import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.students.Student;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payments_student", columnList = "student_id"),
        @Index(name = "idx_payments_course", columnList = "course_id"),
        @Index(name = "idx_payments_status", columnList = "status"),
        @Index(name = "idx_payments_session", columnList = "stripe_checkout_session_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private Double originalAmount;

    @Column(nullable = false)
    @Builder.Default
    private Double discountAmount = 0.0;

    @Column(nullable = false, length = 3)
    private String currency; // EGP, USD, etc.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Column(nullable = false)
    private String paymentGateway; // PAYMOB, FAWRY, STRIPE, etc.

    @Column(unique = true)
    private String transactionId; // Gateway transaction ID

    @Column(unique = true)
    private String stripeCheckoutSessionId;

    private String stripePaymentIntentId;

    /** Our reference sent to Paymob (special_reference / merchant_order_id), e.g. PAY-12-a1b2c3. */
    @Column(unique = true, length = 64)
    private String gatewayReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    private String paymentMethod; // CARD, WALLET, CASH, etc.

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (originalAmount == null) {
            originalAmount = amount;
        }
        if (discountAmount == null) {
            discountAmount = 0.0;
        }
    }
}
