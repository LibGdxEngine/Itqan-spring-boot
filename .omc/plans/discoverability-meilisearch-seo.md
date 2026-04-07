# Discoverability Plan: Meilisearch + Full SEO Package

## Requirements Summary

The Itqan education platform needs two discoverability improvements:

1. **Full-text search via Meilisearch** — Replace the basic PostgreSQL `LIKE` query in `CourseRepository.java:searchCourses()` with Meilisearch, supporting bilingual (Arabic + English) search with typo tolerance, faceted filtering, and instant results.

2. **Full SEO package** — Add sitemap.xml, robots.txt, structured data (JSON-LD Course schema), Open Graph/Twitter meta tags per course, and canonical URLs to the Next.js 16 frontend.

---

## Acceptance Criteria

### Meilisearch Integration
- [ ] AC1: Meilisearch container runs in Docker Compose (dev + prod profiles) on port 7700
- [ ] AC2: On backend startup, a `courses` index is created/updated in Meilisearch with filterable attributes: `level`, `category`, `price`, `active`, `tags`
- [ ] AC3: When a course is created, updated, or deleted via `CourseService`, the Meilisearch index is updated within 5 seconds
- [ ] AC4: `GET /api/courses/search?q=...` returns results from Meilisearch instead of PostgreSQL LIKE query
- [ ] AC5: Search supports Arabic queries (e.g., searching "برمجة" finds programming courses with Arabic titles)
- [ ] AC6: Search supports typo tolerance (e.g., "programing" matches "programming")
- [ ] AC7: Faceted filtering works: `level`, `category`, `minPrice`/`maxPrice` filters applied via Meilisearch
- [ ] AC8: Sort options (newest, price asc/desc) work through Meilisearch sortable attributes
- [ ] AC9: Only `active=true` courses appear in search results
- [ ] AC10: Search response time < 50ms for up to 10,000 courses

### SEO Package
- [ ] AC11: `GET /sitemap.xml` returns valid XML sitemap with all active course URLs, homepage, and static pages
- [ ] AC12: Sitemap updates automatically when courses are added/removed (Next.js dynamic sitemap)
- [ ] AC13: `GET /robots.txt` exists with proper rules (allow all public pages, disallow admin/dashboard)
- [ ] AC14: Each course detail page (`/courses/[id]`) has JSON-LD structured data with `Course` schema (name, description, provider, offers/price)
- [ ] AC15: Each course page has Open Graph tags (og:title, og:description, og:image using thumbnailUrl, og:type=website)
- [ ] AC16: Each course page has Twitter Card meta tags (twitter:card=summary_large_image)
- [ ] AC17: Canonical URLs set on all pages to prevent duplicate content
- [ ] AC18: Homepage and course listing page have appropriate meta descriptions
- [ ] AC19: Arabic locale pages have `hreflang` alternate links pointing to English versions and vice versa

---

## Implementation Steps

### Phase 1: Meilisearch Infrastructure (Backend)

#### Step 1.1: Add Meilisearch to Docker Compose
**File:** `compose.yaml`
- Add `meilisearch` service using `getmeili/meilisearch:v1.12` image
- Port: `7700:7700`
- Volume: `meili_data:/meili_data`
- Environment: `MEILI_MASTER_KEY` from env var, `MEILI_ENV=development`/`production`
- Add to both dev and prod backend `depends_on`
- Add `MEILI_HOST` and `MEILI_MASTER_KEY` to backend environment variables

#### Step 1.2: Add Meilisearch Java SDK dependency
**File:** `backend/pom.xml`
- Add `com.meilisearch:meilisearch-java:0.14.2` dependency
- No other dependencies needed (uses OkHttp internally)

#### Step 1.3: Create Meilisearch configuration
**New file:** `backend/src/main/java/com/itqan/edu/common/config/MeilisearchConfig.java`
- Create `@Configuration` class with `@Bean Client meilisearchClient()`
- Read `meili.host` and `meili.master-key` from application.properties
- Create `MeilisearchProperties` record or use `@Value`

**File:** `backend/src/main/resources/application.properties`
- Add `meili.host=${MEILI_HOST:http://localhost:7700}`
- Add `meili.master-key=${MEILI_MASTER_KEY:masterKey123}`

