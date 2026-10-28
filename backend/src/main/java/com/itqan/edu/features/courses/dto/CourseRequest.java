package com.itqan.edu.features.courses.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CourseRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    /** Display name; instructors always publish under their own account name. */
    @Size(max = 100, message = "Instructor name must be at most 100 characters")
    private String instructor;

    @NotNull(message = "Price is required")
    @PositiveOrZero(message = "Price must not be negative")
    private Double price;

    @NotNull(message = "Duration is required")
    @Positive(message = "Duration must be positive")
    private Integer duration;

    @NotBlank(message = "Level is required")
    private String level; // BEGINNER, INTERMEDIATE, ADVANCED

    @NotBlank(message = "Category is required")
    private String category; // PROGRAMMING, DESIGN, BUSINESS, MARKETING, etc.

    @Size(max = 1000)
    private String thumbnailUrl;

    @Size(max = 1000)
    private String previewVideoUrl;

    private java.util.List<String> tags;

    @Size(max = 20, message = "At most 20 learning outcomes")
    private java.util.List<@Size(max = 500) String> learningOutcomes;

    @Size(max = 20, message = "At most 20 requirements")
    private java.util.List<@Size(max = 500) String> requirements;
}
