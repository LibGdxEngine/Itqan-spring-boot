package com.itqan.edu.features.enrollments.mapper;

import com.itqan.edu.features.courses.mapper.CourseMapper;
import com.itqan.edu.features.enrollments.Enrollment;
import com.itqan.edu.features.enrollments.dto.EnrollmentRequest;
import com.itqan.edu.features.enrollments.dto.EnrollmentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { CourseMapper.class })
public interface EnrollmentMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", constant = "ACTIVE")
    @Mapping(target = "progress", constant = "0")
    @Mapping(target = "enrolledAt", ignore = true)
    @Mapping(target = "completedAt", ignore = true)
    @Mapping(target = "lastAccessedAt", ignore = true)
    @Mapping(target = "student", ignore = true) // Set manually in service
    @Mapping(target = "course", ignore = true) // Set manually in service
    Enrollment toEntity(EnrollmentRequest request);

    @Mapping(target = "studentId", source = "student.id")
    @Mapping(target = "courseId", source = "course.id")
    @Mapping(target = "course", source = "course")
    EnrollmentResponse toResponse(Enrollment enrollment);
}