#### Step 1.4: Create search indexing service
**New file:** `backend/src/main/java/com/itqan/edu/features/courses/search/CourseSearchService.java`
- `indexCourse(Course course)` — upsert single course document to Meilisearch
- `removeCourse(Long courseId)` — delete document from index
- `reindexAll()` — bulk index all active courses (called on startup)
- `search(String query, String level, String category, Double minPrice, Double maxPrice, String sort)` — search Meilisearch and return results
- Document schema: `{ id, title, description, instructor, price, duration, level, category, tags, thumbnailUrl, createdAt, active }`

#### Step 1.5: Create index initializer
**New file:** `backend/src/main/java/com/itqan/edu/features/courses/search/CourseSearchInitializer.java`
- `@Component` implementing `ApplicationRunner`
- On startup: create `courses` index if not exists
- Configure filterable attributes: `["level", "category", "price", "active", "tags"]`
- Configure sortable attributes: `["price", "createdAt"]`
- Configure searchable attributes: `["title", "description", "instructor", "tags"]`
- Run `reindexAll()` to sync existing courses

#### Step 1.6: Hook into CourseService lifecycle
**File:** `backend/src/main/java/com/itqan/edu/features/courses/CourseService.java`
- Inject `CourseSearchService`
- After `createCourse()`: call `courseSearchService.indexCourse(savedCourse)`
- After `updateCourse()`: call `courseSearchService.indexCourse(updatedCourse)`
- After delete/deactivate: call `courseSearchService.removeCourse(courseId)`

#### Step 1.7: Update CourseController search endpoint
**File:** `backend/src/main/java/com/itqan/edu/features/courses/CourseController.java`
- Modify `searchCourses()` to delegate to `CourseSearchService.search()` instead of `CourseRepository.searchCourses()`
- Keep the same API contract (`GET /api/courses/search` with same query params)
- Map Meilisearch results back to `CourseResponse` DTOs

### Phase 2: Full SEO Package (Frontend)

#### Step 2.1: Create dynamic sitemap
**New file:** `frontend/src/app/sitemap.ts`
- Export `default async function sitemap(): Promise<MetadataRoute.Sitemap>`
- Fetch all active courses from `/api/courses` 
- Generate entries for: homepage, `/courses`, each `/courses/[id]`, `/instructors`
- Set `changeFrequency` and `priority` appropriately
- Include both `/en/...` and `/ar/...` locale variants

#### Step 2.2: Create robots.txt
**New file:** `frontend/src/app/robots.ts`
- Export `default function robots(): MetadataRoute.Robots`
- Allow: `/`, `/courses`, `/instructors`
- Disallow: `/admin`, `/dashboard`, `/my-courses`, `/profile`, `/learn`
- Sitemap: `${SITE_URL}/sitemap.xml`

