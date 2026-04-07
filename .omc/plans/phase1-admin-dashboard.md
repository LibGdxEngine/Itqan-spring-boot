# Phase 1: Admin Dashboard — Analytics & Course Content Management

## Requirements Summary

Build a comprehensive admin dashboard with three core capabilities:
1. **Analytics Dashboard** — Revenue, user/enrollment, and progress/completion metrics with charts and date filtering
2. **Course Content Management** — Drag-and-drop reordering, multi-file video upload, and course duplication
3. **Supporting Infrastructure** — `lastLoginAt` tracking, database indexes for analytics performance, Student-User linking

**Out of scope (Phase 2):** Per-course subscriptions, role-based admin permissions, instructor analytics, real-time/WebSocket dashboards, cross-module lesson moves, bulk edit/delete.

---

## Acceptance Criteria

### Analytics Dashboard
- [ ] AC-1: `GET /api/admin/analytics/overview` returns `totalStudents`, `totalCourses`, `totalEnrollments`, `totalRevenue`, `activeUsers` (logged in within 30 days), `newUsersThisMonth` — all values match manual SQL within 1 cent / 1 count
- [ ] AC-2: `GET /api/admin/analytics/revenue?from=X&to=Y&granularity=daily|weekly|monthly` returns time-bucketed revenue data with zero-filled buckets for periods with no payments; only `COMPLETED` payments counted
- [ ] AC-3: `GET /api/admin/analytics/revenue/by-course` returns array sorted by revenue descending: `courseId`, `courseTitle`, `totalRevenue`, `enrollmentCount`, `completionRate`
- [ ] AC-4: `GET /api/admin/analytics/users?from=X&to=Y` returns `totalUsers`, `newSignups` (in range), `usersByRole` breakdown, `activeUsers`
- [ ] AC-5: `GET /api/admin/analytics/enrollments/popular` returns top courses ranked by enrollment count with `courseId`, `title`, `enrollmentCount`, `completionRate`, `averageProgress`
- [ ] AC-6: `GET /api/admin/analytics/progress?courseId=X` returns `totalEnrollments`, `completedCount`, `completionRate`, `averageProgress`, `lessonCompletionRates[]` (per lesson: `lessonId`, `title`, `completionCount`, `completionRate`)
- [ ] AC-7: All `/api/admin/analytics/**` endpoints return 403 for STUDENT and INSTRUCTOR roles
- [ ] AC-8: Revenue aggregated per currency (separate totals for EGP, USD, etc.) — no cross-currency summing
- [ ] AC-9: All analytics endpoints accept `from`/`to` date parameters (ISO 8601), default to last 30 days, max range 12 months
- [ ] AC-10: Frontend admin dashboard displays stat cards, revenue trend chart, course popularity chart, recent enrollments table, with date range picker

### Course Content Management
- [ ] AC-11: `PATCH /api/admin/courses/{courseId}/modules/reorder` with `{"moduleIds": [3,1,2]}` updates all modules' `orderIndex` sequentially; returns updated list
- [ ] AC-12: Frontend drag-and-drop for module reordering within a course (intra-course only, no cross-course)
- [ ] AC-13: Frontend drag-and-drop for lesson reordering within a module (uses existing backend endpoint)
- [ ] AC-14: `POST /api/admin/courses/{courseId}/duplicate` deep-copies course → modules → lessons → quizzes → questions → options; new course title = "[Original] (Copy)", `active=false`, `ownerUserId` = requesting admin's user ID; video S3 keys are referenced (shared), not copied; enrollments/payments NOT copied
- [ ] AC-15: `POST /api/admin/modules/{moduleId}/lessons/bulk-upload` accepts multipart form with multiple video files; creates one lesson per file with `title` derived from filename (stripped extension), `type=VIDEO`, sequential `orderIndex`; all created atomically (all succeed or all fail); max 20 files per request
- [ ] AC-16: Bulk upload initiates S3 multipart uploads for each video using existing `VideoStorageService` infrastructure
- [ ] AC-17: Course duplication of a course with 10 modules × 10 lessons completes within 10 seconds (metadata only, no S3 copy)

### Supporting Infrastructure
- [ ] AC-18: `User.lastLoginAt` field added via Flyway migration V9; updated on every successful login (local + Google OAuth)
- [ ] AC-19: Database indexes added for analytics queries: `payments(status, created_at)`, `enrollments(course_id, status)`, `enrollments(enrolled_at)`, `users(created_at)`, `users(role)`
- [ ] AC-20: Analytics query timeout set to 5 seconds via JPA property

---

## Implementation Steps

### Step 1: Database Migrations & Entity Updates
**Files to create/modify:**

