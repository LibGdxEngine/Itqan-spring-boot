<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# admin

## Purpose
Admin-specific features — content management operations and platform analytics dashboards.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `content/` | Content management — module reordering and admin content operations |
| `analytics/` | Platform analytics — overview metrics, user stats, course progress, revenue trends |

## For AI Agents

### Working In This Directory
- These endpoints require ADMIN role authentication
- Analytics queries read from payments, enrollments, users, and lesson_enrollments tables
- Analytics DTOs include: AnalyticsOverviewResponse, UserAnalyticsResponse, CourseProgressResponse, CoursePopularityResponse, CourseRevenueResponse, RevenueTrendResponse
- Granularity enum supports DAILY, WEEKLY, MONTHLY time periods

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