#### Step 2.3: Add per-course metadata with JSON-LD
**File:** `frontend/src/app/courses/[id]/page.tsx`
- Export `generateMetadata()` function that fetches course data
- Set `title`, `description`, `openGraph` (title, description, images from thumbnailUrl, type), `twitter` (card, title, description, images)
- Add `alternates.canonical` URL
- Add `alternates.languages` for hreflang (`en` and `ar` variants)
- Add inline `<script type="application/ld+json">` with Course schema:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "...",
    "description": "...",
    "provider": { "@type": "Organization", "name": "Itqan" },
    "offers": { "@type": "Offer", "price": "...", "priceCurrency": "USD" },
    "educationalLevel": "...",
    "about": "..."
  }
  ```

#### Step 2.4: Add metadata to course listing page
**File:** `frontend/src/app/courses/page.tsx`
- Export `metadata` with title "Browse Courses | Itqan", description, Open Graph tags
- Add canonical URL

#### Step 2.5: Enhance root layout with global SEO
**File:** `frontend/src/app/layout.tsx`
- Add `metadataBase` URL (from env `NEXT_PUBLIC_SITE_URL`)
- Add default `openGraph` config (siteName, locale, type)
- Add default `twitter` config (card type, site handle)
- Add `verification` for Google Search Console (optional, from env)

#### Step 2.6: Add hreflang alternate links
**File:** `frontend/src/app/layout.tsx`
- Add `alternates.languages` in metadata with `en` and `ar` mappings
- This provides default hreflang for all pages; course pages override with specific URLs

#### Step 2.7: Add environment variable for site URL
**File:** `frontend/.env.example` (and compose.yaml frontend environment)
- Add `NEXT_PUBLIC_SITE_URL=https://itqan.edu` (or appropriate domain)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Meilisearch index falls out of sync with PostgreSQL | Users see stale search results | Startup reindex + per-mutation sync. Add a scheduled reindex job (daily) as a safety net |
| Meilisearch container crashes | Search unavailable | Add health check in compose.yaml. Fallback: keep the PostgreSQL LIKE query as a degraded fallback in `CourseSearchService` |
| Arabic tokenization quality | Poor Arabic search results | Meilisearch has built-in Arabic support. Test with real Arabic course data during QA |
| SEO sitemap grows large | Slow crawl budget consumption | Next.js handles sitemap pagination natively for >50k URLs. Not a concern at current scale |
| `generateMetadata` adds latency to course pages | Slower page loads | Course data is already fetched for the page; metadata reuses the same fetch (Next.js deduplicates) |
| Missing `NEXT_PUBLIC_SITE_URL` in env | Broken canonical/sitemap URLs | Default to `http://localhost:3000` in development; require in production via validation |

---

## Verification Steps

1. **Meilisearch running:** `curl http://localhost:7700/health` returns `{"status":"available"}`
2. **Index created:** `curl http://localhost:7700/indexes/courses` returns index metadata with correct filterable/sortable/searchable attributes
3. **Course indexed:** Create a course via API, then `curl http://localhost:7700/indexes/courses/search -d '{"q":"<course title>"}'` returns the course
4. **Arabic search:** Create a course with Arabic title, search with Arabic query → course returned
5. **Typo tolerance:** Search "programing" → matches courses with "programming"
6. **Faceted filter:** `GET /api/courses/search?q=&level=BEGINNER` returns only beginner courses
7. **Sitemap:** `curl http://localhost:3000/sitemap.xml` returns valid XML with course URLs
8. **Robots.txt:** `curl http://localhost:3000/robots.txt` returns proper allow/disallow rules
9. **JSON-LD:** View source of `/courses/1` → `<script type="application/ld+json">` with Course schema present
10. **Open Graph:** Use Facebook Sharing Debugger or `curl` to verify og: tags on course pages
11. **Google Rich Results Test:** Paste course URL to validate structured data
12. **hreflang:** View source → `<link rel="alternate" hreflang="ar" href="...">` present

---

## File Summary

### New Files (6)
| File | Purpose |
|------|---------|
| `backend/src/main/java/com/itqan/edu/common/config/MeilisearchConfig.java` | Meilisearch client bean configuration |
| `backend/src/main/java/com/itqan/edu/features/courses/search/CourseSearchService.java` | Index/search operations against Meilisearch |
| `backend/src/main/java/com/itqan/edu/features/courses/search/CourseSearchInitializer.java` | Startup index creation and bulk reindex |
| `frontend/src/app/sitemap.ts` | Dynamic XML sitemap generation |
| `frontend/src/app/robots.ts` | robots.txt generation |
| `frontend/src/app/courses/[id]/layout.tsx` | JSON-LD structured data wrapper (if needed) |

### Modified Files (7)
| File | Change |
|------|--------|
| `compose.yaml` | Add Meilisearch service, env vars |
| `backend/pom.xml` | Add meilisearch-java dependency |
| `backend/src/main/resources/application.properties` | Add meili.host, meili.master-key |
| `backend/src/main/java/com/itqan/edu/features/courses/CourseService.java` | Hook search indexing into CRUD |
| `backend/src/main/java/com/itqan/edu/features/courses/CourseController.java` | Delegate search to Meilisearch |
| `frontend/src/app/courses/[id]/page.tsx` | Add generateMetadata, JSON-LD, Open Graph |
| `frontend/src/app/layout.tsx` | Add metadataBase, default OG/Twitter, hreflang |