1. **Create** `backend/src/main/resources/db/migration/V9__add_analytics_support.sql`
   - Add `last_login_at TIMESTAMP` column to `users` table
   - Add indexes: `idx_payments_status_created` on `payments(status, created_at)`, `idx_enrollments_course_status` on `enrollments(course_id, status)`, `idx_enrollments_enrolled_at` on `enrollments(enrolled_at)`, `idx_users_created_at` on `users(created_at)`, `idx_users_role` on `users(role)`, `idx_lesson_enrollments_lesson_completed` on `lesson_enrollments(lesson_id, is_completed)`

2. **Modify** `backend/src/main/java/com/itqan/edu/features/auth/User.java`
   - Add `lastLoginAt` (LocalDateTime) field

3. **Modify** `backend/src/main/java/com/itqan/edu/features/auth/AuthService.java`
   - Update `lastLoginAt` on successful login (both local and Google OAuth paths)

4. **Modify** `backend/src/main/resources/application.properties`
   - Add `spring.jpa.properties.jakarta.persistence.query.timeout=5000`

**Satisfies:** AC-18, AC-19, AC-20

---

### Step 2: Analytics Backend — Repository Layer
**Files to create/modify:**

1. **Modify** `backend/src/main/java/com/itqan/edu/features/payments/PaymentRepository.java`
   - Add `@Query` methods:
     - `sumRevenueByStatusAndDateRange(PaymentStatus status, LocalDateTime from, LocalDateTime to)` → returns `Double`
     - `findRevenueByCourseSorted(PaymentStatus status)` → returns `List<Object[]>` (courseId, courseTitle, totalRevenue, count)
     - `findRevenueTrend(PaymentStatus status, LocalDateTime from, LocalDateTime to)` → returns `List<Object[]>` (date, sum) grouped by date
     - `countByStatusGroupedByCurrency(PaymentStatus status, LocalDateTime from, LocalDateTime to)` → returns `List<Object[]>` (currency, sum)

2. **Modify** `backend/src/main/java/com/itqan/edu/features/auth/AuthRepository.java`
   - Add `@Query` methods:
     - `countByCreatedAtBetween(LocalDateTime from, LocalDateTime to)` → signup count
     - `countByRoleGrouped()` → returns `List<Object[]>` (role, count)
     - `countByLastLoginAtAfter(LocalDateTime since)` → active users

3. **Modify** `backend/src/main/java/com/itqan/edu/features/enrollments/EnrollmentRepository.java`
   - Add `@Query` methods:
     - `countByStatusGroupedByCourse()` → returns `List<Object[]>` (courseId, title, enrollCount, completedCount, avgProgress)
     - `findCompletionStatsByCourse(Long courseId)` → returns aggregated stats

4. **Modify** `backend/src/main/java/com/itqan/edu/features/enrollments/LessonEnrollmentRepository.java`
   - Add `@Query` method:
     - `findLessonCompletionRatesByCourse(Long courseId)` → returns `List<Object[]>` (lessonId, lessonTitle, completionCount, totalEnrollments)

**Satisfies:** AC-1 through AC-6 (data layer)

---

### Step 3: Analytics Backend — Service & Controller
**Files to create:**

1. **Create** `backend/src/main/java/com/itqan/edu/features/admin/analytics/AdminAnalyticsController.java`
   - `@RestController @RequestMapping("/api/admin/analytics")`
   - `@PreAuthorize("hasRole('ADMIN')")`
   - Endpoints:
     - `GET /overview` → `AnalyticsOverviewResponse`
     - `GET /revenue` → `RevenueTrendResponse` (with `from`, `to`, `granularity` params)
     - `GET /revenue/by-course` → `List<CourseRevenueResponse>`
     - `GET /users` → `UserAnalyticsResponse`
     - `GET /enrollments/popular` → `List<CoursePopularityResponse>`
     - `GET /progress` → `CourseProgressResponse` (with `courseId` param)

2. **Create** `backend/src/main/java/com/itqan/edu/features/admin/analytics/AdminAnalyticsService.java`
   - Orchestrates repository calls, applies date range defaults (last 30 days), enforces max 12-month range
   - Zero-fills revenue trend buckets for periods with no data
   - Aggregates revenue per currency (no cross-currency summing)
   - Computes derived metrics (completion rate = completedCount / totalEnrollments * 100)

