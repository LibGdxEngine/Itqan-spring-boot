package com.itqan.edu.features.landingpage;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "landing_page_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandingPageConfig {

    public static final Long SINGLETON_ID = 1L;

    @Id
    private Long id;

    @Column(length = 1000)
    private String heroVideoUrl;

    private String heroVideoTitleAr;
    private String heroVideoTitleEn;
    private String heroTeacherNameAr;
    private String heroTeacherNameEn;
    private String heroDurationLabelAr;
    private String heroDurationLabelEn;

    private String teachersTitleAr;
    private String teachersTitleEn;
    @Column(length = 500)
    private String teachersSubtitleAr;
    @Column(length = 500)
    private String teachersSubtitleEn;

    @ElementCollection
    @CollectionTable(name = "landing_page_featured_courses",
            joinColumns = @JoinColumn(name = "landing_page_id"))
    @OrderColumn(name = "position")
    @Column(name = "course_id")
    @Builder.Default
    private List<Long> featuredCourseIds = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "landing_page_featured_instructors",
            joinColumns = @JoinColumn(name = "landing_page_id"))
    @OrderColumn(name = "position")
    @Column(name = "instructor_id")
    @Builder.Default
    private List<Long> featuredInstructorIds = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "landing_page_featured_articles",
            joinColumns = @JoinColumn(name = "landing_page_id"))
    @OrderColumn(name = "position")
    @Column(name = "article_id")
    @Builder.Default
    private List<Long> featuredArticleIds = new ArrayList<>();

    private LocalDateTime updatedAt;

    private Long updatedByUserId;

    @PrePersist
    @PreUpdate
    void onSave() {
        updatedAt = LocalDateTime.now();
    }
}
