package com.itqan.edu.features.courses;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.dto.CourseRequest;
import com.itqan.edu.features.courses.dto.CurriculumOrderRequest;
import com.itqan.edu.features.courses.dto.CourseResponse;
import com.itqan.edu.features.courses.dto.ThumbnailUploadResponse;
import com.itqan.edu.features.courses.mapper.CourseMapper;
import com.itqan.edu.features.courses.search.CourseSearchService;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.LessonEnrollmentRepository;
import com.itqan.edu.features.payments.CouponRepository;
import com.itqan.edu.features.payments.CouponRedemptionRepository;
import com.itqan.edu.features.payments.EnrollmentCodeRepository;
import com.itqan.edu.features.quizzes.Quiz;
import com.itqan.edu.features.quizzes.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CourseService {

    private static final long MAX_THUMBNAIL_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_THUMBNAIL_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;
    private final CourseSearchService courseSearchService;
    private final PublicFileStorage publicFileStorage;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonEnrollmentRepository lessonEnrollmentRepository;
    private final CouponRepository couponRepository;
    private final CouponRedemptionRepository couponRedemptionRepository;
    private final EnrollmentCodeRepository enrollmentCodeRepository;
    private final CourseAccessService courseAccessService;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final com.itqan.edu.features.reviews.CourseReviewRepository reviewRepository;
    private final com.itqan.edu.features.wishlist.WishlistRepository wishlistRepository;
    private final com.itqan.edu.features.certificates.CertificateRepository certificateRepository;

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public CourseResponse createCourse(CourseRequest request, User currentUser) {
        Course course = courseMapper.toEntity(request);
        // New courses start as drafts; the owner publishes once the curriculum is ready.
        course.setActive(false);
        course.setOwnerUserId(currentUser.getId());
        course.setInstructor(resolveInstructorName(request, currentUser, null));
        course.setPreviewVideoUrl(blankToNull(request.getPreviewVideoUrl()));
        course.setTags(cleanList(request.getTags()));
        course.setLearningOutcomes(cleanList(request.getLearningOutcomes()));
        course.setRequirements(cleanList(request.getRequirements()));
        course = courseRepository.save(course);
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

        courseAccessService.assertCanManage(currentUser, course);

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setInstructor(resolveInstructorName(request, currentUser, course.getInstructor()));
        course.setPrice(request.getPrice());
        course.setDuration(request.getDuration());
        course.setLevel(request.getLevel());
        course.setCategory(request.getCategory());
        course.setThumbnailUrl(request.getThumbnailUrl());
        course.setPreviewVideoUrl(blankToNull(request.getPreviewVideoUrl()));
        replaceList(course.getTags(), request.getTags());
        replaceList(course.getLearningOutcomes(), request.getLearningOutcomes());
        replaceList(course.getRequirements(), request.getRequirements());

        course = courseRepository.save(course);
        if (Boolean.TRUE.equals(course.getActive())) {
            courseSearchService.indexCourse(course);
        }
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
        courseAccessService.assertCanManage(currentUser, course);

        List<Long> quizIds = course.getModules().stream()
                .flatMap(m -> Stream.concat(
                        Stream.ofNullable(m.getQuiz()),
                        m.getLessons().stream().map(Lesson::getQuiz).filter(Objects::nonNull)))
                .map(Quiz::getId)
                .collect(Collectors.toList());
        if (!quizIds.isEmpty()) {
            quizAttemptRepository.deleteByQuiz_IdIn(quizIds);
        }

        List<Long> lessonIds = course.getModules().stream()
                .flatMap(m -> m.getLessons().stream())
                .map(Lesson::getId)
                .collect(Collectors.toList());
        if (!lessonIds.isEmpty()) {
            lessonEnrollmentRepository.deleteByLessonIdIn(lessonIds);
        }
        enrollmentRepository.deleteByCourseId(id);
        reviewRepository.deleteByCourseId(id);
        wishlistRepository.deleteByCourseId(id);
        certificateRepository.deleteByCourseId(id);

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
        courseAccessService.assertCanManage(currentUser, course);
        course.setActive(false);
        course = courseRepository.save(course);
        courseSearchService.removeCourse(id);
        return courseMapper.toResponse(course);
    }

    /** Makes a draft visible in the catalog. Requires at least one active lesson. */
    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public CourseResponse publishCourse(Long id, User currentUser) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        courseAccessService.assertCanManage(currentUser, course);
        if (lessonRepository.countByModuleCourseIdAndActiveTrue(id) == 0) {
            throw new BusinessException(ErrorCode.COURSE_NOT_READY);
        }
        course.setActive(true);
        course = courseRepository.save(course);
        courseSearchService.indexCourse(course);
        return courseMapper.toResponse(course);
    }

    /**
     * Applies a full curriculum layout in one go: module order, lesson order inside each
     * module, and lessons moved between modules. The request must list every module and every
     * lesson of the course exactly once.
     */
    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public void reorderCurriculum(Long courseId, CurriculumOrderRequest request, User currentUser) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        courseAccessService.assertCanManage(currentUser, course);

        Map<Long, Module> modulesById = moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId).stream()
                .collect(Collectors.toMap(Module::getId, m -> m));
        Map<Long, Lesson> lessonsById = lessonRepository.findByModuleCourseId(courseId).stream()
                .collect(Collectors.toMap(Lesson::getId, l -> l));

        List<CurriculumOrderRequest.ModuleOrder> order = request.getModules();
        Set<Long> requestedModuleIds = new HashSet<>();
        Set<Long> requestedLessonIds = new HashSet<>();
        int requestedLessonCount = 0;
        for (CurriculumOrderRequest.ModuleOrder entry : order) {
            requestedModuleIds.add(entry.getModuleId());
            requestedLessonIds.addAll(entry.lessonIdsOrEmpty());
            requestedLessonCount += entry.lessonIdsOrEmpty().size();
        }
        if (requestedModuleIds.size() != order.size() || !requestedModuleIds.equals(modulesById.keySet())
                || requestedLessonIds.size() != requestedLessonCount
                || !requestedLessonIds.equals(lessonsById.keySet())) {
            throw new BusinessException(ErrorCode.INVALID_LESSON_ORDER,
                    "Request must list every module and lesson of the course exactly once");
        }

        // Only the owning side (lesson.module) changes; the module.lessons collections are left
        // untouched so orphan removal never deletes a lesson that moved between modules.
        for (int m = 0; m < order.size(); m++) {
            CurriculumOrderRequest.ModuleOrder entry = order.get(m);
            Module module = modulesById.get(entry.getModuleId());
            module.setOrderIndex(m + 1);
            List<Long> ids = entry.lessonIdsOrEmpty();
            for (int l = 0; l < ids.size(); l++) {
                Lesson lesson = lessonsById.get(ids.get(l));
                lesson.setModule(module);
                lesson.setOrderIndex(l + 1);
            }
        }
        moduleRepository.saveAll(modulesById.values());
        lessonRepository.saveAll(lessonsById.values());
    }

    private static String resolveInstructorName(CourseRequest request, User currentUser, String fallback) {
        String accountName = (nullToEmpty(currentUser.getFirstName()) + " " + nullToEmpty(currentUser.getLastName())).trim();
        if (currentUser.getRole() == User.Role.INSTRUCTOR && !accountName.isBlank()) {
            return accountName;
        }
        if (request.getInstructor() != null && !request.getInstructor().isBlank()) {
            return request.getInstructor().trim();
        }
        if (fallback != null) {
            return fallback;
        }
        return accountName.isBlank() ? currentUser.getEmail() : accountName;
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static List<String> cleanList(List<String> values) {
        List<String> cleaned = new ArrayList<>();
        if (values != null) {
            for (String value : values) {
                if (value != null && !value.isBlank()) {
                    cleaned.add(value.trim());
                }
            }
        }
        return cleaned;
    }

    /** Mutates the managed collection in place so Hibernate tracks the change. */
    private static void replaceList(List<String> target, List<String> values) {
        target.clear();
        target.addAll(cleanList(values));
    }

    public ThumbnailUploadResponse uploadThumbnail(MultipartFile file) {
        return publicFileStorage.upload(file, "courses/thumbnails", ALLOWED_THUMBNAIL_TYPES,
                MAX_THUMBNAIL_BYTES, "Thumbnail");
    }
}