3. **Create** DTOs in `backend/src/main/java/com/itqan/edu/features/admin/analytics/dto/`:
   - `AnalyticsOverviewResponse.java` — totalStudents, totalCourses, totalEnrollments, revenueByCurrency (Map<String,Double>), activeUsers, newUsersThisMonth
   - `RevenueTrendResponse.java` — granularity, dataPoints[] (date, amount, currency)
   - `CourseRevenueResponse.java` — courseId, courseTitle, totalRevenue, currency, enrollmentCount, completionRate
   - `UserAnalyticsResponse.java` — totalUsers, newSignups, activeUsers, usersByRole (Map<String,Long>)
   - `CoursePopularityResponse.java` — courseId, title, enrollmentCount, completionRate, averageProgress
   - `CourseProgressResponse.java` — courseId, totalEnrollments, completedCount, completionRate, averageProgress, lessonCompletionRates[]
   - `DateRangeRequest.java` — from (LocalDateTime), to (LocalDateTime), granularity (enum: DAILY, WEEKLY, MONTHLY)

4. **Modify** `backend/src/main/java/com/itqan/edu/common/config/SecurityConfig.java`
   - Ensure `/api/admin/**` requires authentication (should already be covered by default deny, but verify no wildcard permit exists)

**Satisfies:** AC-1 through AC-9

---

### Step 4: Course Content Management Backend — Module Reorder
**Files to create/modify:**

1. **Create** `backend/src/main/java/com/itqan/edu/features/admin/content/AdminContentController.java`
   - `@RestController @RequestMapping("/api/admin")`
   - `@PreAuthorize("hasRole('ADMIN')")`
   - `PATCH /courses/{courseId}/modules/reorder` — accepts `ModuleReorderRequest` (List<Long> moduleIds), validates all IDs belong to the course, updates `orderIndex` sequentially

2. **Create** `backend/src/main/java/com/itqan/edu/features/admin/content/AdminContentService.java`
   - `reorderModules(Long courseId, List<Long> moduleIds)` — validates, updates order indexes, saves all in batch
   - Uses `@Transactional` for atomicity

3. **Create** `backend/src/main/java/com/itqan/edu/features/admin/content/dto/ModuleReorderRequest.java`
   - `List<Long> moduleIds` with `@NotEmpty` validation

**Satisfies:** AC-11

---

### Step 5: Course Content Management Backend — Course Duplication
**Files to modify/create:**

1. **Add to** `AdminContentController.java`:
   - `POST /courses/{courseId}/duplicate` → `CourseResponse`

2. **Add to** `AdminContentService.java`:
   - `duplicateCourse(Long courseId, Long adminUserId)`:
     - Load course with modules → lessons → quizzes → questions → options (eager fetch or entity graph)
     - Deep copy all entities with new IDs
     - Set new course: `title = "[Original] (Copy)"`, `active = false`, `ownerUserId = adminUserId`
     - Copy video S3 references (shared, not re-uploaded): copy `videoUrl`, `videoObjectKey`, `videoMimeType`, `videoSizeBytes`, set `videoStatus = COMPLETED`
     - Do NOT copy enrollments, payments, lesson_enrollments, video_bookmarks
     - Use `@Transactional` for atomicity
     - Batch persist to avoid N+1 inserts

**Satisfies:** AC-14, AC-17

---

### Step 6: Course Content Management Backend — Bulk Video Upload
**Files to modify/create:**

1. **Add to** `AdminContentController.java`:
   - `POST /modules/{moduleId}/lessons/bulk-upload` — accepts `@RequestParam("files") List<MultipartFile> files` (max 20)
   - Validates file count <= 20, all files are video MIME types, each file <= `videoStorageProperties.maxSizeBytes`

2. **Add to** `AdminContentService.java`:
   - `bulkUploadLessons(Long moduleId, List<MultipartFile> files, Long adminUserId)`:
     - Get current max `orderIndex` in module
     - For each file: create Lesson entity (title from filename without extension, type=VIDEO, orderIndex = max + i + 1)
     - Initiate S3 multipart upload for each video using existing `VideoStorageService`
     - Save all lessons atomically with `@Transactional`
     - Return created lessons with upload status

3. **Modify** `backend/src/main/resources/application.properties`:
   - Add `spring.servlet.multipart.max-file-size=5GB` and `spring.servlet.multipart.max-request-size=25GB` (if not already set)

**Satisfies:** AC-15, AC-16

---

### Step 7: Frontend — Admin Dashboard Analytics Page
**Files to create/modify:**

1. **Create** `frontend/src/lib/admin-analytics.ts`
   - API helper functions using Axios for all analytics endpoints
   - Types matching backend DTOs

