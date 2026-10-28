'use client';

import React from 'react';
import { VideoPlayer } from '@/components/video';
import { Transcript } from '@/types/video';

export default function VideoPlayerDemo() {
  // Sample transcript data
  const sampleTranscript: Transcript = {
    lessonId: 1,
    language: 'en',
    segments: [
      {
        id: 1,
        startTime: 0,
        endTime: 5,
        text: 'Welcome to this advanced mathematics course. Today we will explore calculus fundamentals.',
      },
      {
        id: 2,
        startTime: 5,
        endTime: 12,
        text: 'Calculus is the mathematical study of continuous change, much like geometry is the study of shapes.',
      },
      {
        id: 3,
        startTime: 12,
        endTime: 20,
        text: 'It has two major branches: differential calculus, which concerns rates of change and slopes of curves.',
      },
      {
        id: 4,
        startTime: 20,
        endTime: 28,
        text: 'And integral calculus, which concerns the accumulation of quantities and areas under curves.',
      },
      {
        id: 5,
        startTime: 28,
        endTime: 35,
        text: 'These two branches are connected by the fundamental theorem of calculus.',
      },
      {
        id: 6,
        startTime: 35,
        endTime: 42,
        text: 'Let\'s start with the concept of a derivative. A derivative represents an instantaneous rate of change.',
      },
      {
        id: 7,
        startTime: 42,
        endTime: 50,
        text: 'For example, if you have a function that describes position over time, the derivative gives you velocity.',
      },
      {
        id: 8,
        startTime: 50,
        endTime: 58,
        text: 'The notation for a derivative is f prime of x, or df/dx, which means the derivative of f with respect to x.',
      },
    ],
  };

  // Sample video URL - replace with your actual video
  const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">
            Advanced Video Player Demo
          </h1>
          <p className="text-gray-300 text-lg">
            Experience immersive learning with bookmarks, interactive transcripts, and picture-in-picture
          </p>
        </div>

        {/* Video Player */}
        <VideoPlayer
          videoUrl={videoUrl}
          lessonId={1}
          transcript={sampleTranscript}
          autoPlay={false}
          onTimeUpdate={(time) => console.log('Current time:', time)}
          onEnded={() => console.log('Video ended')}
        />

        {/* Features List */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-sky-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-xl mb-2">Smart Bookmarks</h3>
            <p className="text-gray-400">
              Save notes at specific timestamps. Click the bookmark icon or press &apos;B&apos; to add a new bookmark at the current position.
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-sky-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-xl mb-2">Interactive Transcript</h3>
            <p className="text-gray-400">
              Click on any part of the transcript to jump directly to that moment in the video. The transcript auto-scrolls and highlights.
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-sky-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-xl mb-2">Picture-in-Picture</h3>
            <p className="text-gray-400">
              Continue watching while browsing other content. Click the PiP icon to enable floating video mode.
            </p>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mt-12 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-semibold text-xl mb-4">Keyboard Shortcuts</h3>
          <div className="grid md:grid-cols-2 gap-4 text-gray-300">
            <div className="flex items-center gap-3">
              <kbd className="px-3 py-1 bg-gray-700 rounded font-mono text-sm">Space</kbd>
              <span>Play / Pause</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-3 py-1 bg-gray-700 rounded font-mono text-sm">←</kbd>
              <span>Skip backward 10s</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-3 py-1 bg-gray-700 rounded font-mono text-sm">→</kbd>
              <span>Skip forward 10s</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-3 py-1 bg-gray-700 rounded font-mono text-sm">M</kbd>
              <span>Mute / Unmute</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-3 py-1 bg-gray-700 rounded font-mono text-sm">F</kbd>
              <span>Fullscreen</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-3 py-1 bg-gray-700 rounded font-mono text-sm">B</kbd>
              <span>Toggle bookmarks</span>
            </div>
          </div>
        </div>

        {/* Integration Example */}
        <div className="mt-12 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-semibold text-xl mb-4">Integration Example</h3>
          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm">
            <code className="text-gray-300">{`import { VideoPlayer } from '@/components/video';

<VideoPlayer
  videoUrl="your-video-url.mp4"
  lessonId={lessonId}
  transcript={transcriptData}
  autoPlay={false}
  onTimeUpdate={(time) => console.log('Current time:', time)}
  onEnded={() => console.log('Video ended')}
/>`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
