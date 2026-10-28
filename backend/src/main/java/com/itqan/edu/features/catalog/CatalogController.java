package com.itqan.edu.features.catalog;

import com.itqan.edu.features.catalog.CatalogService.CatalogCourse;
import com.itqan.edu.features.catalog.CatalogService.CatalogQuery;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
@Tag(name = "Catalog", description = "Public course discovery")
public class CatalogController {

    /** Same answer for every visitor, so browsers and CDNs may reuse it briefly. */
    private static final CacheControl PUBLIC_SHORT = CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic();

    private final CatalogService catalogService;

    @GetMapping
    @Operation(summary = "Search published courses",
            description = "sort: newest | popular | rating | price_asc | price_desc; price: free | paid")
    public ResponseEntity<Page<CatalogCourse>> search(@RequestParam(required = false) String q,
                                      @RequestParam(required = false) String category,
                                      @RequestParam(required = false) String level,
                                      @RequestParam(required = false) String price,
                                      @RequestParam(required = false) Double minRating,
                                      @RequestParam(defaultValue = "newest") String sort,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok()
                .cacheControl(PUBLIC_SHORT)
                .body(catalogService.search(new CatalogQuery(q, category, level, price, minRating, sort, page, size)));
    }

    @GetMapping("/courses/{id}")
    @Operation(summary = "Rating, student and lesson counts for one course")
    public ResponseEntity<CatalogCourse> course(@PathVariable Long id) {
        return ResponseEntity.ok().cacheControl(PUBLIC_SHORT).body(catalogService.course(id));
    }
}
