// Helpers for figuring out how a lesson's video URL should be played.
//
// Uploaded videos are served as plain media files (presigned S3/MinIO URLs) and
// play in a native <video> element. Externally-hosted videos pasted by an
// instructor may be YouTube links, which cannot load in a <video> element and
// must be embedded via the YouTube IFrame Player API instead.

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extract the 11-character video id from the common YouTube URL forms:
 *   - https://www.youtube.com/watch?v=<id>
 *   - https://www.youtube.com/embed/<id>
 *   - https://youtu.be/<id>
 *   - https://www.youtube.com/shorts/<id> | /live/<id> | /v/<id>
 * Tolerates `www.`/`m.` hosts, the `-nocookie` variant, and extra query params
 * (e.g. `?t=30`, `&list=...`). Returns null for anything that isn't YouTube.
 */
export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www\.|m\.)/, '');

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return YT_ID.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v');
      if (v && YT_ID.test(v)) return v;

      const match = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
      if (match) return match[1];
    }

    return null;
  } catch {
    // Not a parseable absolute URL — fall back to a permissive regex.
    const match = url.match(
      /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|live\/|v\/|watch\?(?:[^#]*&)?v=))([A-Za-z0-9_-]{11})/,
    );
    return match ? match[1] : null;
  }
}

export type VideoSource =
  | { kind: 'youtube'; videoId: string }
  | { kind: 'file'; url: string };

/** Classify a video URL as a YouTube embed or a directly-playable file. */
export function parseVideoSource(url: string): VideoSource {
  const videoId = getYouTubeVideoId(url);
  if (videoId) return { kind: 'youtube', videoId };
  return { kind: 'file', url };
}

// ---------------------------------------------------------------------------
// Audio lessons. Instructors can upload audio (mp3, m4a…) to a VIDEO lesson;
// it plays in the same <video> element, which handles audio natively, and
// the player swaps the empty picture area for an audio poster.

const AUDIO_EXTENSIONS: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/ogg',
  flac: 'audio/flac',
  amr: 'audio/amr',
  weba: 'audio/webm',
};

const VIDEO_EXTENSIONS: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  mpg: 'video/mpeg',
  mpeg: 'video/mpeg',
  flv: 'video/x-flv',
};

/** What the lesson file pickers accept: any audio/video type plus extensions some pickers need spelled out. */
export const MEDIA_FILE_ACCEPT = [
  'video/*',
  'audio/*',
  ...Object.keys(AUDIO_EXTENSIONS).map((ext) => `.${ext}`),
].join(',');

function extensionOf(pathOrName: string): string {
  let path = pathOrName;
  try {
    // Presigned URLs carry a long query string; only the path matters.
    path = new URL(pathOrName).pathname;
  } catch {
    path = pathOrName.split(/[?#]/)[0];
  }
  const dot = path.lastIndexOf('.');
  return dot >= 0 ? path.slice(dot + 1).toLowerCase() : '';
}

/** True when a lesson/preview source is an audio file rather than a video. */
export function isAudioSource(url: string | null | undefined, mimeType?: string | null): boolean {
  if (mimeType) {
    const type = mimeType.toLowerCase();
    if (type.startsWith('audio/')) return true;
    if (type.startsWith('video/')) return false;
  }
  if (!url || getYouTubeVideoId(url)) return false;
  return extensionOf(url) in AUDIO_EXTENSIONS;
}

/**
 * The MIME type to declare for an upload. Browsers leave `file.type` empty for
 * some audio (.m4a, .opus on Windows), so fall back to the extension.
 */
export function guessMediaMimeType(file: { name: string; type: string }): string {
  if (file.type) return file.type;
  const ext = extensionOf(file.name);
  return AUDIO_EXTENSIONS[ext] ?? VIDEO_EXTENSIONS[ext] ?? 'application/octet-stream';
}
