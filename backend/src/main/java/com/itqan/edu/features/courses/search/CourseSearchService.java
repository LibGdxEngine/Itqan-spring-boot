package com.itqan.edu.features.courses.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itqan.edu.features.courses.Course;
import com.itqan.edu.features.courses.CourseRepository;
import com.itqan.edu.features.courses.dto.CourseResponse;
import com.itqan.edu.features.courses.mapper.CourseMapper;
import com.meilisearch.sdk.Client;
import com.meilisearch.sdk.Index;
import com.meilisearch.sdk.SearchRequest;
import com.meilisearch.sdk.model.Searchable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseSearchService {

    private static final String INDEX_NAME = "courses";

    private final Client meilisearchClient;
    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;
    private final ObjectMapper objectMapper;

    public void indexCourse(Course course) {
        try {
            Index index = meilisearchClient.index(INDEX_NAME);
            Map<String, Object> doc = toDocument(course);
            index.addDocuments(objectMapper.writeValueAsString(List.of(doc)), "id");
            log.debug("Indexed course {} in Meilisearch", course.getId());
        } catch (Exception e) {
            log.error("Failed to index course {} in Meilisearch", course.getId(), e);
        }
    }

    public void removeCourse(Long courseId) {
        try {
            Index index = meilisearchClient.index(INDEX_NAME);
            index.deleteDocument(courseId.toString());
            log.debug("Removed course {} from Meilisearch", courseId);
        } catch (Exception e) {
            log.error("Failed to remove course {} from Meilisearch", courseId, e);
        }
    }

    @Transactional(readOnly = true)
    public void reindexAll() {
        try {
            List<Course> courses = courseRepository.findByActiveTrue();
            Index index = meilisearchClient.index(INDEX_NAME);
            List<Map<String, Object>> docs = courses.stream()
                    .map(this::toDocument)
                    .collect(Collectors.toList());
            if (!docs.isEmpty()) {
                index.addDocuments(objectMapper.writeValueAsString(docs), "id");
            }
            log.info("Reindexed {} active courses in Meilisearch", docs.size());
        } catch (Exception e) {
            log.error("Failed to reindex courses in Meilisearch", e);
        }
    }

    public List<CourseResponse> search(String query, String level, String category,
                                       Double minPrice, Double maxPrice, String sort) {
        try {
            Index index = meilisearchClient.index(INDEX_NAME);

            SearchRequest.SearchRequestBuilder builder = SearchRequest.builder()
                    .q(query != null ? query : "");

            // Build filter conditions
            List<String> filters = new ArrayList<>();
            filters.add("active = true");
            if (level != null && !level.trim().isEmpty()) {
                filters.add("level = \"" + level.toUpperCase() + "\"");
            }
            if (category != null && !category.trim().isEmpty()) {
                filters.add("category = \"" + category.toUpperCase() + "\"");
            }
            if (minPrice != null) {
                filters.add("price >= " + minPrice);
            }
            if (maxPrice != null) {
                filters.add("price <= " + maxPrice);
            }
            builder.filter(new String[]{String.join(" AND ", filters)});

            // Apply sorting
            if (sort != null) {
                switch (sort.toLowerCase()) {
                    case "price_asc":
                        builder.sort(new String[]{"price:asc"});
                        break;
                    case "price_desc":
                        builder.sort(new String[]{"price:desc"});
                        break;
                    case "newest":
                    default:
                        builder.sort(new String[]{"createdAt:desc"});
                        break;
                }
            }

            builder.limit(100);

            Searchable result = index.search(builder.build());

            // Extract course IDs from results and fetch full entities
            List<Long> courseIds = result.getHits().stream()
                    .map(hit -> {
                        Object id = ((Map<String, Object>) hit).get("id");
                        return Long.valueOf(id.toString());
                    })
                    .collect(Collectors.toList());

            if (courseIds.isEmpty()) {
                return List.of();
            }

            // Fetch full course entities to ensure consistent response format
            Map<Long, Course> courseMap = courseRepository.findAllById(courseIds).stream()
                    .collect(Collectors.toMap(Course::getId, c -> c));

            // Preserve Meilisearch relevance ordering
            return courseIds.stream()
                    .map(courseMap::get)
                    .filter(Objects::nonNull)
                    .map(courseMapper::toResponse)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Meilisearch search failed, falling back to database", e);
            return fallbackSearch(query, level, category, minPrice, maxPrice, sort);
        }
    }

    private List<CourseResponse> fallbackSearch(String query, String level, String category,
                                                 Double minPrice, Double maxPrice, String sort) {
        List<Course> courses;
        if (query != null && !query.trim().isEmpty()) {
            courses = courseRepository.searchCourses(query);
        } else {
            courses = courseRepository.findByActiveTrue();
        }

        return courses.stream()
                .filter(c -> level == null || level.trim().isEmpty() || level.equalsIgnoreCase(c.getLevel()))
                .filter(c -> category == null || category.trim().isEmpty() || category.equalsIgnoreCase(c.getCategory()))
                .filter(c -> minPrice == null || c.getPrice() >= minPrice)
                .filter(c -> maxPrice == null || c.getPrice() <= maxPrice)
                .sorted((c1, c2) -> {
                    if (sort == null) return c2.getCreatedAt().compareTo(c1.getCreatedAt());
                    return switch (sort.toLowerCase()) {
                        case "price_asc" -> c1.getPrice().compareTo(c2.getPrice());
                        case "price_desc" -> c2.getPrice().compareTo(c1.getPrice());
                        default -> c2.getCreatedAt().compareTo(c1.getCreatedAt());
                    };
                })
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());
    }

    private Map<String, Object> toDocument(Course course) {
        Map<String, Object> doc = new HashMap<>();
        doc.put("id", course.getId());
        doc.put("title", course.getTitle());
        doc.put("description", course.getDescription());
        doc.put("instructor", course.getInstructor());
        doc.put("price", course.getPrice());
        doc.put("duration", course.getDuration());
        doc.put("level", course.getLevel());
        doc.put("category", course.getCategory());
        doc.put("thumbnailUrl", course.getThumbnailUrl());
        doc.put("tags", course.getTags());
        doc.put("active", course.getActive());
        doc.put("createdAt", course.getCreatedAt() != null ? course.getCreatedAt().toString() : null);
        return doc;
    }
}
