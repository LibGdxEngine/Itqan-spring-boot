package com.itqan.edu.features.landingpage;

import com.itqan.edu.common.config.StorageProperties;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.articles.Article;
import com.itqan.edu.features.articles.ArticleRepository;
import com.itqan.edu.features.auth.AuthRepository;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.courses.LessonRepository;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.landingpage.dto.HeroVideoUploadResponse;
import com.itqan.edu.features.landingpage.dto.LandingArticleDto;
import com.itqan.edu.features.landingpage.dto.LandingCourseDto;
import com.itqan.edu.features.landingpage.dto.LandingHeroDto;
import com.itqan.edu.features.landingpage.dto.LandingPageResponse;
import com.itqan.edu.features.landingpage.dto.LandingPageUpdateRequest;
import com.itqan.edu.features.landingpage.dto.LandingStatsDto;
import com.itqan.edu.features.landingpage.dto.LandingTeacherDto;
import com.itqan.edu.features.landingpage.dto.LandingTeachersSectionDto;
import com.itqan.edu.features.landingpage.dto.LandingTestimonialDto;
import com.itqan.edu.features.reviews.CourseReview;
import com.itqan.edu.features.reviews.CourseReviewRepository;
import com.itqan.edu.features.reviews.ReviewService;
import com.itqan.edu.features.specializations.SpecializationRepository;
import com.itqan.edu.features.specializations.SpecializationService;
import com.itqan.edu.features.specializations.dto.SpecializationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LandingPageService {

    private static final long MAX_HERO_VIDEO_BYTES = 200L * 1024 * 1024; // 200 MB
    private static final int MIN_TESTIMONIAL_RATING = 4;
    private static final int MAX_TESTIMONIALS = 6;

    private final LandingPageRepository landingPageRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final CourseReviewRepository courseReviewRepository;
    private final ArticleRepository articleRepository;
    private final AuthRepository authRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SpecializationRepository specializationRepository;
    private final SpecializationService specializationService;
    private final S3Client s3Client;
    private final StorageProperties storageProperties;

    @Cacheable("landing-page")
    public LandingPageResponse getPublic() {
        LandingPageConfig config = getOrCreateConfig();

        List<SpecializationResponse> specializations = specializationService.getActive();

        List<LandingCourseDto> courses = hydrateCourses(config.getFeaturedCourseIds());
        List<LandingTeacherDto> teachers = hydrateTeachers(config.getFeaturedInstructorIds());
        List<LandingArticleDto> articles = hydrateArticles(config.getFeaturedArticleIds());
        List<LandingTestimonialDto> testimonials = loadTestimonials();

        LandingStatsDto stats = LandingStatsDto.builder()
                .courses(courseRepository.countByActiveTrue())
                .lessons(lessonRepository.countByActiveTrueAndModuleCourseActiveTrue())
                .teachers(authRepository.countByRole(User.Role.INSTRUCTOR))
                .students(authRepository.countByRole(User.Role.STUDENT))
                .specializations(specializationRepository.countByActiveTrue())
                .build();

        LandingHeroDto hero = LandingHeroDto.builder()
                .videoUrl(config.getHeroVideoUrl())
                .titleAr(config.getHeroVideoTitleAr())
                .titleEn(config.getHeroVideoTitleEn())
                .teacherNameAr(config.getHeroTeacherNameAr())
                .teacherNameEn(config.getHeroTeacherNameEn())
                .durationLabelAr(config.getHeroDurationLabelAr())
                .durationLabelEn(config.getHeroDurationLabelEn())
                .build();

        LandingTeachersSectionDto teachersSection = LandingTeachersSectionDto.builder()
                .titleAr(config.getTeachersTitleAr())
                .titleEn(config.getTeachersTitleEn())
                .subtitleAr(config.getTeachersSubtitleAr())
                .subtitleEn(config.getTeachersSubtitleEn())
                .build();

        return LandingPageResponse.builder()
                .hero(hero)
                .stats(stats)
                .teachersSection(teachersSection)
                .specializations(specializations)
                .featuredCourses(courses)
                .featuredInstructors(teachers)
                .featuredArticles(articles)
                .featuredTestimonials(testimonials)
                .build();
    }

    @Transactional
    @CacheEvict(value = "landing-page", allEntries = true)
    public LandingPageResponse update(LandingPageUpdateRequest request, User currentUser) {
        LandingPageConfig config = getOrCreateConfig();

        if (request.getHeroVideoUrl() != null) config.setHeroVideoUrl(emptyToNull(request.getHeroVideoUrl()));
        if (request.getHeroVideoTitleAr() != null) config.setHeroVideoTitleAr(emptyToNull(request.getHeroVideoTitleAr()));
        if (request.getHeroVideoTitleEn() != null) config.setHeroVideoTitleEn(emptyToNull(request.getHeroVideoTitleEn()));
        if (request.getHeroTeacherNameAr() != null) config.setHeroTeacherNameAr(emptyToNull(request.getHeroTeacherNameAr()));
        if (request.getHeroTeacherNameEn() != null) config.setHeroTeacherNameEn(emptyToNull(request.getHeroTeacherNameEn()));
        if (request.getHeroDurationLabelAr() != null) config.setHeroDurationLabelAr(emptyToNull(request.getHeroDurationLabelAr()));
        if (request.getHeroDurationLabelEn() != null) config.setHeroDurationLabelEn(emptyToNull(request.getHeroDurationLabelEn()));
        if (request.getTeachersTitleAr() != null) config.setTeachersTitleAr(emptyToNull(request.getTeachersTitleAr()));
        if (request.getTeachersTitleEn() != null) config.setTeachersTitleEn(emptyToNull(request.getTeachersTitleEn()));
        if (request.getTeachersSubtitleAr() != null) config.setTeachersSubtitleAr(emptyToNull(request.getTeachersSubtitleAr()));
        if (request.getTeachersSubtitleEn() != null) config.setTeachersSubtitleEn(emptyToNull(request.getTeachersSubtitleEn()));

        if (request.getFeaturedCourseIds() != null) {
            if (config.getFeaturedCourseIds() == null) {
                config.setFeaturedCourseIds(new ArrayList<>());
            }
            config.getFeaturedCourseIds().clear();
            config.getFeaturedCourseIds().addAll(request.getFeaturedCourseIds());
        }
        if (request.getFeaturedInstructorIds() != null) {
            if (config.getFeaturedInstructorIds() == null) {
                config.setFeaturedInstructorIds(new ArrayList<>());
            }
            config.getFeaturedInstructorIds().clear();
            config.getFeaturedInstructorIds().addAll(request.getFeaturedInstructorIds());
        }
        if (request.getFeaturedArticleIds() != null) {
            if (config.getFeaturedArticleIds() == null) {
                config.setFeaturedArticleIds(new ArrayList<>());
            }
            config.getFeaturedArticleIds().clear();
            config.getFeaturedArticleIds().addAll(request.getFeaturedArticleIds());
        }
        if (currentUser != null) config.setUpdatedByUserId(currentUser.getId());

        landingPageRepository.save(config);
        return getPublicUncached();
    }

    @Transactional
    @CacheEvict(value = "landing-page", allEntries = true)
    public HeroVideoUploadResponse uploadHeroVideo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Video file is required");
        }
        if (file.getSize() > MAX_HERO_VIDEO_BYTES) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Video file exceeds maximum allowed size");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("video/")) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Only video files are allowed");
        }

        String objectKey = buildObjectKey(file.getOriginalFilename());
        try {
            s3Client.putObject(PutObjectRequest.builder()
                            .bucket(storageProperties.getBucket())
                            .key(objectKey)
                            .contentType(contentType)
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException ex) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Failed to read video upload: " + ex.getMessage());
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Failed to upload video: " + ex.getMessage());
        }

        String publicUrl = buildPublicUrl(objectKey);
        return HeroVideoUploadResponse.builder()
                .url(publicUrl)
                .objectKey(objectKey)
                .build();
    }

    private LandingPageResponse getPublicUncached() {
        // Recompute without hitting cache (cache was just evicted, but skip annotation by direct call).
        return getPublic();
    }

    LandingPageConfig getOrCreateConfig() {
        return landingPageRepository.findById(LandingPageConfig.SINGLETON_ID)
                .orElseGet(() -> landingPageRepository.save(LandingPageConfig.builder()
                        .id(LandingPageConfig.SINGLETON_ID)
                        .featuredCourseIds(new ArrayList<>())
                        .featuredInstructorIds(new ArrayList<>())
                        .featuredArticleIds(new ArrayList<>())
                        .build()));
    }

    private List<LandingCourseDto> hydrateCourses(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Collections.emptyList();
        Map<Long, Course> byId = new HashMap<>();
        for (Course c : courseRepository.findAllById(ids)) {
            byId.put(c.getId(), c);
        }
        List<LandingCourseDto> out = new ArrayList<>();
        for (Long id : ids) {
            Course c = byId.get(id);
            if (c == null) continue;
            out.add(LandingCourseDto.builder()
                    .id(c.getId())
                    .title(c.getTitle())
                    .instructor(c.getInstructor())
                    .category(c.getCategory())
                    .durationHours(c.getDuration())
                    .price(c.getPrice())
                    .thumbnailUrl(c.getThumbnailUrl())
                    .level(c.getLevel())
                    .build());
        }
        return out;
    }

    private List<LandingArticleDto> hydrateArticles(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Collections.emptyList();
        Map<Long, Article> byId = new HashMap<>();
        for (Article a : articleRepository.findAllById(ids)) {
            if (Boolean.TRUE.equals(a.getPublished())) byId.put(a.getId(), a);
        }
        List<LandingArticleDto> out = new ArrayList<>();
        for (Long id : ids) {
            Article a = byId.get(id);
            if (a == null) continue;
            out.add(LandingArticleDto.builder()
                    .id(a.getId())
                    .title(a.getTitle())
                    .slug(a.getSlug())
                    .description(a.getDescription())
                    .coverImageUrl(a.getCoverImageUrl())
                    .readingTimeMinutes(a.getReadingTimeMinutes())
                    .authorName(a.getAuthorName())
                    .category(a.getCategory())
                    .publishedAt(a.getPublishedAt())
                    .build());
        }
        return out;
    }

    private List<LandingTeacherDto> hydrateTeachers(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Collections.emptyList();
        Map<Long, User> byId = new HashMap<>();
        for (User u : authRepository.findAllById(ids)) {
            if (u.getRole() == User.Role.INSTRUCTOR) byId.put(u.getId(), u);
        }
        List<LandingTeacherDto> out = new ArrayList<>();
        for (Long id : ids) {
            User u = byId.get(id);
            if (u == null) continue;
            String fullName = ((u.getFirstName() == null ? "" : u.getFirstName()) + " "
                    + (u.getLastName() == null ? "" : u.getLastName())).trim();
            List<Course> courses = courseRepository.findByOwnerUserId(id);
            long studentsCount = 0;
            if (!courses.isEmpty()) {
                List<Long> courseIds = courses.stream().map(Course::getId).toList();
                studentsCount = enrollmentRepository.countByCourseIdIn(courseIds);
            }
            String specialty = courses.isEmpty() ? null : courses.get(0).getCategory();
            out.add(LandingTeacherDto.builder()
                    .id(id)
                    .name(fullName.isEmpty() ? u.getEmail() : fullName)
                    .specialty(specialty)
                    .photoUrl(u.getPhotoUrl())
                    .titleAr(u.getTitleAr())
                    .titleEn(u.getTitleEn())
                    .bioAr(u.getBioAr())
                    .bioEn(u.getBioEn())
                    .coursesCount(courses.size())
                    .studentsCount(studentsCount)
                    .build());
        }
        return out;
    }

    /** Latest well-rated, visible reviews with a written comment on active courses (max 6). */
    private List<LandingTestimonialDto> loadTestimonials() {
        List<LandingTestimonialDto> out = new ArrayList<>();
        for (CourseReview r : courseReviewRepository
                .findTop12ByHiddenFalseAndRatingGreaterThanEqualAndCommentIsNotNullOrderByCreatedAtDesc(MIN_TESTIMONIAL_RATING)) {
            if (r.getComment() == null || r.getComment().isBlank()) continue;
            if (r.getCourse() == null || !Boolean.TRUE.equals(r.getCourse().getActive())) continue;
            if (r.getStudent() == null) continue;
            String author = ReviewService.publicName(r.getStudent());
            if (author.isBlank()) continue;
            out.add(LandingTestimonialDto.builder()
                    .id(r.getId())
                    .authorName(author)
                    .rating(r.getRating())
                    .comment(r.getComment().trim())
                    .courseId(r.getCourse().getId())
                    .courseTitle(r.getCourse().getTitle())
                    .createdAt(r.getCreatedAt())
                    .build());
            if (out.size() == MAX_TESTIMONIALS) break;
        }
        return out;
    }

    private String buildObjectKey(String filename) {
        String safeName = (filename == null ? "hero" : filename).toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9.]+", "-")
                .replaceAll("^-|-$", "");
        if (safeName.isBlank()) safeName = "hero.mp4";
        return "landing/hero/" + UUID.randomUUID() + "-" + safeName;
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

    private static String emptyToNull(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
