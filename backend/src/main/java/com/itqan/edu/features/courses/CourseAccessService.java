package com.itqan.edu.features.courses;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.dto.CourseResponse;
import com.itqan.edu.features.courses.dto.LessonResponse;
import com.itqan.edu.features.courses.dto.ModuleResponse;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.students.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Central place for "who may see / change which course content" decisions.
 *
 * <ul>
 *   <li>Manage (edit structure, upload video): ADMIN, or the INSTRUCTOR who owns the course.</li>
 *   <li>View lesson content (video, text, resources): managers, students with a non-dropped
 *       enrollment, or anyone authenticated for lessons flagged {@code isFree}.</li>
 * </ul>
 *
 * Public course endpoints return a redacted copy of the curriculum (titles, durations, flags)
 * so paid content never leaks through catalog APIs.
 */
@Service
@RequiredArgsConstructor
public class CourseAccessService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;

    public boolean canManage(User user, Course course) {
        return course != null && canManage(user, course.getOwnerUserId());
    }

    private boolean canManage(User user, Long courseOwnerUserId) {
        if (user == null) {
            return false;
        }
        if (user.getRole() == User.Role.ADMIN) {
            return true;
        }
        return user.getRole() == User.Role.INSTRUCTOR
                && courseOwnerUserId != null
                && courseOwnerUserId.equals(user.getId());
    }

    public void assertCanManage(User user, Course course) {
        if (!canManage(user, course)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    public boolean isEnrolled(User user, Long courseId) {
        if (user == null || courseId == null) {
            return false;
        }
        return studentRepository.findByEmail(user.getEmail())
                .flatMap(student -> enrollmentRepository.findByStudentIdAndCourseId(student.getId(), courseId))
                .filter(enrollment -> enrollment.getStatus() != EnrollmentStatus.DROPPED)
                .isPresent();
    }

    public boolean canViewCourseContent(User user, Course course) {
        return canManage(user, course) || isEnrolled(user, course.getId());
    }

    /** Returns the full course for managers and enrolled students, a redacted copy otherwise. */
    public CourseResponse forViewer(CourseResponse course, User user) {
        if (course == null) {
            return null;
        }
        if (canManage(user, course.getOwnerUserId())) {
            return course;
        }
        CourseResponse visible = withoutHidden(course);
        return isEnrolled(user, course.getId()) ? visible : redact(visible);
    }

    /** Copy without the modules and lessons the instructor marked as hidden. */
    private CourseResponse withoutHidden(CourseResponse course) {
        if (course.getModules() == null) {
            return course;
        }
        return course.toBuilder()
                .modules(course.getModules().stream()
                        .filter(module -> !Boolean.FALSE.equals(module.getActive()))
                        .map(module -> module.getLessons() == null ? module : module.toBuilder()
                                .lessons(module.getLessons().stream()
                                        .filter(lesson -> !Boolean.FALSE.equals(lesson.getActive()))
                                        .toList())
                                .build())
                        .toList())
                .build();
    }

    /** Unpublished courses stay reachable for their managers and already-enrolled students. */
    public boolean canSeeDraft(User user, CourseResponse course) {
        return canManage(user, course.getOwnerUserId()) || isEnrolled(user, course.getId());
    }

    /** For catalog listings: only managers of a course see its full content. */
    public List<CourseResponse> forCatalog(List<CourseResponse> courses, User user) {
        return courses.stream()
                .map(c -> canManage(user, c.getOwnerUserId()) ? c : redact(withoutHidden(c)))
                .toList();
    }

    public boolean canViewLesson(User user, Lesson lesson) {
        if (Boolean.FALSE.equals(lesson.getActive())) {
            return canManage(user, lesson.getModule().getCourse());
        }
        if (Boolean.TRUE.equals(lesson.getIsFree()) && user != null) {
            return true;
        }
        return canViewCourseContent(user, lesson.getModule().getCourse());
    }

    public void assertCanViewLesson(User user, Lesson lesson) {
        if (!canViewLesson(user, lesson)) {
            throw new BusinessException(ErrorCode.COURSE_ACCESS_DENIED);
        }
    }

    /**
     * Returns a copy of the course with paid lesson content removed. Never mutates the input,
     * which may be a shared cached instance.
     */
    public CourseResponse redact(CourseResponse course) {
        if (course == null) {
            return null;
        }
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .instructor(course.getInstructor())
                .ownerUserId(course.getOwnerUserId())
                .price(course.getPrice())
                .duration(course.getDuration())
                .level(course.getLevel())
                .category(course.getCategory())
                .thumbnailUrl(course.getThumbnailUrl())
                .previewVideoUrl(course.getPreviewVideoUrl())
                .learningOutcomes(course.getLearningOutcomes())
                .requirements(course.getRequirements())
                .tags(course.getTags())
                .active(course.getActive())
                .modules(course.getModules() == null ? null
                        : course.getModules().stream().map(this::redact).toList())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }

    public ModuleResponse redact(ModuleResponse module) {
        if (module == null) {
            return null;
        }
        return ModuleResponse.builder()
                .id(module.getId())
                .title(module.getTitle())
                .description(module.getDescription())
                .orderIndex(module.getOrderIndex())
                .active(module.getActive())
                .courseId(module.getCourseId())
                .lessons(module.getLessons() == null ? null
                        : module.getLessons().stream().map(this::redact).toList())
                .createdAt(module.getCreatedAt())
                .updatedAt(module.getUpdatedAt())
                .build();
    }

    public LessonResponse redact(LessonResponse lesson) {
        if (lesson == null) {
            return null;
        }
        return LessonResponse.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .type(lesson.getType())
                .videoStatus(lesson.getVideoStatus())
                .duration(lesson.getDuration())
                .orderIndex(lesson.getOrderIndex())
                .isFree(lesson.getIsFree())
                .active(lesson.getActive())
                .moduleId(lesson.getModuleId())
                .quizId(lesson.getQuizId())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }
}
