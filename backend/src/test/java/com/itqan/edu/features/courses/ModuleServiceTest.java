package com.itqan.edu.features.courses;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.dto.LessonReorderRequest;
import com.itqan.edu.features.courses.dto.LessonResponse;
import com.itqan.edu.features.courses.mapper.LessonMapper;
import com.itqan.edu.features.courses.mapper.ModuleMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModuleServiceTest {

    @Mock
    private ModuleRepository moduleRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private ModuleMapper moduleMapper;

    @Mock
    private LessonMapper lessonMapper;

    @Mock
    private CourseAccessService courseAccessService;

    @InjectMocks
    private ModuleService moduleService;

    @Test
    void reorderLessons_shouldUpdateOrderIndexesAndReturnSortedLessons() {
        Long moduleId = 11L;
        Module module = Module.builder().id(moduleId).title("Module").build();

        Lesson lesson1 = Lesson.builder().id(1L).orderIndex(1).module(module).title("L1").build();
        Lesson lesson2 = Lesson.builder().id(2L).orderIndex(2).module(module).title("L2").build();
        Lesson lesson3 = Lesson.builder().id(3L).orderIndex(3).module(module).title("L3").build();

        when(moduleRepository.findById(moduleId)).thenReturn(java.util.Optional.of(module));
        when(lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId))
                .thenReturn(new ArrayList<>(List.of(lesson1, lesson2, lesson3)));
        when(lessonRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(lessonMapper.toResponse(any(Lesson.class))).thenAnswer(invocation -> {
            Lesson lesson = invocation.getArgument(0);
            return LessonResponse.builder()
                    .id(lesson.getId())
                    .orderIndex(lesson.getOrderIndex())
                    .title(lesson.getTitle())
                    .build();
        });

        LessonReorderRequest request = new LessonReorderRequest();
        request.setLessonIds(List.of(3L, 1L, 2L));

        List<LessonResponse> reordered = moduleService.reorderLessons(moduleId, request, null);

        assertThat(reordered).hasSize(3);
        assertThat(reordered).extracting(LessonResponse::getId).containsExactly(3L, 1L, 2L);
        assertThat(reordered).extracting(LessonResponse::getOrderIndex).containsExactly(1, 2, 3);
    }

    @Test
    void reorderLessons_shouldFailWhenRequestDoesNotContainAllLessonIds() {
        Long moduleId = 77L;
        Module module = Module.builder().id(moduleId).title("Module").build();

        Lesson lesson1 = Lesson.builder().id(1L).orderIndex(1).module(module).build();
        Lesson lesson2 = Lesson.builder().id(2L).orderIndex(2).module(module).build();
        Lesson lesson3 = Lesson.builder().id(3L).orderIndex(3).module(module).build();

        when(moduleRepository.findById(moduleId)).thenReturn(java.util.Optional.of(module));
        when(lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId))
                .thenReturn(List.of(lesson1, lesson2, lesson3));

        LessonReorderRequest request = new LessonReorderRequest();
        request.setLessonIds(List.of(1L, 2L));

        assertThatThrownBy(() -> moduleService.reorderLessons(moduleId, request, null))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_LESSON_ORDER);
    }

    @Test
    void reorderLessons_shouldRejectUserWhoCannotManageCourse() {
        Long moduleId = 5L;
        Course course = Course.builder().id(9L).ownerUserId(100L).build();
        Module module = Module.builder().id(moduleId).title("Module").course(course).build();
        when(moduleRepository.findById(moduleId)).thenReturn(java.util.Optional.of(module));
        doThrow(new BusinessException(ErrorCode.FORBIDDEN))
                .when(courseAccessService).assertCanManage(any(), eq(course));

        LessonReorderRequest request = new LessonReorderRequest();
        request.setLessonIds(List.of(1L));

        assertThatThrownBy(() -> moduleService.reorderLessons(moduleId, request, null))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }
}
