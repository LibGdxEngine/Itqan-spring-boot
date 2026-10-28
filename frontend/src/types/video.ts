// Video bookmark types
export interface VideoBookmark {
  id: number;
  studentId: number;
  lessonId: number;
  timestamp: number; // in seconds
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoBookmarkRequest {
  timestamp: number;
  note: string;
}

// Transcript types
export interface TranscriptSegment {
  id: number;
  startTime: number; // in seconds
  endTime: number;
  text: string;
}

export interface Transcript {
  lessonId: number;
  segments: TranscriptSegment[];
  language?: string;
}

// Video player props
export interface VideoPlayerProps {
  videoUrl: string;
  lessonId: number;
  transcript?: Transcript;
  autoPlay?: boolean;
  /** Resume point in seconds; ignored when it is within the last few seconds of the video. */
  startAt?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  onPlaybackError?: () => void;
}

export interface BookmarkPanelProps {
  bookmarks: VideoBookmark[];
  onSeek: (timestamp: number) => void;
  onEdit: (bookmark: VideoBookmark) => void;
  onDelete: (bookmarkId: number) => void;
  onCreate: () => void;
}

export interface InteractiveTranscriptProps {
  transcript: Transcript;
  currentTime: number;
  onSeek: (timestamp: number) => void;
}

export interface VideoBookmarkFormProps {
  initialBookmark?: VideoBookmark;
  currentTime?: number;
  onSave: (request: VideoBookmarkRequest) => void;
  onCancel: () => void;
}
