package com.itqan.edu.features.scholarships;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Money given to the general scholarship fund. Donors are never shown publicly. */
@Entity
@Table(name = "donations", indexes = {
        @Index(name = "idx_donations_status", columnList = "status, created_at"),
        @Index(name = "idx_donations_gateway_reference", columnList = "gateway_reference")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Donation {

    public static final String GATEWAY_PAYMOB = "PAYMOB";
    public static final String GATEWAY_MANUAL = "MANUAL";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 200)
    private String donorName;

    /** Optional for donations an admin records by hand. */
    private String donorEmail;

    @Column(length = 1000)
    private String message;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DonationStatus status;

    @Column(nullable = false, length = 20)
    private String gateway;

    /** VODAFONE_CASH, INSTAPAY, CASH, BANK_TRANSFER, ONLINE, OTHER */
    @Column(length = 40)
    private String method;

    /** Our reference sent to Paymob (merchant_order_id), e.g. DON-7-a1b2c3d4. */
    @Column(unique = true, length = 64)
    private String gatewayReference;

    /** Paymob transaction id, needed for refunds. */
    private String gatewayTransactionId;

    private String reference;

    private Long recordedByUserId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
