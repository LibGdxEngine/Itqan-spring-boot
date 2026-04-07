package com.itqan.edu.features.courses.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class LessonReorderRequest {

    @NotEmpty(message = "Lesson IDs are required")
    private List<Long> lessonIds;
}
