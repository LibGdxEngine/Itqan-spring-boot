<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# video

## Purpose
Video learning components — custom HTML5 video player with playback controls, timestamped bookmarks, and interactive transcript.

## Key Files

| File | Description |
|------|-------------|
| `VideoPlayer.tsx` | Custom HTML5 video player — play/pause, speed control, volume, fullscreen, progress scrubbing |
| `BookmarkPanel.tsx` | Bookmark management — create/delete bookmarks at current timestamp, click to seek |
| `InteractiveTranscript.tsx` | Clickable transcript with highlighted current segment, click-to-seek |
| `index.ts` | Barrel exports for all video components |

## For AI Agents

### Working In This Directory
- Video source is a presigned S3/MinIO URL fetched from backend
- Types are defined in `src/types/video.ts` (VideoPlayerProps, BookmarkPanelProps, etc.)
- Bookmarks persist via `VideoBookmarkService` API
- Components communicate via shared video element ref and timestamp callbacks

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
