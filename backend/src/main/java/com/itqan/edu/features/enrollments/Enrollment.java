package com.itqan.edu.features.enrollments;

import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.students.Student;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments", uniqueConstraints = @UniqueConstraint(columnNames = { "student_id", "course_id" }))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnrollmentStatus status;

    @Column(nullable = false)
    @Builder.Default
    private Integer progress = 0; // 0-100 percentage

    @Column(nullable = false)
    private LocalDateTime enrolledAt;

    private LocalDateTime completedAt;

    private LocalDateTime lastAccessedAt;

    @PrePersist
    protected void onCreate() {
        if (enrolledAt == null) {
            enrolledAt = LocalDateTime.now();
        }
        if (lastAccessedAt == null) {
            lastAccessedAt = LocalDateTime.now();
        }
    }
}
