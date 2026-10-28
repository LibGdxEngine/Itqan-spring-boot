package com.itqan.edu.features.courses;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String description;

    @Column(nullable = false)
    private String instructor;

    @Column(name = "owner_user_id")
    private Long ownerUserId;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Integer duration; // in hours

    @Column(nullable = false)
    private String level; // BEGINNER, INTERMEDIATE, ADVANCED

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(nullable = false)
    private String category; // PROGRAMMING, DESIGN, BUSINESS, MARKETING, etc.

    @Column(length = 1000)
    private String thumbnailUrl;

    @Column(length = 1000)
    private String previewVideoUrl;

    @ElementCollection
    @CollectionTable(name = "course_learning_outcomes", joinColumns = @JoinColumn(name = "course_id"))
    @OrderColumn(name = "position")
    @Column(name = "outcome", length = 500, nullable = false)
    @Builder.Default
    private java.util.List<String> learningOutcomes = new java.util.ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "course_requirements", joinColumns = @JoinColumn(name = "course_id"))
    @OrderColumn(name = "position")
    @Column(name = "requirement", length = 500, nullable = false)
    @Builder.Default
    private java.util.List<String> requirements = new java.util.ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "course_tags", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "tag")
    @Builder.Default
    private java.util.List<String> tags = new java.util.ArrayList<>();

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

    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private java.util.List<Module> modules = new java.util.ArrayList<>();
}
