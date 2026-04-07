package com.itqan.edu.features.courses.search;

import com.meilisearch.sdk.Client;
import com.meilisearch.sdk.Index;
import com.meilisearch.sdk.model.Settings;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CourseSearchInitializer implements ApplicationRunner {

    private static final String INDEX_NAME = "courses";

    private final Client meilisearchClient;
    private final CourseSearchService courseSearchService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            // Create index if it doesn't exist
            meilisearchClient.createIndex(INDEX_NAME, "id");
            log.info("Meilisearch index '{}' created or already exists", INDEX_NAME);

            // Configure index settings
            Index index = meilisearchClient.index(INDEX_NAME);

            Settings settings = new Settings();
            settings.setSearchableAttributes(new String[]{
                    "title", "description", "instructor", "tags"
            });
            settings.setFilterableAttributes(new String[]{
                    "level", "category", "price", "active", "tags"
            });
            settings.setSortableAttributes(new String[]{
                    "price", "createdAt"
            });
            settings.setDisplayedAttributes(new String[]{"*"});

            index.updateSettings(settings);
            log.info("Meilisearch index settings configured");

            // Reindex all active courses
            courseSearchService.reindexAll();

        } catch (Exception e) {
            log.error("Failed to initialize Meilisearch index. Search will fall back to database.", e);
        }
    }
}
