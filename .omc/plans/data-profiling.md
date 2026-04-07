# Data Profiling for Admin Dashboard

## Requirements Summary

Add a data profiling feature to the admin analytics dashboard that computes `describe()` (summary statistics) and `value_counts()` (frequency distributions) for all core entities (Students, Courses, Enrollments, Payments). Results are computed once per hour via in-memory caching with `@Cacheable` and displayed in the admin dashboard UI.

## Acceptance Criteria

1. **`GET /api/admin/analytics/profiling`** returns a JSON response containing profiling data for all 4 entities within **< 2 seconds** on first call, **< 50ms** on cache hit
2. **describe() stats** for numeric fields: count, min, max, mean, median (where feasible via JPQL), stddev — specifically:
   - `Course.price`: count, min, max, avg
   - `Course.duration`: count, min, max, avg
   - `Enrollment.progress`: count, min, max, avg
   - `Payment.amount`: count, min, max, avg, sum
   - `Payment.discountAmount`: count, min, max, avg, sum
3. **value_counts()** for categorical fields — top N frequency counts:
   - `Course.level`: count per BEGINNER/INTERMEDIATE/ADVANCED
   - `Course.category`: count per category
   - `Course.active`: count true/false
   - `Enrollment.status`: count per ENROLLED/IN_PROGRESS/COMPLETED/DROPPED
   - `Payment.status`: count per PENDING/COMPLETED/FAILED/REFUNDED
   - `Payment.currency`: count per currency code
   - `Payment.paymentGateway`: count per gateway
   - `Payment.paymentMethod`: count per method
   - `Student.active`: count true/false
4. **Temporal profiling**: entity counts grouped by month (last 12 months):
   - Students created per month
   - Courses created per month
   - Enrollments per month
   - Payments per month
5. **Cache**: In-memory via Spring `@Cacheable` with **1-hour TTL**, evicted automatically
6. **Frontend**: New "Data Profiling" tab/section in admin dashboard at `frontend/src/app/admin/page.tsx` displaying stats in cards/tables
7. **Security**: Endpoint restricted to ADMIN role via existing `SecurityConfig`

## Implementation Steps

### Step 1: Enable Spring Caching (backend)

**File**: [application.properties](backend/src/main/resources/application.properties)
- Add `spring.cache.type=caffeine` and `spring.cache.caffeine.spec=expireAfterWrite=3600s`

**File**: [pom.xml](backend/pom.xml)
- Add `spring-boot-starter-cache` and `com.github.ben-manes.caffeine:caffeine` dependencies

**New file**: `backend/src/main/java/com/itqan/edu/common/config/CacheConfig.java`
- `@Configuration` + `@EnableCaching`
- Define a `CacheManager` bean with Caffeine backing, cache name `"dataProfiling"`, TTL 1 hour

### Step 2: Add profiling queries to repositories

**File**: [CourseRepository.java](backend/src/main/java/com/itqan/edu/features/courses/CourseRepository.java)
- Add `@Query` method `findPriceStats()` → `SELECT COUNT(c), MIN(c.price), MAX(c.price), AVG(c.price) FROM Course c`
- Add `@Query` method `findDurationStats()` → `SELECT COUNT(c), MIN(c.duration), MAX(c.duration), AVG(c.duration) FROM Course c`
- Add `@Query` method `countByLevel()` → `SELECT c.level, COUNT(c) FROM Course c GROUP BY c.level`
- Add `@Query` method `countByCategory()` → `SELECT c.category, COUNT(c) FROM Course c GROUP BY c.category`
- Add `@Query` method `countByActive()` → `SELECT c.active, COUNT(c) FROM Course c GROUP BY c.active`
- Add `@Query` method `countByCreatedAtMonthly()` → group by `YEAR(c.createdAt), MONTH(c.createdAt)` for last 12 months

**File**: [EnrollmentRepository.java](backend/src/main/java/com/itqan/edu/features/enrollments/EnrollmentRepository.java)
- Add `findProgressStats()` → `SELECT COUNT(e), MIN(e.progress), MAX(e.progress), AVG(e.progress) FROM Enrollment e`
- Add `countByStatus()` → `SELECT e.status, COUNT(e) FROM Enrollment e GROUP BY e.status`
- Add `countByEnrolledAtMonthly()` → group by year/month for last 12 months

**File**: [PaymentRepository.java](backend/src/main/java/com/itqan/edu/features/payments/PaymentRepository.java)
- Add `findAmountStats()` → `SELECT COUNT(p), MIN(p.amount), MAX(p.amount), AVG(p.amount), SUM(p.amount) FROM Payment p WHERE p.status = 'COMPLETED'`
- Add `findDiscountStats()` → same pattern for `discountAmount`
- Add `countByStatus()` → `SELECT p.status, COUNT(p) FROM Payment p GROUP BY p.status`
- Add `countByCurrency()` → `SELECT p.currency, COUNT(p) FROM Payment p GROUP BY p.currency`
- Add `countByPaymentGateway()` → group by gateway
- Add `countByPaymentMethod()` → group by method
- Add `countByCreatedAtMonthly()` → group by year/month for last 12 months

**File**: `backend/src/main/java/com/itqan/edu/features/students/StudentRepository.java`
- Add `countByActive()` → `SELECT s.active, COUNT(s) FROM Student s GROUP BY s.active`
- Add `countByCreatedAtMonthly()` → group by year/month for last 12 months

### Step 3: Create profiling DTOs

**New file**: `backend/src/main/java/com/itqan/edu/features/admin/analytics/dto/DataProfilingResponse.java`
```java
@Data @Builder
public class DataProfilingResponse {
    private EntityProfile students;
    private EntityProfile courses;
    private EntityProfile enrollments;
    private EntityProfile payments;
    private LocalDateTime computedAt;
}
```

