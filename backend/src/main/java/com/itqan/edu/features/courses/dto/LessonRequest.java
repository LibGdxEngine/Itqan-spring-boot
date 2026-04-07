package com.itqan.edu.features.courses.dto;

import com.itqan.edu.features.courses.LessonType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Type is required")
    private LessonType type;

    private String videoUrl;

    private String content;

    private String resourceUrl;

    @Min(value = 0, message = "Duration must be positive")
    private Integer duration;

    @NotNull(message = "Order index is required")
    private Integer orderIndex;

    private Boolean isFree;

    private Boolean active;

    @NotNull(message = "Module ID is required")
    private Long moduleId;
}
