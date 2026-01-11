package com.itqan.edu.features.students.mapper;

import com.itqan.edu.features.students.Student;
import com.itqan.edu.features.students.dto.StudentRequest;
import com.itqan.edu.features.students.dto.StudentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface StudentMapper {
    
    StudentMapper INSTANCE = Mappers.getMapper(StudentMapper.class);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Student toEntity(StudentRequest studentRequest);

    StudentResponse toResponse(Student student);
}
