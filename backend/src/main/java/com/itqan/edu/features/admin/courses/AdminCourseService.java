package com.itqan.edu.features.admin.courses;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.admin.courses.dto.AdminCourseRow;
import com.itqan.edu.features.audit.AuditLogService;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.courses.search.CourseSearchService;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminCourseService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseSearchService courseSearchService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<AdminCourseRow> search(String query, Boolean active, String category, Pageable pageable) {
        return courseRepository.findAll(filter(query, active, category), pageable)
                .map(course -> AdminCourseRow.from(course, enrollmentRepository.countByCourseId(course.getId())));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> options() {
        return courseRepository.findAll(Sort.by("title")).stream()
                .map(course -> {
                    Map<String, Object> option = new LinkedHashMap<>();
                    option.put("id", course.getId());
                    option.put("title", course.getTitle());
                    option.put("price", course.getPrice());
                    option.put("active", course.getActive());
                    return option;
                })
                .toList();
    }

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public AdminCourseRow setActive(Long courseId, boolean active) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        course.setActive(active);
        course = courseRepository.save(course);
        if (active) {
            courseSearchService.indexCourse(course);
        } else {
            courseSearchService.removeCourse(courseId);
        }
        auditLogService.recordSuccess(active ? "COURSE_PUBLISHED" : "COURSE_UNPUBLISHED", "COURSE",
                String.valueOf(courseId), Map.of("title", course.getTitle()));
        return AdminCourseRow.from(course, enrollmentRepository.countByCourseId(courseId));
    }

    private Specification<Course> filter(String query, Boolean active, String category) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(query)) {
                String like = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("instructor")), like)));
            }
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            if (StringUtils.hasText(category)) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
