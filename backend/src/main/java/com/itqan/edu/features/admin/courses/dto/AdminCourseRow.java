package com.itqan.edu.features.admin.courses.dto;

import com.itqan.edu.features.courses.Course;

import java.time.LocalDateTime;

public record AdminCourseRow(
        Long id,
        String title,
        String instructor,
        Long ownerUserId,
        Double price,
        String level,
        String category,
        String thumbnailUrl,
        boolean active,
        int moduleCount,
        int lessonCount,
        long enrollmentCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static AdminCourseRow from(Course course, long enrollmentCount) {
        int lessons = course.getModules().stream().mapToInt(m -> m.getLessons().size()).sum();
        return new AdminCourseRow(
                course.getId(),
                course.getTitle(),
                course.getInstructor(),
                course.getOwnerUserId(),
                course.getPrice(),
                course.getLevel(),
                course.getCategory(),
                course.getThumbnailUrl(),
                Boolean.TRUE.equals(course.getActive()),
                course.getModules().size(),
                lessons,
                enrollmentCount,
                course.getCreatedAt(),
                course.getUpdatedAt());
    }
}
