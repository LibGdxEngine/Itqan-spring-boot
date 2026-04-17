<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# courses

## Purpose
Course, module, and lesson management — the core content domain. Includes video upload (S3/MinIO multipart), lesson ordering, and full-text search (Meilisearch).

## Key Files

| File | Description |
|------|-------------|
| `CourseController.java` | Course CRUD with role-based access (create/update/delete for instructors, list/get public) |
| `ModuleController.java` | Module management within courses — CRUD and reordering |
| `LessonController.java` | Lesson management — CRUD, video upload initiation/completion/abort |
| `CourseService.java` | Course business logic with Meilisearch indexing |
| `ModuleService.java` | Module ordering and CRUD logic |
| `LessonService.java` | Lesson CRUD and progress tracking |
| `LessonVideoService.java` | S3 multipart upload — initiate, presigned part URLs, complete, abort, playback URLs |
| `Course.java` | JPA entity — title, description, instructor, ownerUserId, price, duration, level, category, thumbnail |
| `Module.java` | JPA entity — courseId, title, description, sequenceNumber |
| `Lesson.java` | JPA entity — moduleId, title, lessonType, videoObjectKey, videoStatus |
| `LessonType.java` | Enum — VIDEO, TEXT |
| `LessonVideoStatus.java` | Enum — PENDING, UPLOADING, COMPLETED, FAILED |
| `CourseRepository.java` | Course data access |
| `ModuleRepository.java` | Module data access |
| `LessonRepository.java` | Lesson data access |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `dto/` | Course/Module/Lesson request/response DTOs, video multipart DTOs, reorder DTOs |
| `mapper/` | CourseMapper, ModuleMapper, LessonMapper (MapStruct) |
| `search/` | CourseSearchService (Meilisearch integration), CourseSearchInitializer (index setup on startup) |

## For AI Agents

### Working In This Directory
- Course hierarchy: Course → Module → Lesson (parent-child)
- Video upload uses S3 multipart: initiate → upload parts via presigned URLs → complete
- Meilisearch index is synced on course create/update/delete
- `sequenceNumber` controls ordering for modules and lessons
- `LessonVideoService` handles presigned URL generation for both upload and playback

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
