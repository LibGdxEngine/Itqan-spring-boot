package com.itqan.edu.features.courses.mapper;

import com.itqan.edu.features.courses.Lesson;
import com.itqan.edu.features.courses.dto.LessonRequest;
import com.itqan.edu.features.courses.dto.LessonResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LessonMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "module.id", source = "moduleId")
    Lesson toEntity(LessonRequest request);

    @Mapping(target = "moduleId", source = "module.id")
    LessonResponse toResponse(Lesson lesson);
}
