package com.itqan.edu.features.quizzes;

import com.itqan.edu.features.courses.Lesson;
import com.itqan.edu.features.courses.Module;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quizzes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Integer passingScore = 70; // percentage

    private Integer timeLimit; // in minutes, null means no limit

    @Column(nullable = false)
    @Builder.Default
    private Integer attemptsAllowed = -1; // -1 means unlimited

    @Column(nullable = false)
    @Builder.Default
    private Boolean showCorrectAnswers = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    // Optional: can be attached to either a Lesson or Module
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    private Module module;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

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
}
