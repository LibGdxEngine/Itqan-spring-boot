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