**New file**: `backend/src/main/java/com/itqan/edu/features/admin/analytics/dto/EntityProfile.java`
```java
@Data @Builder
public class EntityProfile {
    private long totalCount;
    private Map<String, NumericStats> numericFields;    // field name -> stats
    private Map<String, Map<String, Long>> categoricalFields; // field name -> value -> count
    private List<MonthlyCount> monthlyCounts;
}
```

**New file**: `backend/src/main/java/com/itqan/edu/features/admin/analytics/dto/NumericStats.java`
```java
@Data @Builder
public class NumericStats {
    private long count;
    private double min;
    private double max;
    private double avg;
    private Double sum; // nullable, only for monetary fields
}
```

**New file**: `backend/src/main/java/com/itqan/edu/features/admin/analytics/dto/MonthlyCount.java`
```java
@Data @Builder
public class MonthlyCount {
    private int year;
    private int month;
    private long count;
}
```

### Step 4: Create profiling service

**New file**: `backend/src/main/java/com/itqan/edu/features/admin/analytics/DataProfilingService.java`
- `@Service` with injected repositories: `StudentRepository`, `CourseRepository`, `EnrollmentRepository`, `PaymentRepository`
- Single method `@Cacheable("dataProfiling") DataProfilingResponse computeProfiling()`:
  1. Query all numeric stats from each repository
  2. Query all categorical counts from each repository
  3. Query monthly counts from each repository
  4. Assemble into `DataProfilingResponse` with `computedAt = LocalDateTime.now()`
- Method `@CacheEvict("dataProfiling", allEntries=true) void evictProfilingCache()` for manual refresh if needed later

### Step 5: Create profiling controller

**New file**: `backend/src/main/java/com/itqan/edu/features/admin/analytics/DataProfilingController.java`
- `@RestController` + `@RequestMapping("/api/admin/analytics")`
- `@GetMapping("/profiling")` → calls `DataProfilingService.computeProfiling()`
- Secured via existing `SecurityConfig` pattern (ADMIN role required)

### Step 6: Register endpoint in SecurityConfig

**File**: [SecurityConfig.java](backend/src/main/java/com/itqan/edu/common/config/SecurityConfig.java)
- Ensure `/api/admin/**` requires ADMIN role (likely already configured; verify and add if missing)

### Step 7: Frontend — Data Profiling section

**File**: [admin/page.tsx](frontend/src/app/admin/page.tsx)
- Add a new tab "Data Profiling" to the admin dashboard
- Call `GET /api/admin/analytics/profiling` on tab activation
- Display:
  - **Summary cards**: total count per entity
  - **Numeric stats tables**: one table per entity showing field / count / min / max / avg / sum
  - **Categorical bar charts or tables**: horizontal bars or simple tables for each value_counts field
  - **Monthly trend line**: small sparkline or simple table showing monthly entity creation counts
- Show `computedAt` timestamp so admin knows data freshness
- Use existing Tailwind + component patterns from the admin page

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Slow aggregate queries on large datasets | First request > 2s | Caffeine cache ensures only 1 slow query per hour; existing DB indexes on `status`, `student_id`, `course_id` help. Add indexes on `created_at` columns if needed (Step 2 queries use them). |
| N+1 queries in profiling service | Performance degradation | All queries are aggregate JPQL — no entity loading, no N+1 risk |
| Cache memory usage | Heap pressure | Profile response is a small JSON (<50KB even with 100K rows); negligible memory impact |
| Caffeine dependency conflicts | Build failure | Caffeine is the default Spring Boot cache provider; well-tested compatibility |

## Verification Steps

1. **Unit test**: `DataProfilingServiceTest` — mock repositories, verify correct assembly of `DataProfilingResponse`
2. **Integration test**: Hit `GET /api/admin/analytics/profiling` with admin credentials → verify 200 response with all fields populated
3. **Cache test**: Call endpoint twice, verify second call returns same `computedAt` timestamp (cache hit)
4. **Security test**: Call endpoint without auth → 401; call with STUDENT role → 403
5. **Frontend**: Navigate to admin dashboard → Data Profiling tab → verify all cards/tables render with correct data
6. **Performance**: First call completes in < 2s; cached call in < 50ms (measure via browser devtools or `curl -w`)

## File Summary

| Action | File |
|--------|------|
| Modify | `backend/pom.xml` — add cache + caffeine deps |
| Modify | `backend/src/main/resources/application.properties` — cache config |
| Create | `backend/.../common/config/CacheConfig.java` |
| Modify | `backend/.../courses/CourseRepository.java` — 6 new queries |
| Modify | `backend/.../enrollments/EnrollmentRepository.java` — 3 new queries |
| Modify | `backend/.../payments/PaymentRepository.java` — 6 new queries |
| Modify | `backend/.../students/StudentRepository.java` — 2 new queries |
| Create | `backend/.../admin/analytics/dto/DataProfilingResponse.java` |
| Create | `backend/.../admin/analytics/dto/EntityProfile.java` |
| Create | `backend/.../admin/analytics/dto/NumericStats.java` |
| Create | `backend/.../admin/analytics/dto/MonthlyCount.java` |
| Create | `backend/.../admin/analytics/DataProfilingService.java` |
| Create | `backend/.../admin/analytics/DataProfilingController.java` |
| Modify | `backend/.../common/config/SecurityConfig.java` — verify admin route |
| Modify | `frontend/src/app/admin/page.tsx` — add Data Profiling tab |
