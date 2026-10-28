package com.itqan.edu.features.wishlist;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.catalog.CatalogService;
import com.itqan.edu.features.catalog.CatalogService.CatalogCourse;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.students.CurrentStudentService;
import com.itqan.edu.features.students.Student;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
@Tag(name = "Wishlist", description = "Courses a student saved for later")
public class WishlistController {

    private final WishlistRepository wishlistRepository;
    private final CourseRepository courseRepository;
    private final CatalogService catalogService;
    private final CurrentStudentService currentStudentService;

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Saved courses, newest first (published courses only)")
    public List<CatalogCourse> list(Authentication authentication) {
        Student student = currentStudentService.require(authentication);
        List<Course> courses = wishlistRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .map(WishlistItem::getCourse)
                .filter(c -> Boolean.TRUE.equals(c.getActive()))
                .toList();
        return catalogService.enrich(courses);
    }

    @GetMapping("/ids")
    @Transactional(readOnly = true)
    @Operation(summary = "Ids of saved courses")
    public List<Long> ids(Authentication authentication) {
        Student student = currentStudentService.require(authentication);
        return wishlistRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .map(item -> item.getCourse().getId())
                .toList();
    }

    @PutMapping("/{courseId}")
    @Transactional
    @Operation(summary = "Save a course")
    public ResponseEntity<Void> add(@PathVariable Long courseId, Authentication authentication) {
        Student student = currentStudentService.require(authentication);
        if (wishlistRepository.findByStudentIdAndCourseId(student.getId(), courseId).isEmpty()) {
            Course course = courseRepository.findById(courseId)
                    .filter(c -> Boolean.TRUE.equals(c.getActive()))
                    .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
            wishlistRepository.save(WishlistItem.builder().student(student).course(course).build());
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{courseId}")
    @Transactional
    @Operation(summary = "Remove a saved course")
    public ResponseEntity<Void> remove(@PathVariable Long courseId, Authentication authentication) {
        Student student = currentStudentService.require(authentication);
        wishlistRepository.findByStudentIdAndCourseId(student.getId(), courseId).ifPresent(wishlistRepository::delete);
        return ResponseEntity.noContent().build();
    }
}
