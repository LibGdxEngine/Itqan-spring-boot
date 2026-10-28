package com.itqan.edu.features.catalog;

import com.itqan.edu.config.BaseIntegrationTest;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.courses.Lesson;
import com.itqan.edu.features.courses.LessonRepository;
import com.itqan.edu.features.courses.LessonType;
import com.itqan.edu.features.courses.Module;
import com.itqan.edu.features.courses.ModuleRepository;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guards against N+1 queries on the public listing endpoints: the number of SQL statements must
 * not grow with the number of courses, sections and lessons.
 */
class CatalogQueryCountTest extends BaseIntegrationTest {

    private static final int COURSES = 10;

    @Autowired private CourseRepository courseRepository;
    @Autowired private ModuleRepository moduleRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private EntityManagerFactory entityManagerFactory;

    private final List<Long> courseIds = new ArrayList<>();
    private Statistics statistics;

    @BeforeEach
    void setUp() {
        String marker = UUID.randomUUID().toString().substring(0, 8);
        for (int c = 0; c < COURSES; c++) {
            Course course = courseRepository.save(Course.builder()
                    .title("Perf " + marker + " " + c).description("d").instructor("I").price(10.0 * c)
                    .duration(1).level("BEGINNER").category("GENERAL").active(true)
                    .tags(new ArrayList<>(List.of("tag" + c)))
                    .learningOutcomes(new ArrayList<>(List.of("outcome")))
                    .build());
            courseIds.add(course.getId());
            for (int m = 0; m < 3; m++) {
                Module module = moduleRepository.save(Module.builder()
                        .title("M" + m).orderIndex(m + 1).active(true).course(course).build());
                for (int l = 0; l < 3; l++) {
                    lessonRepository.save(Lesson.builder().title("L" + l).type(LessonType.TEXT)
                            .orderIndex(l + 1).active(true).module(module).build());
                }
            }
        }
        statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
    }

    @AfterEach
    void tearDown() {
        courseRepository.deleteAllById(courseIds);
        statistics.setStatisticsEnabled(false);
    }

    @Test
    @DisplayName("Catalog search runs a fixed number of queries")
    void catalogQueries() {
        long statements = statementsFor("/api/catalog?size=48");
        assertThat(statements).isLessThanOrEqualTo(8);
    }

    @Test
    @DisplayName("Paged course listing (with full curriculum) runs a fixed number of queries")
    void activeCoursesQueries() {
        long statements = statementsFor("/api/courses/active?size=50");
        assertThat(statements).isLessThanOrEqualTo(8);
    }

    private long statementsFor(String url) {
        restTemplate.getForEntity(url, String.class); // warm caches and lazy class init
        statistics.clear();
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return statistics.getPrepareStatementCount();
    }
}
