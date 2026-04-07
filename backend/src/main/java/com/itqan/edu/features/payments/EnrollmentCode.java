package com.itqan.edu.features.payments;

import com.itqan.edu.features.courses.Course;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "enrollment_codes", indexes = {
        @Index(name = "idx_code", columnList = "code", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    @Builder.Default
    private Integer usageLimit = 1; // -1 means unlimited

    @Column(nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Long createdBy; // Admin/Instructor ID

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public boolean isValid() {
        if (!isActive) {
            return false;
        }

        if (expiresAt != null && expiresAt.isBefore(LocalDateTime.now())) {
            return false;
        }

        if (usageLimit >= 0 && usedCount >= usageLimit) {
            return false;
        }

        return true;
    }

    public void incrementUsage() {
        this.usedCount++;
    }
}
