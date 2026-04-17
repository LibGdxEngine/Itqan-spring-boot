<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# learn

## Purpose
Learning interface — video player with lesson navigation, bookmarks, and transcript for enrolled students.

## Key Files

| File | Description |
|------|-------------|
| `[courseId]/layout.tsx` | Learning layout with sidebar navigation |
| `[courseId]/page.tsx` | Course overview within learning context |
| `[courseId]/[lessonId]/page.tsx` | Lesson view — video player, bookmarks panel, interactive transcript, lesson navigation |

## For AI Agents

### Working In This Directory
- Requires authenticated + enrolled user
- Nested dynamic routes: `/learn/[courseId]/[lessonId]`
- Uses VideoPlayer, BookmarkPanel, InteractiveTranscript, and LearningSidebar components
- Video playback uses presigned S3/MinIO URLs from backend
- Lesson progress is tracked via enrollment API

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
