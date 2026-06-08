package com.itqan.edu.features.clips;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "clips")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Clip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClipType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String fileUrl;

    @Column(nullable = false, length = 512)
    private String objectKey;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String mimeType;

    private Long sizeBytes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

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
