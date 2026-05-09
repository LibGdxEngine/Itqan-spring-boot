package com.itqan.edu.features.courses.mapper;

import com.itqan.edu.features.courses.Module;
import com.itqan.edu.features.courses.dto.ModuleRequest;
import com.itqan.edu.features.courses.dto.ModuleResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { LessonMapper.class })
public interface ModuleMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "course.id", source = "courseId")
    @Mapping(target = "lessons", ignore = true)
    @Mapping(target = "quiz", ignore = true)
    @Mapping(target = "active", source = "active", defaultValue = "true")
    Module toEntity(ModuleRequest request);

    @Mapping(target = "courseId", source = "course.id")
    ModuleResponse toResponse(Module module);
}
