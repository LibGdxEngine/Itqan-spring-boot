package com.itqan.edu.features.courses;

import com.itqan.edu.common.config.StorageProperties;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.dto.CourseRequest;
import com.itqan.edu.features.courses.dto.CourseResponse;
import com.itqan.edu.features.courses.dto.ThumbnailUploadResponse;
import com.itqan.edu.features.courses.mapper.CourseMapper;
import com.itqan.edu.features.courses.search.CourseSearchService;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.LessonEnrollmentRepository;
import com.itqan.edu.features.payments.CouponRepository;
import com.itqan.edu.features.payments.CouponRedemptionRepository;
import com.itqan.edu.features.payments.EnrollmentCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private static final long MAX_THUMBNAIL_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_THUMBNAIL_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;
    private final CourseSearchService courseSearchService;
    private final S3Client s3Client;
    private final StorageProperties storageProperties;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonEnrollmentRepository lessonEnrollmentRepository;
    private final CouponRepository couponRepository;
    private final CouponRedemptionRepository couponRedemptionRepository;
    private final EnrollmentCodeRepository enrollmentCodeRepository;

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

        List<Long> lessonIds = course.getModules().stream()
                .flatMap(m -> m.getLessons().stream())
                .map(Lesson::getId)
                .collect(Collectors.toList());
        if (!lessonIds.isEmpty()) {
            lessonEnrollmentRepository.deleteByLessonIdIn(lessonIds);
        }
        enrollmentRepository.deleteByCourseId(id);

        List<Long> couponIds = couponRepository.findByCourseIdOrderByCreatedAtDesc(id)
                .stream().map(c -> c.getId()).collect(Collectors.toList());
        if (!couponIds.isEmpty()) {
            couponRedemptionRepository.deleteByCouponIdIn(couponIds);
        }
        couponRepository.deleteByCourseId(id);
        enrollmentCodeRepository.deleteByCourseId(id);

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

    public ThumbnailUploadResponse uploadThumbnail(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Thumbnail file is required");
        }
        if (file.getSize() > MAX_THUMBNAIL_BYTES) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Thumbnail file exceeds 5MB");
        }
        String contentType = file.getContentType();
        String normalized = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        if (!ALLOWED_THUMBNAIL_TYPES.contains(normalized)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Only JPEG, PNG, or WebP images are allowed");
        }

        String objectKey = buildThumbnailObjectKey(file.getOriginalFilename());
        try {
            s3Client.putObject(PutObjectRequest.builder()
                            .bucket(storageProperties.getBucket())
                            .key(objectKey)
                            .contentType(normalized)
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException ex) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Failed to read thumbnail upload: " + ex.getMessage());
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Failed to upload thumbnail: " + ex.getMessage());
        }

        return ThumbnailUploadResponse.builder()
                .url(buildPublicUrl(objectKey))
                .objectKey(objectKey)
                .build();
    }

    private String buildThumbnailObjectKey(String filename) {
        String safeName = (filename == null ? "thumbnail.jpg" : filename).toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9.]+", "-")
                .replaceAll("^-|-$", "");
        if (safeName.isBlank()) safeName = "thumbnail.jpg";
        return "courses/thumbnails/" + UUID.randomUUID() + "-" + safeName;
    }

    private String buildPublicUrl(String objectKey) {
        String endpoint = storageProperties.getPublicEndpoint();
        if (endpoint == null) endpoint = "";
        endpoint = endpoint.replaceAll("/+$", "");
        if (storageProperties.isPathStyleAccessEnabled()) {
            return endpoint + "/" + storageProperties.getBucket() + "/" + objectKey;
        }
        return endpoint + "/" + objectKey;
    }
}
