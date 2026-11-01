package com.itqan.edu.features.scholarships;

import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.students.Student;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "scholarship_applications", indexes = {
        @Index(name = "idx_scholarship_applications_status", columnList = "status, created_at"),
        @Index(name = "idx_scholarship_applications_student", columnList = "student_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScholarshipApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false, length = 3000)
    private String reason;

    @Column(length = 3000)
    private String circumstances;

    @Column(length = 40)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ScholarshipStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private FundingSource fundingSource;

    /** Amount taken from the donor fund when approved with {@link FundingSource#FUND}. */
    private Double fundAmount;

    @Column(length = 1000)
    private String adminNote;

    private Long decidedByUserId;

    private LocalDateTime decidedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
