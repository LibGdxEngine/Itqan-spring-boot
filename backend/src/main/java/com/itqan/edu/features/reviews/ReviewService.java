package com.itqan.edu.features.reviews;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.audit.AuditLogService;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.enrollments.EnrollmentRepository;
import com.itqan.edu.features.enrollments.EnrollmentStatus;
import com.itqan.edu.features.reviews.ReviewDtos.AdminReviewRow;
import com.itqan.edu.features.reviews.ReviewDtos.ReviewRequest;
import com.itqan.edu.features.reviews.ReviewDtos.ReviewResponse;
import com.itqan.edu.features.reviews.ReviewDtos.ReviewSummary;
import com.itqan.edu.features.students.Student;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final CourseReviewRepository reviewRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<ReviewResponse> listForCourse(Long courseId, Pageable pageable) {
        return reviewRepository.findByCourseIdAndHiddenFalseOrderByCreatedAtDesc(courseId, pageable)
                .map(ReviewService::toResponse);
    }

    @Transactional(readOnly = true)
    public ReviewSummary summary(Long courseId) {
        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int stars = 5; stars >= 1; stars--) {
            distribution.put(stars, 0L);
        }
        long count = 0;
        long total = 0;
        for (Object[] row : reviewRepository.ratingDistribution(courseId)) {
            int stars = ((Number) row[0]).intValue();
            long n = ((Number) row[1]).longValue();
            distribution.put(stars, n);
            count += n;
            total += stars * n;
        }
        double average = count == 0 ? 0 : Math.round(total * 10.0 / count) / 10.0;
        return new ReviewSummary(courseId, average, count, distribution);
    }

    @Transactional(readOnly = true)
    public Optional<ReviewResponse> mine(Long courseId, Student student) {
        return reviewRepository.findByCourseIdAndStudentId(courseId, student.getId()).map(ReviewService::toResponse);
    }

    /** Creates or replaces the student's review. Only students with a non-dropped enrollment may review. */
    @Transactional
    @CacheEvict(value = "landing-page", allEntries = true)
    public ReviewResponse upsert(Long courseId, Student student, ReviewRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        boolean enrolled = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), courseId)
                .filter(e -> e.getStatus() != EnrollmentStatus.DROPPED)
                .isPresent();
        if (!enrolled) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_ALLOWED);
        }
        CourseReview review = reviewRepository.findByCourseIdAndStudentId(courseId, student.getId())
                .orElseGet(() -> CourseReview.builder().course(course).student(student).build());
        review.setRating(request.rating());
        String comment = request.comment() == null ? null : request.comment().trim();
        review.setComment(comment == null || comment.isEmpty() ? null : comment);
        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    @CacheEvict(value = "landing-page", allEntries = true)
    public void deleteMine(Long courseId, Student student) {
        CourseReview review = reviewRepository.findByCourseIdAndStudentId(courseId, student.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        reviewRepository.delete(review);
    }

    @Transactional(readOnly = true)
    public Page<AdminReviewRow> search(String q, Long courseId, Boolean hidden, Integer rating, Pageable pageable) {
        Specification<CourseReview> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (courseId != null) {
                predicates.add(cb.equal(root.get("course").get("id"), courseId));
            }
            if (hidden != null) {
                predicates.add(cb.equal(root.get("hidden"), hidden));
            }
            if (rating != null) {
                predicates.add(cb.equal(root.get("rating"), rating));
            }
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("comment")), like),
                        cb.like(cb.lower(root.get("student").get("email")), like),
                        cb.like(cb.lower(root.get("course").get("title")), like)));
            }
            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return reviewRepository.findAll(spec, pageable).map(r -> new AdminReviewRow(
                r.getId(), r.getCourse().getId(), r.getCourse().getTitle(), r.getStudent().getId(),
                fullName(r.getStudent()), r.getStudent().getEmail(), r.getRating(), r.getComment(),
                Boolean.TRUE.equals(r.getHidden()), r.getCreatedAt()));
    }

    @Transactional
    @CacheEvict(value = "landing-page", allEntries = true)
    public void setHidden(Long reviewId, boolean hidden) {
        CourseReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        review.setHidden(hidden);
        reviewRepository.save(review);
        auditLogService.recordSuccess(hidden ? "REVIEW_HIDDEN" : "REVIEW_SHOWN", "REVIEW",
                String.valueOf(reviewId), Map.of("courseId", review.getCourse().getId()));
    }

    private static ReviewResponse toResponse(CourseReview review) {
        return new ReviewResponse(review.getId(), review.getCourse().getId(), publicName(review.getStudent()),
                review.getRating(), review.getComment(), review.getCreatedAt(), review.getUpdatedAt());
    }

    public static String publicName(Student student) {
        String first = student.getFirstName() == null ? "" : student.getFirstName().trim();
        String last = student.getLastName() == null ? "" : student.getLastName().trim();
        if (first.isEmpty() && last.isEmpty()) {
            return "";
        }
        return last.isEmpty() ? first : (first + " " + last.charAt(0) + ".").trim();
    }

    private static String fullName(Student student) {
        return ((student.getFirstName() == null ? "" : student.getFirstName()) + " "
                + (student.getLastName() == null ? "" : student.getLastName())).trim();
    }
}
