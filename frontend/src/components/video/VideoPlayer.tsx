'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture2, Bookmark, Headphones } from 'lucide-react';
import { VideoPlayerProps, VideoBookmark } from '@/types/video';
import { VideoBookmarkService, PictureInPictureService } from '@/lib/videoService';
import { isAudioSource, parseVideoSource } from '@/lib/videoSource';
import { BookmarkPanel } from './BookmarkPanel';
import { InteractiveTranscript } from './InteractiveTranscript';
import { useYouTubePlayer } from './useYouTubePlayer';

export function VideoPlayer({
  videoUrl,
  lessonId,
  transcript,
  autoPlay = false,
  startAt,
  onTimeUpdate,
  onEnded,
  onPlaybackError,
  mimeType,
  title,
}: VideoPlayerProps) {
  const t = useTranslations('lesson.player');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [bookmarks, setBookmarks] = useState<VideoBookmark[]>([]);
  const [isPiPActive, setIsPiPActive] = useState(false);
  // Resume once per mount, then let the student seek freely.
  const resumedRef = useRef(false);
  const seekYouTubeRef = useRef<(seconds: number) => void>(() => {});
  const resumeTarget = (videoDuration: number) => {
    if (resumedRef.current) return null;
    resumedRef.current = true;
    if (!startAt || startAt < 5 || (videoDuration > 0 && startAt > videoDuration - 10)) return null;
    return startAt;
  };

  // A pasted YouTube link can't load in a <video> element — it must be driven
  // through the IFrame Player API instead. Everything else is a plain file.
  const source = parseVideoSource(videoUrl);
  const isYouTube = source.kind === 'youtube';
  const youTubeVideoId = source.kind === 'youtube' ? source.videoId : null;
  // Audio lessons use the same <video> element (it plays audio natively) with a poster instead of a picture.
  const isAudio = !isYouTube && isAudioSource(videoUrl, mimeType);

  const yt = useYouTubePlayer({
    videoId: youTubeVideoId,
    autoPlay,
    initialVolume: volume,
    initialMuted: isMuted,
    initialPlaybackRate: playbackSpeed,
    onReady: (videoDuration) => {
      setDuration(videoDuration);
      const target = resumeTarget(videoDuration);
      if (target !== null) {
        seekYouTubeRef.current(target);
        setCurrentTime(target);
      }
    },
    onPlayingChange: (playing) => setIsPlaying(playing),
    onTime: (time) => {
      setCurrentTime(time);
      onTimeUpdate?.(time);
    },
    onEnded: () => {
      setIsPlaying(false);
      onEnded?.();
    },
    onError: (code) => console.error('YouTube player error', code),
  });

  const { containerRef: ytContainerRef, seekTo: ytSeekTo } = yt;
  useEffect(() => {
    seekYouTubeRef.current = ytSeekTo;
  });

  const loadBookmarks = async () => {
    // Previews (no lesson) have no bookmarks.
    if (!lessonId) return;
    try {
      const data = await VideoBookmarkService.getBookmarksByLesson(lessonId);
      setBookmarks(data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  };

  const togglePlay = () => {
    if (isYouTube) {
      if (isPlaying) yt.pause();
      else yt.play();
      return; // play/pause state is reflected via onPlayingChange
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      const target = resumeTarget(videoRef.current.duration);
      if (target !== null) {
        videoRef.current.currentTime = target;
        setCurrentTime(target);
      }
    }
  };

  const handleSeek = (time: number) => {
    if (isYouTube) {
      yt.seekTo(time);
      setCurrentTime(time);
      return;
    }
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // The bar is forced to dir="ltr", so this left-based fraction is correct in
    // both LTR and RTL. Clamp so edge/overshoot clicks stay within [0, 1].
    const percent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    handleSeek(percent * duration);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    if (isYouTube) {
      if (nextMuted) yt.mute();
      else yt.unMute();
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (isYouTube) {
      yt.setVolume(newVolume);
      if (newVolume === 0) yt.mute();
      else yt.unMute();
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const changePlaybackSpeed = (speed: number) => {
    if (isYouTube) {
      yt.setPlaybackRate(speed);
    } else if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setPlaybackSpeed(speed);
  };

  const skipForward = () => {
    handleSeek(Math.min(currentTime + 10, duration));
  };

  const skipBackward = () => {
    handleSeek(Math.max(currentTime - 10, 0));
  };

  const toggleFullscreen = () => {
    if (isAudio) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    if (isYouTube) {
      yt.requestFullscreen();
    } else if (videoRef.current) {
      videoRef.current.requestFullscreen();
    }
  };

  const togglePictureInPicture = async () => {
    try {
      if (videoRef.current) {
        if (isPiPActive) {
          await PictureInPictureService.exitPiP();
          setIsPiPActive(false);
        } else {
          await PictureInPictureService.requestPiP(videoRef.current);
          setIsPiPActive(true);
        }
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  const handleCreateBookmark = async () => {
    const note = prompt(t('addNotePrompt'));
    if (note !== null) {
      try {
        await VideoBookmarkService.createBookmark(lessonId, {
          timestamp: currentTime,
          note: note || '',
        });
        await loadBookmarks();
      } catch (error) {
        console.error('Failed to create bookmark:', error);
      }
    }
  };

  const handleDeleteBookmark = async (bookmarkId: number) => {
    try {
      await VideoBookmarkService.deleteBookmark(bookmarkId);
      await loadBookmarks();
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  const handleEditBookmark = async (bookmark: VideoBookmark) => {
    const note = prompt(t('editNotePrompt'), bookmark.note);
    if (note !== null) {
      try {
        await VideoBookmarkService.updateBookmark(bookmark.id, {
          timestamp: bookmark.timestamp,
          note: note || '',
        });
        await loadBookmarks();
      } catch (error) {
        console.error('Failed to update bookmark:', error);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;


  // Effects sit below the handlers they call (they must be declared first).
  // Load bookmarks when the lesson changes
  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    VideoBookmarkService.getBookmarksByLesson(lessonId)
      .then((data) => {
        if (!cancelled) setBookmarks(data);
      })
      .catch((error) => console.error('Failed to load bookmarks:', error));
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'b':
        case 'B':
          setShowBookmarks(!showBookmarks);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, showBookmarks]);

  return (
    <div className="w-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      <div className={`relative bg-black ${isAudio ? 'h-44 sm:h-52' : 'aspect-video'}`}>
        {isYouTube ? (
          <div ref={ytContainerRef} className="w-full h-full" />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={onEnded}
            onError={onPlaybackError}
            autoPlay={autoPlay}
            playsInline
            preload="metadata"
          />
        )}

        {isAudio && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? t('pause') : t('play')}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand to-gray-900 px-6 text-center text-white"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
              <Headphones size={30} />
            </span>
            {title ? <span className="line-clamp-2 max-w-xl text-base font-semibold">{title}</span> : null}
            <span aria-hidden className="flex h-6 items-end gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full bg-white/80 ${isPlaying ? 'animate-pulse' : ''}`}
                  style={{
                    height: isPlaying ? `${[40, 90, 60, 100, 50][i]}%` : '20%',
                    animationDelay: `${i * 150}ms`,
                    transition: 'height 300ms ease',
                  }}
                />
              ))}
            </span>
            <span className="text-xs text-white/70">{t('audioLesson')}</span>
          </button>
        )}

        {/* Bookmark markers on progress bar */}
        <div className="absolute bottom-20 start-0 end-0 h-2 pointer-events-none px-4">
          {bookmarks.map((bookmark) => {
            const position = duration > 0 ? (bookmark.timestamp / duration) * 100 : 0;
            return (
              <div
                key={bookmark.id}
                className="absolute w-2 h-4 -mt-1 bg-brand rounded-sm"
                style={{ left: `${position}%` }}
                title={bookmark.note}
              />
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-t from-gray-900 to-gray-800 p-4 space-y-3">
        {/* Progress bar */}
        <div
          dir="ltr"
          className="w-full h-2 bg-gray-700 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-brand rounded-full transition-all group-hover:bg-coral"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-gray-700 rounded-full transition"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="p-2 hover:bg-gray-700 rounded-full transition">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <select
              value={playbackSpeed}
              onChange={(e) => changePlaybackSpeed(parseFloat(e.target.value))}
              className="bg-gray-700 px-2 py-1 rounded text-sm"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>

          <div className={`flex items-center gap-2 ${lessonId ? '' : 'hidden'}`}>
            <button
              onClick={handleCreateBookmark}
              className="p-2 hover:bg-gray-700 rounded-full transition"
              title={t('addBookmarkTitle')}
            >
              <Bookmark size={20} />
            </button>

            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className={`px-3 py-1 rounded text-sm transition ${
                showBookmarks ? 'bg-brand' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {t('bookmarks')} ({bookmarks.length})
            </button>

            {transcript && (
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`px-3 py-1 rounded text-sm transition ${
                  showTranscript ? 'bg-brand' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {t('transcript')}
              </button>
            )}

            {!isYouTube && !isAudio && (
              <button
                onClick={togglePictureInPicture}
                className="p-2 hover:bg-gray-700 rounded-full transition"
                title={t('pictureInPicture')}
              >
                <PictureInPicture2 size={20} />
              </button>
            )}

            {!isAudio && (
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-gray-700 rounded-full transition"
                title={t('fullscreen')}
              >
                <Maximize size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bookmark Panel */}
      {showBookmarks && (
        <div className="border-t border-gray-700">
          <BookmarkPanel
            bookmarks={bookmarks}
            onSeek={handleSeek}
            onEdit={handleEditBookmark}
            onDelete={handleDeleteBookmark}
            onCreate={handleCreateBookmark}
          />
        </div>
      )}

      {/* Transcript Panel */}
      {showTranscript && transcript && (
        <div className="border-t border-gray-700">
          <InteractiveTranscript
            transcript={transcript}
            currentTime={currentTime}
            onSeek={handleSeek}
          />
        </div>
      )}
    </div>
  );
}
