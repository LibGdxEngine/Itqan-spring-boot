package com.itqan.edu.features.courses.mapper;

import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.dto.CourseRequest;
import com.itqan.edu.features.courses.dto.CourseResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface CourseMapper {
    
    CourseMapper INSTANCE = Mappers.getMapper(CourseMapper.class);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Course toEntity(CourseRequest courseRequest);

    CourseResponse toResponse(Course course);
}