2. **Restructure** `frontend/src/app/admin/` directory:
   - `frontend/src/app/admin/layout.tsx` — Admin layout with sidebar navigation (Dashboard, Courses, Users, Admins)
   - `frontend/src/app/admin/page.tsx` — Redirect to /admin/dashboard
   - `frontend/src/app/admin/dashboard/page.tsx` — Analytics dashboard
   - `frontend/src/app/admin/courses/page.tsx` — Course content management
   - `frontend/src/app/admin/users/page.tsx` — Existing user/student management (move from current admin page)
   - `frontend/src/app/admin/admins/page.tsx` — Existing admin management (move from current admin page)

3. **Create** `frontend/src/app/admin/dashboard/page.tsx`:
   - **Stat cards row:** Total Students, Total Revenue (per currency), Active Users, Total Enrollments — using Radix UI Card components
   - **Revenue trend chart:** Line chart with date range picker and granularity toggle (daily/weekly/monthly)
   - **Course popularity chart:** Bar chart showing top 10 courses by enrollment
   - **Recent enrollments table:** Paginated table with student name, course, enrolled date, progress
   - **Completion rates:** Horizontal bar chart showing completion % per course

4. **Install** charting library:
   - `recharts` (React-native, works well with Next.js SSR, lightweight)

5. **Create** `frontend/src/components/admin/` directory:
   - `StatCard.tsx` — Reusable stat card component
   - `RevenueTrendChart.tsx` — Revenue line chart with recharts
   - `CoursePopularityChart.tsx` — Bar chart component
   - `DateRangePicker.tsx` — Date range selector with presets (7d, 30d, 90d, 12m)
   - `AdminSidebar.tsx` — Navigation sidebar for admin section

**Satisfies:** AC-10

---

### Step 8: Frontend — Course Content Management Page
**Files to create:**

1. **Install** drag-and-drop library:
   - `@dnd-kit/core` + `@dnd-kit/sortable` (lightweight, accessible, React-native)

