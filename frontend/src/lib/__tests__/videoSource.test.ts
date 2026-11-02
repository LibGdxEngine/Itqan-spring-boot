import { describe, it, expect } from 'vitest';
import { guessMediaMimeType, isAudioSource, parseVideoSource } from '@/lib/videoSource';

describe('isAudioSource', () => {
  it('trusts the uploaded MIME type first', () => {
    expect(isAudioSource('https://x.test/lessons/1/a.mp4', 'audio/mpeg')).toBe(true);
    expect(isAudioSource('https://x.test/lessons/1/a.mp3', 'video/mp4')).toBe(false);
  });

  it('falls back to the extension, ignoring presigned query strings', () => {
    expect(isAudioSource('https://x.test/itqan-videos/lessons/1/abc-lesson.mp3?X-Amz-Signature=1&a=b.mp4')).toBe(true);
    expect(isAudioSource('https://x.test/lessons/1/abc-lesson.M4A')).toBe(true);
    expect(isAudioSource('https://x.test/lessons/1/abc-lesson.mp4?x=.mp3')).toBe(false);
  });

  it('never treats YouTube or empty URLs as audio', () => {
    expect(isAudioSource('https://youtu.be/dQw4w9WgXcQ')).toBe(false);
    expect(isAudioSource('')).toBe(false);
    expect(isAudioSource(null)).toBe(false);
  });

  it('keeps YouTube parsing unchanged', () => {
    expect(parseVideoSource('https://youtu.be/dQw4w9WgXcQ')).toEqual({ kind: 'youtube', videoId: 'dQw4w9WgXcQ' });
  });
});

describe('guessMediaMimeType', () => {
  it('keeps the browser type when present', () => {
    expect(guessMediaMimeType({ name: 'a.mp3', type: 'audio/mpeg' })).toBe('audio/mpeg');
  });

  it('maps empty types from the extension', () => {
    expect(guessMediaMimeType({ name: 'lesson.m4a', type: '' })).toBe('audio/mp4');
    expect(guessMediaMimeType({ name: 'lesson.opus', type: '' })).toBe('audio/ogg');
    expect(guessMediaMimeType({ name: 'clip.MOV', type: '' })).toBe('video/quicktime');
    expect(guessMediaMimeType({ name: 'noext', type: '' })).toBe('application/octet-stream');
  });
});
