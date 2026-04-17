'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture2, Bookmark } from 'lucide-react';
import { VideoPlayerProps, VideoBookmark } from '@/types/video';
import { VideoBookmarkService, PictureInPictureService } from '@/lib/videoService';
import { BookmarkPanel } from './BookmarkPanel';
import { InteractiveTranscript } from './InteractiveTranscript';

export function VideoPlayer({
  videoUrl,
  lessonId,
  transcript,
  autoPlay = false,
  onTimeUpdate,
  onEnded,
  onPlaybackError,
}: VideoPlayerProps) {
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

  // Load bookmarks on mount
  useEffect(() => {
    loadBookmarks();
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

  const loadBookmarks = async () => {
    try {
      const data = await VideoBookmarkService.getBookmarksByLesson(lessonId);
      setBookmarks(data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  };

  const togglePlay = () => {
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
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    handleSeek(percent * duration);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const skipForward = () => {
    handleSeek(Math.min(currentTime + 10, duration));
  };

  const skipBackward = () => {
    handleSeek(Math.max(currentTime - 10, 0));
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
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
    const note = prompt('Add a note for this bookmark:');
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
    const note = prompt('Edit note:', bookmark.note);
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

  return (
    <div className="w-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      <div className="relative aspect-video bg-black">
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
        />

        {/* Bookmark markers on progress bar */}
        <div className="absolute bottom-20 left-0 right-0 h-2 pointer-events-none px-4">
          {bookmarks.map((bookmark) => {
            const position = duration > 0 ? (bookmark.timestamp / duration) * 100 : 0;
            return (
              <div
                key={bookmark.id}
                className="absolute w-2 h-4 -mt-1 bg-yellow-400 rounded-sm"
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
          className="w-full h-2 bg-gray-700 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-sky-500 rounded-full transition-all group-hover:bg-sky-400"
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateBookmark}
              className="p-2 hover:bg-gray-700 rounded-full transition"
              title="Add bookmark (B)"
            >
              <Bookmark size={20} />
            </button>

            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className={`px-3 py-1 rounded text-sm transition ${
                showBookmarks ? 'bg-sky-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Bookmarks ({bookmarks.length})
            </button>

            {transcript && (
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`px-3 py-1 rounded text-sm transition ${
                  showTranscript ? 'bg-sky-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Transcript
              </button>
            )}

            <button
              onClick={togglePictureInPicture}
              className="p-2 hover:bg-gray-700 rounded-full transition"
              title="Picture-in-Picture"
            >
              <PictureInPicture2 size={20} />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-700 rounded-full transition"
              title="Fullscreen (F)"
            >
              <Maximize size={20} />
            </button>
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
