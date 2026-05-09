package com.itqan.edu.features.courses;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.dto.LessonRequest;
import com.itqan.edu.features.courses.dto.LessonResponse;
import com.itqan.edu.features.courses.mapper.LessonMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepository;
    private final ModuleRepository moduleRepository;
    private final LessonMapper lessonMapper;

    @Transactional
    public LessonResponse createLesson(LessonRequest request) {
        Module module = moduleRepository.findById(request.getModuleId())
                .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));

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

    public LessonResponse getLessonById(Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        return lessonMapper.toResponse(lesson);
    }

    public List<LessonResponse> getLessonsByModuleId(Long moduleId) {
        return lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId).stream()
                .map(lessonMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public LessonResponse updateLesson(Long id, LessonRequest request) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));

        if (!lesson.getModule().getId().equals(request.getModuleId())) {
            Module newModule = moduleRepository.findById(request.getModuleId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.MODULE_NOT_FOUND));
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

    @Transactional
    public void deleteLesson(Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        lessonRepository.delete(lesson);
    }
}
