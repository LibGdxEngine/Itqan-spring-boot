package com.itqan.edu.features.catalog;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.courses.LessonRepository;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.reviews.CourseReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Public course catalog with search, filters and sorting, enriched with ratings, student and
 * lesson counts. The published catalog is small, so filtering and sorting run in memory over the
 * active courses; move this to the search index if the catalog grows into the thousands.
 */
@Service
@RequiredArgsConstructor
public class CatalogService {

    public static final int MAX_PAGE_SIZE = 48;

    private final CourseRepository courseRepository;
    private final CourseReviewRepository reviewRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;

    public record CatalogCourse(Long id, String title, String description, String instructor, Long ownerUserId,
                                double price, String level, String category, String thumbnailUrl,
                                int durationHours, long lessonCount, long studentCount, double rating,
                                long reviewCount, List<String> tags, LocalDateTime createdAt) {
    }

    public record CatalogQuery(String q, String category, String level, String price, Double minRating,
                               String sort, int page, int size) {
    }

    @Transactional(readOnly = true)
    public Page<CatalogCourse> search(CatalogQuery query) {
        String needle = query.q() == null ? "" : query.q().trim().toLowerCase(Locale.ROOT);
        List<Course> matches = courseRepository.findByActiveTrue().stream()
                .filter(c -> isBlank(query.category()) || query.category().equalsIgnoreCase(c.getCategory()))
                .filter(c -> isBlank(query.level()) || query.level().equalsIgnoreCase(c.getLevel()))
                .filter(c -> !"free".equalsIgnoreCase(query.price()) || c.getPrice() == 0)
                .filter(c -> !"paid".equalsIgnoreCase(query.price()) || c.getPrice() > 0)
                .filter(c -> needle.isEmpty() || matchesText(c, needle))
                .toList();

        List<CatalogCourse> enriched = enrich(matches);
        if (query.minRating() != null) {
            enriched = enriched.stream().filter(c -> c.rating() >= query.minRating()).toList();
        }
        List<CatalogCourse> sorted = enriched.stream().sorted(comparator(query.sort())).toList();

        int size = Math.max(1, Math.min(query.size(), MAX_PAGE_SIZE));
        int page = Math.max(0, query.page());
        int from = Math.min(page * size, sorted.size());
        int to = Math.min(from + size, sorted.size());
        return new PageImpl<>(sorted.subList(from, to), PageRequest.of(page, size), sorted.size());
    }

    @Transactional(readOnly = true)
    public CatalogCourse course(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        return enrich(List.of(course)).get(0);
    }

    /** Catalog cards for the given courses, in the same order. */
    public List<CatalogCourse> enrich(List<Course> courses) {
        if (courses.isEmpty()) {
            return List.of();
        }
        Collection<Long> ids = courses.stream().map(Course::getId).toList();
        Map<Long, double[]> ratings = new HashMap<>();
        for (Object[] row : reviewRepository.ratingStats(ids)) {
            ratings.put((Long) row[0], new double[] {((Number) row[1]).doubleValue(), ((Number) row[2]).doubleValue()});
        }
        Map<Long, Long> students = new HashMap<>();
        for (Object[] row : enrollmentRepository.countStudentsPerCourse(ids, EnrollmentStatus.DROPPED)) {
            students.put((Long) row[0], ((Number) row[1]).longValue());
        }
        Map<Long, Long> lessons = new HashMap<>();
        for (Object[] row : lessonRepository.countActiveLessonsPerCourse(ids)) {
            lessons.put((Long) row[0], ((Number) row[1]).longValue());
        }
        return courses.stream().map(c -> {
            double[] rating = ratings.getOrDefault(c.getId(), new double[] {0, 0});
            return new CatalogCourse(c.getId(), c.getTitle(), excerpt(c.getDescription()), c.getInstructor(),
                    c.getOwnerUserId(), c.getPrice(), c.getLevel(), c.getCategory(), c.getThumbnailUrl(),
                    c.getDuration(), lessons.getOrDefault(c.getId(), 0L), students.getOrDefault(c.getId(), 0L),
                    Math.round(rating[0] * 10.0) / 10.0, (long) rating[1], List.copyOf(c.getTags()),
                    c.getCreatedAt());
        }).toList();
    }

    private static Comparator<CatalogCourse> comparator(String sort) {
        Comparator<CatalogCourse> newest = Comparator.comparing(CatalogCourse::createdAt).reversed();
        if (sort == null) {
            return newest;
        }
        return switch (sort.toLowerCase(Locale.ROOT)) {
            case "popular" -> Comparator.comparingLong(CatalogCourse::studentCount).reversed().thenComparing(newest);
            case "rating" -> Comparator.comparingDouble(CatalogCourse::rating).reversed()
                    .thenComparing(Comparator.comparingLong(CatalogCourse::reviewCount).reversed())
                    .thenComparing(newest);
            case "price_asc" -> Comparator.comparingDouble(CatalogCourse::price).thenComparing(newest);
            case "price_desc" -> Comparator.comparingDouble(CatalogCourse::price).reversed().thenComparing(newest);
            default -> newest;
        };
    }

    private static boolean matchesText(Course c, String needle) {
        return contains(c.getTitle(), needle) || contains(c.getDescription(), needle)
                || contains(c.getInstructor(), needle)
                || c.getTags().stream().anyMatch(tag -> contains(tag, needle));
    }

    private static boolean contains(String haystack, String needle) {
        return haystack != null && haystack.toLowerCase(Locale.ROOT).contains(needle);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String excerpt(String text) {
        if (text == null || text.length() <= 300) {
            return text;
        }
        return text.substring(0, 297).trim() + "…";
    }
}
