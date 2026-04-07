package com.itqan.edu.features.courses;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.dto.LessonReorderRequest;
import com.itqan.edu.features.courses.dto.LessonResponse;
import com.itqan.edu.features.courses.dto.ModuleRequest;
import com.itqan.edu.features.courses.dto.ModuleResponse;
import com.itqan.edu.features.courses.mapper.LessonMapper;
import com.itqan.edu.features.courses.mapper.ModuleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final ModuleMapper moduleMapper;
    private final LessonMapper lessonMapper;

    @Transactional
    public ModuleResponse createModule(ModuleRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        Module module = moduleMapper.toEntity(request);
        module.setCourse(course);
        module = moduleRepository.save(module);

        return moduleMapper.toResponse(module);
    }

    public ModuleResponse getModuleById(Long id) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));
        return moduleMapper.toResponse(module);
    }

    public List<ModuleResponse> getModulesByCourseId(Long courseId) {
        return moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId).stream()
                .map(moduleMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ModuleResponse updateModule(Long id, ModuleRequest request) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));

        if (!module.getCourse().getId().equals(request.getCourseId())) {
            // Optional: Allow moving module between courses, or forbid it.
            // For now, let's just update fields. Changing courseId might require fetching
            // new course.
            Course newCourse = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
            module.setCourse(newCourse);
        }

        module.setTitle(request.getTitle());
        module.setDescription(request.getDescription());
        module.setOrderIndex(request.getOrderIndex());
        if (request.getActive() != null) {
            module.setActive(request.getActive());
        }

        module = moduleRepository.save(module);
        return moduleMapper.toResponse(module);
    }

    @Transactional
    public void deleteModule(Long id) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));
        moduleRepository.delete(module);
    }

    @Transactional
    public List<LessonResponse> reorderLessons(Long moduleId, LessonReorderRequest request) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));

        List<Lesson> lessons = lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId);
        if (lessons.isEmpty()) {
            return List.of();
        }

        List<Long> requestedIds = request.getLessonIds();
        Set<Long> uniqueRequestedIds = new HashSet<>(requestedIds);
        if (requestedIds.size() != uniqueRequestedIds.size()) {
            throw new BusinessException(ErrorCode.INVALID_LESSON_ORDER, "Lesson IDs must be unique");
        }

        if (requestedIds.size() != lessons.size()) {
            throw new BusinessException(ErrorCode.INVALID_LESSON_ORDER, Map.of(
                    "expectedCount", lessons.size(),
                    "actualCount", requestedIds.size()));
        }

        Set<Long> existingIds = lessons.stream()
                .map(Lesson::getId)
                .collect(Collectors.toSet());
        if (!existingIds.equals(uniqueRequestedIds)) {
            throw new BusinessException(ErrorCode.INVALID_LESSON_ORDER, "Request must include exactly all module lesson IDs");
        }

        Map<Long, Lesson> lessonsById = lessons.stream()
                .collect(Collectors.toMap(Lesson::getId, lesson -> lesson));

        for (int index = 0; index < requestedIds.size(); index++) {
            Long lessonId = requestedIds.get(index);
            Lesson lesson = lessonsById.get(lessonId);
            lesson.setOrderIndex(index + 1);
            lesson.setModule(module);
        }

        List<Lesson> updatedLessons = lessonRepository.saveAll(lessons);
        return updatedLessons.stream()
                .sorted((a, b) -> Integer.compare(a.getOrderIndex(), b.getOrderIndex()))
                .map(lessonMapper::toResponse)
                .collect(Collectors.toList());
    }
}