2. **Create** `frontend/src/app/admin/courses/page.tsx`:
   - Course list with search/filter (by category, level, active status)
   - Click course → expand to show modules and lessons in tree view
   - Drag-and-drop for module reordering (calls `PATCH /api/admin/courses/{id}/modules/reorder`)
   - Drag-and-drop for lesson reordering within each module (calls existing `PATCH /api/modules/{id}/lessons/reorder`)
   - "Duplicate Course" button on each course row → confirmation dialog → calls `POST /api/admin/courses/{id}/duplicate`
   - "Bulk Upload Videos" button on each module → file picker (accept video/*, max 20) → calls `POST /api/admin/modules/{id}/lessons/bulk-upload`
   - Upload progress indicators for bulk video uploads

3. **Create** `frontend/src/components/admin/`:
   - `CourseTree.tsx` — Expandable course → module → lesson tree with DnD
   - `ModuleList.tsx` — Sortable module list within a course
   - `LessonList.tsx` — Sortable lesson list within a module
   - `BulkUploadDialog.tsx` — File selection dialog with progress tracking
   - `DuplicateCourseDialog.tsx` — Confirmation dialog for course duplication

4. **Create** `frontend/src/lib/admin-content.ts`:
   - API helpers for reorder, duplicate, bulk upload endpoints

**Satisfies:** AC-12, AC-13, AC-14 (frontend), AC-15 (frontend)

---

### Step 9: Admin Layout & Navigation
**Files to create/modify:**

1. **Create** `frontend/src/app/admin/layout.tsx`:
   - Sidebar with navigation links: Dashboard, Courses, Users, Admins
   - Auth guard: redirect to login if not ADMIN role
   - Responsive layout (collapsible sidebar on mobile)

2. **Modify** `frontend/src/components/Navbar.tsx`:
   - Ensure admin navigation link points to `/admin/dashboard` (not `/admin`)

**Satisfies:** AC-10 (navigation)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Analytics queries slow on large datasets | Dashboard loads > 5s | Query timeout (5s), database indexes (Step 1), default 30-day range, max 12-month range |
| Concurrent module reorder by two admins | Silent data loss | Use `@Transactional` with `PESSIMISTIC_WRITE` lock on course during reorder; consider adding `@Version` to Module entity in future |
| Bulk video upload timeout | Request fails mid-upload | Frontend uploads files individually via S3 presigned URLs (existing multipart flow), only lesson metadata creation is in the bulk endpoint |
| Course duplication of large course tree | Transaction timeout | Batch inserts (50 entities per flush), tested with 10×10 course structure within 10s target |
| Student-User table disconnect | Incorrect analytics counts | For Phase 1: analytics counts Users (not Students) for user metrics, Enrollments for enrollment metrics — no cross-table join needed. Phase 2: add `userId` FK to Student |
| `LocalDateTime` timezone inconsistency | Wrong date filtering | Document that server JVM must run in UTC; add `-Duser.timezone=UTC` to JVM args in Dockerfile |
| Flyway + ddl-auto=update conflict | Schema drift | All new tables/indexes via Flyway migration only; existing entities already managed by ddl-auto, new columns also via migration |
| Multi-currency revenue display | Confusing totals | Never sum across currencies; display separate totals per currency with clear labels |

---

## Verification Steps

1. **Unit tests:** Repository query methods tested against H2/PostgreSQL testcontainer with seed data
2. **Integration tests:** Analytics endpoints tested with `@SpringBootTest` — verify correct aggregation, date filtering, and 403 for non-admin roles
3. **Manual verification:**
   - Create 5 courses, 20 students, 50 enrollments, 30 payments across 2 currencies → verify dashboard numbers match manual count
   - Drag-and-drop reorder modules → refresh page → order persists
   - Duplicate a course with 3 modules × 5 lessons → verify copy exists with "(Copy)" suffix, active=false, all lessons present
   - Bulk upload 5 video files → verify 5 lessons created with correct titles and videos uploading
   - Access analytics endpoints as STUDENT role → verify 403
4. **Performance:** Run analytics queries against dataset with 1000 enrollments, 500 payments → all endpoints respond within 2 seconds

---

## File Summary

### New files (17)
- `backend/src/main/resources/db/migration/V9__add_analytics_support.sql`
- `backend/src/main/java/com/itqan/edu/features/admin/analytics/AdminAnalyticsController.java`
- `backend/src/main/java/com/itqan/edu/features/admin/analytics/AdminAnalyticsService.java`
- `backend/src/main/java/com/itqan/edu/features/admin/analytics/dto/AnalyticsOverviewResponse.java`
- `backend/src/main/java/com/itqan/edu/features/admin/analytics/dto/RevenueTrendResponse.java`
- `backend/src/main/java/com/itqan/edu/features/admin/analytics/dto/CourseRevenueResponse.java`
- `backend/src/main/java/com/itqan/edu/features/admin/analytics/dto/UserAnalyticsResponse.java`
- `backend/src/main/java/com/itqan/edu/features/admin/analytics/dto/CoursePopularityResponse.java`
- `backend/src/main/java/com/itqan/edu/features/admin/analytics/dto/CourseProgressResponse.java`
- `backend/src/main/java/com/itqan/edu/features/admin/analytics/dto/DateRangeRequest.java`
- `backend/src/main/java/com/itqan/edu/features/admin/content/AdminContentController.java`
- `backend/src/main/java/com/itqan/edu/features/admin/content/AdminContentService.java`
- `backend/src/main/java/com/itqan/edu/features/admin/content/dto/ModuleReorderRequest.java`
- `frontend/src/lib/admin-analytics.ts`
- `frontend/src/lib/admin-content.ts`
- `frontend/src/app/admin/dashboard/page.tsx`
- `frontend/src/app/admin/layout.tsx`

### Modified files (8)
- `backend/src/main/java/com/itqan/edu/features/auth/User.java` — add `lastLoginAt`
- `backend/src/main/java/com/itqan/edu/features/auth/AuthService.java` — update `lastLoginAt` on login
- `backend/src/main/java/com/itqan/edu/features/payments/PaymentRepository.java` — add aggregate queries
- `backend/src/main/java/com/itqan/edu/features/auth/AuthRepository.java` — add count queries
- `backend/src/main/java/com/itqan/edu/features/enrollments/EnrollmentRepository.java` — add stats queries
- `backend/src/main/resources/application.properties` — query timeout, multipart config
- `frontend/src/app/admin/page.tsx` — restructure to sub-pages
- `frontend/src/components/Navbar.tsx` — update admin nav link

### New frontend components (8)
- `frontend/src/components/admin/StatCard.tsx`
- `frontend/src/components/admin/RevenueTrendChart.tsx`
- `frontend/src/components/admin/CoursePopularityChart.tsx`
- `frontend/src/components/admin/DateRangePicker.tsx`
- `frontend/src/components/admin/AdminSidebar.tsx`
- `frontend/src/components/admin/CourseTree.tsx`
- `frontend/src/components/admin/BulkUploadDialog.tsx`
- `frontend/src/components/admin/DuplicateCourseDialog.tsx`

### New frontend pages (3)
- `frontend/src/app/admin/courses/page.tsx`
- `frontend/src/app/admin/users/page.tsx`
- `frontend/src/app/admin/admins/page.tsx`

### New dependencies
- `recharts` (frontend — charting)
- `@dnd-kit/core` + `@dnd-kit/sortable` (frontend — drag-and-drop)
