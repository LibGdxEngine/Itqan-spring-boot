package com.itqan.edu.features.enrollments;

import com.itqan.edu.features.courses.Lesson;
import com.itqan.edu.features.students.Student;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_enrollments", uniqueConstraints = @UniqueConstraint(columnNames = { "student_id", "lesson_id" }))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    private LocalDateTime completedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void markCompleted() {
        this.isCompleted = true;
        this.completedAt = LocalDateTime.now();
    }

    public void markIncomplete() {
        this.isCompleted = false;
        this.completedAt = null;
    }
}
