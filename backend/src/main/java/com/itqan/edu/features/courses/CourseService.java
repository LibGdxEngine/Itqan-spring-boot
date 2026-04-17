package com.itqan.edu.features.courses;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.dto.CourseRequest;
import com.itqan.edu.features.courses.dto.CourseResponse;
import com.itqan.edu.features.courses.mapper.CourseMapper;
import com.itqan.edu.features.courses.search.CourseSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;
    private final CourseSearchService courseSearchService;

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public CourseResponse createCourse(CourseRequest request, User currentUser) {
        Course course = courseMapper.toEntity(request);
        course.setActive(true);
        course.setOwnerUserId(currentUser.getId());
        if (currentUser.getRole() == User.Role.INSTRUCTOR) {
            String fullName = (currentUser.getFirstName() + " " + currentUser.getLastName()).trim();
            course.setInstructor(fullName.isBlank() ? request.getInstructor() : fullName);
        }
        course = courseRepository.save(course);
        courseSearchService.indexCourse(course);
        return courseMapper.toResponse(course);
    }

    @Cacheable(value = "courses", key = "#id")
    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        return courseMapper.toResponse(course);
    }

    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());
    }

    public Page<CourseResponse> getAllCourses(Pageable pageable) {
        return courseRepository.findAll(pageable)
                .map(courseMapper::toResponse);
    }

    @Cacheable(value = "courses", key = "'active-list'")
    public List<CourseResponse> getActiveCourses() {
        return courseRepository.findByActiveTrue().stream()
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "courses", key = "'active-page-' + #pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()")
    public Page<CourseResponse> getActiveCourses(Pageable pageable) {
        return courseRepository.findByActiveTrue(pageable)
                .map(courseMapper::toResponse);
    }

    public List<CourseResponse> getMyCourses(User currentUser) {
        List<Course> courses = currentUser.getRole() == User.Role.ADMIN
                ? courseRepository.findAll()
                : courseRepository.findByOwnerUserId(currentUser.getId());
        return courses.stream()
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());
    }

    public Page<CourseResponse> getMyCourses(User currentUser, Pageable pageable) {
        return currentUser.getRole() == User.Role.ADMIN
                ? courseRepository.findAll(pageable).map(courseMapper::toResponse)
                : courseRepository.findByOwnerUserId(currentUser.getId(), pageable).map(courseMapper::toResponse);
    }

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest request, User currentUser) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        enforceOwnerScopeIfInstructor(currentUser, course);

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setInstructor(request.getInstructor());
        course.setPrice(request.getPrice());
        course.setDuration(request.getDuration());
        course.setLevel(request.getLevel());
        course.setCategory(request.getCategory());
        course.setThumbnailUrl(request.getThumbnailUrl());
        course.setTags(request.getTags());

        course = courseRepository.save(course);
        courseSearchService.indexCourse(course);
        return courseMapper.toResponse(course);
    }

    public List<CourseResponse> searchAndFilterCourses(String query, String level, String category,
            Double minPrice, Double maxPrice, String sort) {
        return courseSearchService.search(query, level, category, minPrice, maxPrice, sort);
    }

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public void deleteCourse(Long id, User currentUser) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        enforceOwnerScopeIfInstructor(currentUser, course);
        courseRepository.delete(course);
        courseSearchService.removeCourse(id);
    }

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public CourseResponse deactivateCourse(Long id, User currentUser) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        enforceOwnerScopeIfInstructor(currentUser, course);
        course.setActive(false);
        course = courseRepository.save(course);
        courseSearchService.removeCourse(id);
        return courseMapper.toResponse(course);
    }

    private void enforceOwnerScopeIfInstructor(User currentUser, Course course) {
        if (currentUser.getRole() != User.Role.INSTRUCTOR) {
            return;
        }
        if (course.getOwnerUserId() == null || !course.getOwnerUserId().equals(currentUser.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }
}
