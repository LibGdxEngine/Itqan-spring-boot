package com.itqan.edu.features.courses;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.dto.LessonRequest;
import com.itqan.edu.features.courses.dto.LessonResponse;
import com.itqan.edu.features.courses.dto.ThumbnailUploadResponse;
import com.itqan.edu.features.quizzes.QuizAttemptRepository;
import org.springframework.web.multipart.MultipartFile;
import com.itqan.edu.features.courses.mapper.LessonMapper;
import com.itqan.edu.features.enrollments.LessonEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepository;
    private final ModuleRepository moduleRepository;
    private final LessonMapper lessonMapper;
    private final LessonEnrollmentRepository lessonEnrollmentRepository;
    private final CourseAccessService courseAccessService;
    private final PublicFileStorage publicFileStorage;
    private final QuizAttemptRepository quizAttemptRepository;

    private static final long MAX_RESOURCE_BYTES = 50L * 1024 * 1024;
    private static final Set<String> ALLOWED_RESOURCE_TYPES = Set.of(
            "application/pdf",
            "application/zip",
            "application/x-zip-compressed",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "image/jpeg",
            "image/png",
            "image/webp");

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public LessonResponse createLesson(LessonRequest request, User currentUser) {
        Module module = moduleRepository.findById(request.getModuleId())
                .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));
        courseAccessService.assertCanManage(currentUser, module.getCourse());
        validateContent(request);

        Lesson lesson = lessonMapper.toEntity(request);
        lesson.setModule(module);
        if (lesson.getIsFree() == null) {
            lesson.setIsFree(false);
        }
        if (lesson.getActive() == null) {
            lesson.setActive(true);
        }
        if (StringUtils.hasText(request.getVideoUrl())) {
            lesson.setVideoStatus(LessonVideoStatus.READY);
            lesson.setVideoUploadedAt(LocalDateTime.now());
        } else {
            lesson.setVideoStatus(LessonVideoStatus.PENDING);
            lesson.setVideoUploadedAt(null);
        }
        lesson = lessonRepository.save(lesson);

        return lessonMapper.toResponse(lesson);
    }

    @Transactional(readOnly = true)
    public LessonResponse getLessonById(Long id, User currentUser) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        courseAccessService.assertCanViewLesson(currentUser, lesson);
        return lessonMapper.toResponse(lesson);
    }

    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsByModuleId(Long moduleId, User currentUser) {
        return lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId).stream()
                .filter(lesson -> !Boolean.FALSE.equals(lesson.getActive())
                        || courseAccessService.canManage(currentUser, lesson.getModule().getCourse()))
                .map(lesson -> courseAccessService.canViewLesson(currentUser, lesson)
                        ? lessonMapper.toResponse(lesson)
                        : courseAccessService.redact(lessonMapper.toResponse(lesson)))
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public LessonResponse updateLesson(Long id, LessonRequest request, User currentUser) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        courseAccessService.assertCanManage(currentUser, lesson.getModule().getCourse());
        validateContent(request);

        if (!lesson.getModule().getId().equals(request.getModuleId())) {
            Module newModule = moduleRepository.findById(request.getModuleId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));
            courseAccessService.assertCanManage(currentUser, newModule.getCourse());
            lesson.setModule(newModule);
        }

        lesson.setTitle(request.getTitle());
        lesson.setDescription(request.getDescription());
        lesson.setType(request.getType());
        lesson.setVideoUrl(request.getVideoUrl());
        if (StringUtils.hasText(request.getVideoUrl())) {
            lesson.setVideoStatus(LessonVideoStatus.READY);
            lesson.setVideoObjectKey(null);
            lesson.setVideoMimeType(null);
            lesson.setVideoSizeBytes(null);
            lesson.setVideoUploadedAt(LocalDateTime.now());
        } else if (!StringUtils.hasText(lesson.getVideoObjectKey())) {
            lesson.setVideoStatus(LessonVideoStatus.PENDING);
            lesson.setVideoMimeType(null);
            lesson.setVideoSizeBytes(null);
            lesson.setVideoUploadedAt(null);
        }
        lesson.setContent(request.getContent());
        lesson.setResourceUrl(request.getResourceUrl());
        lesson.setDuration(request.getDuration());
        lesson.setOrderIndex(request.getOrderIndex());

        if (request.getIsFree() != null) {
            lesson.setIsFree(request.getIsFree());
        }
        if (request.getActive() != null) {
            lesson.setActive(request.getActive());
        }

        lesson = lessonRepository.save(lesson);
        return lessonMapper.toResponse(lesson);
    }

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public void deleteLesson(Long id, User currentUser) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        courseAccessService.assertCanManage(currentUser, lesson.getModule().getCourse());
        if (lesson.getQuiz() != null) {
            quizAttemptRepository.deleteByQuiz_IdIn(List.of(lesson.getQuiz().getId()));
        }
        lessonEnrollmentRepository.deleteByLessonId(id);
        lessonRepository.delete(lesson);
    }

    public ThumbnailUploadResponse uploadResource(MultipartFile file) {
        return publicFileStorage.upload(file, "courses/resources", ALLOWED_RESOURCE_TYPES,
                MAX_RESOURCE_BYTES, "Resource");
    }

    /** Type-specific rules, plus: any link a student will open must be http(s). */
    private static void validateContent(LessonRequest request) {
        if (!isHttpUrlOrBlank(request.getVideoUrl()) || !isHttpUrlOrBlank(request.getResourceUrl())) {
            throw new BusinessException(ErrorCode.INVALID_LESSON_CONTENT, "Links must start with http:// or https://");
        }
        if (request.getType() == LessonType.RESOURCE && !StringUtils.hasText(request.getResourceUrl())) {
            throw new BusinessException(ErrorCode.INVALID_LESSON_CONTENT, "Resource lessons need a file or link");
        }
    }

    private static boolean isHttpUrlOrBlank(String value) {
        if (!StringUtils.hasText(value)) {
            return true;
        }
        String lower = value.trim().toLowerCase(java.util.Locale.ROOT);
        return lower.startsWith("https://") || lower.startsWith("http://");
    }
}
