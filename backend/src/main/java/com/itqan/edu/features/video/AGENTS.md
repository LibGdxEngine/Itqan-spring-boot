<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# video

## Purpose
Video bookmark management — allows students to create, list, and delete bookmarks at specific timestamps in lesson videos.

## Key Files

| File | Description |
|------|-------------|
| `VideoBookmarkController.java` | Bookmark CRUD endpoints — create, list by lesson, delete |
| `VideoBookmarkService.java` | Bookmark business logic |
| `VideoBookmark.java` | JPA entity — studentId, lessonId, timestamp (seconds), title |
| `VideoBookmarkRepository.java` | Bookmark data access |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `dto/` | VideoBookmarkRequest, VideoBookmarkResponse |
| `mapper/` | VideoBookmarkMapper (MapStruct) |

## For AI Agents

### Working In This Directory
- Bookmarks are per-student per-lesson — scoped by authenticated user
- `timestamp` is in seconds, representing position in the video
- Used by the frontend VideoPlayer and BookmarkPanel components

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
