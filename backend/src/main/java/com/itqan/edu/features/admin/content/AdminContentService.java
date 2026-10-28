package com.itqan.edu.features.admin.content;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.admin.content.dto.ModuleReorderRequest;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.courses.Lesson;
import com.itqan.edu.features.courses.LessonRepository;
import com.itqan.edu.features.courses.Module;
import com.itqan.edu.features.courses.ModuleRepository;
import com.itqan.edu.features.quizzes.Question;
import com.itqan.edu.features.quizzes.QuestionOption;
import com.itqan.edu.features.quizzes.Quiz;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminContentService {

    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public List<Module> reorderModules(Long courseId, ModuleReorderRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        List<Module> modules = course.getModules();
        Map<Long, Module> moduleMap = modules.stream()
                .collect(Collectors.toMap(Module::getId, m -> m));

        // Validate all moduleIds belong to this course
        for (Long moduleId : request.getModuleIds()) {
            if (!moduleMap.containsKey(moduleId)) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                        "Module ID " + moduleId + " does not belong to course " + courseId);
            }
        }

        if (request.getModuleIds().size() != modules.size()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Must provide all module IDs for the course");
        }

        // Update order indexes
        List<Module> reordered = new ArrayList<>();
        for (int i = 0; i < request.getModuleIds().size(); i++) {
            Module module = moduleMap.get(request.getModuleIds().get(i));
            module.setOrderIndex(i + 1);
            reordered.add(module);
        }

        moduleRepository.saveAll(reordered);
        return reordered;
    }

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public Course duplicateCourse(Long courseId, Long adminUserId) {
        Course original = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        Course copy = Course.builder()
                .title(original.getTitle() + " (Copy)")
                .description(original.getDescription())
                .instructor(original.getInstructor())
                .ownerUserId(adminUserId)
                .price(original.getPrice())
                .duration(original.getDuration())
                .level(original.getLevel())
                .active(false)
                .category(original.getCategory())
                .thumbnailUrl(original.getThumbnailUrl())
                .tags(new ArrayList<>(original.getTags()))
                .build();

        copy = courseRepository.save(copy);

        // Deep copy modules, lessons, quizzes
        for (Module origModule : original.getModules()) {
            Module copyModule = Module.builder()
                    .title(origModule.getTitle())
                    .description(origModule.getDescription())
                    .orderIndex(origModule.getOrderIndex())
                    .active(origModule.getActive())
                    .course(copy)
                    .build();

            // Deep copy lessons
            List<Lesson> copyLessons = new ArrayList<>();
            for (Lesson origLesson : origModule.getLessons()) {
                Lesson copyLesson = Lesson.builder()
                        .title(origLesson.getTitle())
                        .description(origLesson.getDescription())
                        .type(origLesson.getType())
                        .videoUrl(origLesson.getVideoUrl())
                        .videoObjectKey(origLesson.getVideoObjectKey())
                        .videoMimeType(origLesson.getVideoMimeType())
                        .videoSizeBytes(origLesson.getVideoSizeBytes())
                        .videoStatus(origLesson.getVideoStatus())
                        .videoUploadedAt(origLesson.getVideoUploadedAt())
                        .content(origLesson.getContent())
                        .resourceUrl(origLesson.getResourceUrl())
                        .duration(origLesson.getDuration())
                        .orderIndex(origLesson.getOrderIndex())
                        .isFree(origLesson.getIsFree())
                        .active(origLesson.getActive())
                        .module(copyModule)
                        .build();
                copyLessons.add(copyLesson);
            }
            copyModule.setLessons(copyLessons);

            // Deep copy module quiz if exists
            if (origModule.getQuiz() != null) {
                Quiz copyQuiz = duplicateQuiz(origModule.getQuiz());
                copyQuiz.setModule(copyModule);
                copyQuiz.setLesson(null);
                copyModule.setQuiz(copyQuiz);
            }

            copy.getModules().add(copyModule);
        }

        // Copy lesson-level quizzes (after lessons are set up)
        for (int mi = 0; mi < original.getModules().size(); mi++) {
            Module origModule = original.getModules().get(mi);
            Module copyModule = copy.getModules().get(mi);
            for (int li = 0; li < origModule.getLessons().size(); li++) {
                Lesson origLesson = origModule.getLessons().get(li);
                Lesson copyLesson = copyModule.getLessons().get(li);
                if (origLesson.getQuiz() != null) {
                    Quiz copyQuiz = duplicateQuiz(origLesson.getQuiz());
                    copyQuiz.setLesson(copyLesson);
                    copyQuiz.setModule(null);
                    copyLesson.setQuiz(copyQuiz);
                }
            }
        }

        copy = courseRepository.save(copy);
        log.info("Course {} duplicated as {} by admin {}", courseId, copy.getId(), adminUserId);
        return copy;
    }

    private Quiz duplicateQuiz(Quiz original) {
        Quiz copy = Quiz.builder()
                .title(original.getTitle())
                .description(original.getDescription())
                .passingScore(original.getPassingScore())
                .timeLimit(original.getTimeLimit())
                .attemptsAllowed(original.getAttemptsAllowed())
                .showCorrectAnswers(original.getShowCorrectAnswers())
                .active(original.getActive())
                .build();

        List<Question> copyQuestions = new ArrayList<>();
        for (Question origQ : original.getQuestions()) {
            Question copyQ = Question.builder()
                    .questionText(origQ.getQuestionText())
                    .questionType(origQ.getQuestionType())
                    .points(origQ.getPoints())
                    .orderIndex(origQ.getOrderIndex())
                    .quiz(copy)
                    .correctAnswer(origQ.getCorrectAnswer())
                    .build();

            List<QuestionOption> copyOptions = new ArrayList<>();
            for (QuestionOption origOpt : origQ.getOptions()) {
                QuestionOption copyOpt = QuestionOption.builder()
                        .optionText(origOpt.getOptionText())
                        .isCorrect(origOpt.getIsCorrect())
                        .orderIndex(origOpt.getOrderIndex())
                        .question(copyQ)
                        .build();
                copyOptions.add(copyOpt);
            }
            copyQ.setOptions(copyOptions);
            copyQuestions.add(copyQ);
        }
        copy.setQuestions(copyQuestions);
        return copy;
    }
}
