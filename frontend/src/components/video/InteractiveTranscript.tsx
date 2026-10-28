'use client';

import React, { useEffect, useRef } from 'react';
import { InteractiveTranscriptProps } from '@/types/video';

export function InteractiveTranscript({
  transcript,
  currentTime,
  onSeek,
}: InteractiveTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Find the active segment based on current time
  const activeSegmentId = transcript.segments.findIndex(
    (seg) => currentTime >= seg.startTime && currentTime < seg.endTime
  );

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current && containerRef.current) {
      const container = containerRef.current;
      const segment = activeSegmentRef.current;
      const containerHeight = container.clientHeight;
      const segmentTop = segment.offsetTop;
      const segmentHeight = segment.clientHeight;

      const scrollTop = segmentTop - containerHeight / 2 + segmentHeight / 2;
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      });
    }
  }, [activeSegmentId]);

  return (
    <div 
      ref={containerRef}
      className="bg-gray-800 p-4 max-h-96 overflow-y-auto"
    >
      <h3 className="text-white font-semibold text-lg mb-4">Transcript</h3>
      
      {transcript.segments.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          No transcript available for this video.
        </p>
      ) : (
        <div className="space-y-2">
          {transcript.segments.map((segment, index) => {
            const isActive = index === activeSegmentId;
            
            return (
              <div
                key={segment.id}
                ref={isActive ? activeSegmentRef : null}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  isActive
                    ? 'bg-brand text-on-night'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-650'
                }`}
                onClick={() => onSeek(segment.startTime)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono opacity-75 mt-1 shrink-0">
                    {formatTime(segment.startTime)}
                  </span>
                  <p className="text-sm leading-relaxed">{segment.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
