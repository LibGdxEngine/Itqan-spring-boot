package com.itqan.edu.features.courses;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.dto.LessonReorderRequest;
import com.itqan.edu.features.courses.dto.LessonResponse;
import com.itqan.edu.features.courses.dto.ModuleRequest;
import com.itqan.edu.features.courses.dto.ModuleResponse;
import com.itqan.edu.features.courses.mapper.LessonMapper;
import com.itqan.edu.features.courses.mapper.ModuleMapper;
import com.itqan.edu.features.enrollments.LessonEnrollmentRepository;
import com.itqan.edu.features.quizzes.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
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
    private final CourseAccessService courseAccessService;
    private final QuizAttemptRepository quizAttemptRepository;
    private final LessonEnrollmentRepository lessonEnrollmentRepository;

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public ModuleResponse createModule(ModuleRequest request, User currentUser) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        courseAccessService.assertCanManage(currentUser, course);

        Module module = moduleMapper.toEntity(request);
        module.setCourse(course);
        module = moduleRepository.save(module);

        return moduleMapper.toResponse(module);
    }

    @Transactional(readOnly = true)
    public ModuleResponse getModuleById(Long id, User currentUser) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));
        ModuleResponse response = moduleMapper.toResponse(module);
        return courseAccessService.canViewCourseContent(currentUser, module.getCourse())
                ? response
                : courseAccessService.redact(response);
    }

    @Transactional(readOnly = true)
    public List<ModuleResponse> getModulesByCourseId(Long courseId, User currentUser) {
        List<Module> modules = moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        boolean fullAccess = !modules.isEmpty()
                && courseAccessService.canViewCourseContent(currentUser, modules.get(0).getCourse());
        return modules.stream()
                .map(moduleMapper::toResponse)
                .map(response -> fullAccess ? response : courseAccessService.redact(response))
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public ModuleResponse updateModule(Long id, ModuleRequest request, User currentUser) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));
        courseAccessService.assertCanManage(currentUser, module.getCourse());

        if (!module.getCourse().getId().equals(request.getCourseId())) {
            Course newCourse = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
            courseAccessService.assertCanManage(currentUser, newCourse);
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

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public void deleteModule(Long id, User currentUser) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));
        courseAccessService.assertCanManage(currentUser, module.getCourse());

        List<Long> quizIds = new java.util.ArrayList<>();
        if (module.getQuiz() != null) {
            quizIds.add(module.getQuiz().getId());
        }
        module.getLessons().stream()
                .map(Lesson::getQuiz)
                .filter(java.util.Objects::nonNull)
                .forEach(quiz -> quizIds.add(quiz.getId()));
        if (!quizIds.isEmpty()) {
            quizAttemptRepository.deleteByQuiz_IdIn(quizIds);
        }
        List<Long> lessonIds = module.getLessons().stream().map(Lesson::getId).toList();
        if (!lessonIds.isEmpty()) {
            lessonEnrollmentRepository.deleteByLessonIdIn(lessonIds);
        }
        moduleRepository.delete(module);
    }

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public List<LessonResponse> reorderLessons(Long moduleId, LessonReorderRequest request, User currentUser) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));
        courseAccessService.assertCanManage(currentUser, module.getCourse());

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
