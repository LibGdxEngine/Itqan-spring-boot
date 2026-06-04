'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';

const YT_API_SRC = 'https://www.youtube.com/iframe_api';

// Module-level singleton: the IFrame API script is loaded at most once and
// shared by every player instance on the page.
let apiPromise: Promise<typeof YT> | null = null;

function loadYouTubeApi(): Promise<typeof YT> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube IFrame API requires a browser environment'));
  }
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<typeof YT>((resolve) => {
    // Chain rather than clobber any callback another consumer registered.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };

    if (!document.querySelector(`script[src="${YT_API_SRC}"]`)) {
      const tag = document.createElement('script');
      tag.src = YT_API_SRC;
      document.head.appendChild(tag);
    }

    // Safety net in case the global callback already fired (or never does).
    const poll = window.setInterval(() => {
      if (window.YT && window.YT.Player) {
        window.clearInterval(poll);
        resolve(window.YT);
      }
    }, 100);
  });

  return apiPromise;
}

export interface UseYouTubePlayerOptions {
  /** YouTube video id, or null when the current source is not a YouTube video. */
  videoId: string | null;
  autoPlay?: boolean;
  /** Initial volume (0..1) applied once the player is ready. */
  initialVolume?: number;
  initialMuted?: boolean;
  initialPlaybackRate?: number;
  onReady?: (duration: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  onTime?: (currentTime: number) => void;
  onEnded?: () => void;
  onError?: (code: number) => void;
}

export interface YouTubePlayerControls {
  containerRef: RefObject<HTMLDivElement | null>;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  /** Volume as 0..1 (converted to YouTube's 0..100 internally). */
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  setPlaybackRate: (rate: number) => void;
  requestFullscreen: () => void;
}

/**
 * Drives a YouTube video through the IFrame Player API so the lesson player's
 * custom controls (progress bar, bookmarks, transcript, speed) work the same
 * way they do for uploaded videos. YouTube exposes no `timeupdate` event, so we
 * poll `getCurrentTime()` while playing.
 *
 * Pass `videoId: null` for non-YouTube sources — the hook stays inert.
 */
export function useYouTubePlayer(options: UseYouTubePlayerOptions): YouTubePlayerControls {
  const { videoId } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep the latest callbacks/options without re-creating the player each render.
  const optsRef = useRef(options);
  useEffect(() => {
    optsRef.current = options;
  });

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(() => {
      const player = playerRef.current;
      if (player && typeof player.getCurrentTime === 'function') {
        optsRef.current.onTime?.(player.getCurrentTime());
      }
    }, 250);
  }, [stopPolling]);

  useEffect(() => {
    if (!videoId) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    loadYouTubeApi()
      .then((api) => {
        if (cancelled) return;

        // The API replaces its target node with the generated <iframe>; give it
        // a dedicated child so our React-owned container ref stays intact.
        const mount = document.createElement('div');
        mount.style.width = '100%';
        mount.style.height = '100%';
        container.appendChild(mount);

        playerRef.current = new api.Player(mount, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: optsRef.current.autoPlay ? 1 : 0,
            controls: 0, // we render our own controls
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              const player = event.target;

              const { initialVolume, initialMuted, initialPlaybackRate } = optsRef.current;
              if (typeof initialVolume === 'number') {
                player.setVolume(Math.round(initialVolume * 100));
              }
              if (initialMuted) player.mute();
              if (typeof initialPlaybackRate === 'number') {
                player.setPlaybackRate(initialPlaybackRate);
              }

              const iframe = player.getIframe();
              if (iframe) {
                iframe.style.width = '100%';
                iframe.style.height = '100%';
              }

              optsRef.current.onReady?.(player.getDuration());
            },
            onStateChange: (event) => {
              if (cancelled) return;
              const playing = event.data === api.PlayerState.PLAYING;
              optsRef.current.onPlayingChange?.(playing);

              if (playing) {
                optsRef.current.onTime?.(event.target.getCurrentTime());
                startPolling();
              } else {
                stopPolling();
                if (event.data === api.PlayerState.ENDED) {
                  optsRef.current.onTime?.(event.target.getCurrentTime());
                  optsRef.current.onEnded?.();
                }
              }
            },
            onError: (event) => {
              optsRef.current.onError?.(event.data);
            },
          },
        });
      })
      .catch((error) => {
        console.error('Failed to load the YouTube IFrame API', error);
      });

    return () => {
      cancelled = true;
      stopPolling();
      const player = playerRef.current;
      playerRef.current = null;
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy();
        } catch {
          /* player may already be torn down */
        }
      }
      container.innerHTML = '';
    };
  }, [videoId, startPolling, stopPolling]);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const seekTo = useCallback((seconds: number) => playerRef.current?.seekTo(seconds, true), []);
  const setVolume = useCallback(
    (volume: number) => playerRef.current?.setVolume(Math.round(volume * 100)),
    [],
  );
  const mute = useCallback(() => playerRef.current?.mute(), []);
  const unMute = useCallback(() => playerRef.current?.unMute(), []);
  const setPlaybackRate = useCallback((rate: number) => playerRef.current?.setPlaybackRate(rate), []);
  const requestFullscreen = useCallback(() => {
    playerRef.current?.getIframe()?.requestFullscreen?.();
  }, []);

  return {
    containerRef,
    play,
    pause,
    seekTo,
    setVolume,
    mute,
    unMute,
    setPlaybackRate,
    requestFullscreen,
  };
}
