"use client";

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LessonsService, LessonResponse, OpenAPI } from '@/lib/api';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { VideoPlayer } from '@/components/video';
import { Transcript } from '@/types/video';
import { getLessonVideoPlaybackUrl } from '@/lib/lessonVideoUploadService';

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function LessonPage() {
    const params = useParams();
    const lessonId = Number(params.lessonId);
    const courseId = params.courseId;
    const router = useRouter();

    const [lesson, setLesson] = useState<LessonResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [playbackRetryUsed, setPlaybackRetryUsed] = useState(false);

    const resolveVideoUrl = useCallback(async (lessonData: LessonResponse) => {
        if (lessonData.type !== 'VIDEO') {
            setVideoUrl(null);
            return;
        }

        try {
            const playback = await getLessonVideoPlaybackUrl(lessonData.id!);
            setVideoUrl(playback.url);
            return;
        } catch (error) {
            console.warn('Falling back to lesson videoUrl:', error);
        }

        setVideoUrl(lessonData.videoUrl || null);
    }, []);

    useEffect(() => {
        const fetchLesson = async () => {
            setLoading(true);
            try {
                const data = await LessonsService.getLessonById(lessonId);
                setLesson(data);
                setPlaybackRetryUsed(false);
                await resolveVideoUrl(data);
            } catch (err) {
                console.error("Failed to fetch lesson", err);
            } finally {
                setLoading(false);
            }
        };

        if (lessonId) {
            fetchLesson();
        }
    }, [lessonId, resolveVideoUrl]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center p-20">
                <Loader2 className="h-10 w-10 text-sky-600 animate-spin" />
            </div>
        );
    }

    if (!lesson) {
        return <div className="p-10">Lesson not found.</div>;
    }

    // Sample transcript - TODO: fetch from backend or generate
    const sampleTranscript: Transcript | undefined = videoUrl
        ? {
              lessonId: lessonId,
              language: 'en',
              segments: [
                  {
                      id: 1,
                      startTime: 0,
                      endTime: 10,
                      text: `Welcome to ${lesson.title}. In this lesson, we'll cover important concepts.`,
                  },
                  // Add more segments as needed
              ],
          }
        : undefined;

    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Video Player Area - Using Advanced Video Player */}
            {lesson.type === 'VIDEO' && videoUrl && (
                <div className="mb-8">
                    <VideoPlayer
                        videoUrl={videoUrl}
                        lessonId={lessonId}
                        transcript={sampleTranscript}
                        autoPlay={false}
                        onPlaybackError={async () => {
                            if (!lesson.id || playbackRetryUsed) return;
                            setPlaybackRetryUsed(true);
                            try {
                                const playback = await getLessonVideoPlaybackUrl(lesson.id);
                                setVideoUrl(playback.url);
                            } catch (error) {
                                console.error('Failed to refresh playback URL', error);
                            }
                        }}
                        onTimeUpdate={(time) => {
                            // Track video progress for analytics
                            console.log(`Watching at ${time}s`);
                        }}
                        onEnded={() => {
                            // Auto-mark as complete or suggest next lesson
                            console.log('Video completed');
                        }}
                    />
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
                    <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Complete
                    </Button>
                </div>
                <Separator />
            </div>

            {/* Description */}
            {lesson.description && (
                <div className="mb-6">
                    <p className="text-slate-600">{lesson.description}</p>
                </div>
            )}

            {/* Content */}
            {lesson.content && (
                <div className="prose max-w-none text-slate-700 mb-12 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-xl font-semibold mb-4">Lesson Content</h2>
                    <div dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />
                </div>
            )}

            {!lesson.content && !videoUrl && (
                <p className="italic text-gray-500 text-center py-8">
                    No content available for this lesson.
                </p>
            )}

            {/* Navigation Footer */}
            <div className="flex justify-between mt-auto pt-8 border-t border-slate-200">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>
                <Button onClick={() => { /* Logic to find next lesson */ }}>
                    Next Lesson
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
