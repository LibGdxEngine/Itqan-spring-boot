"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LessonsService, LessonResponse, OpenAPI } from '@/lib/api';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { VideoPlayer } from '@/components/video';
import { getLessonVideoPlaybackUrl } from '@/lib/lessonVideoUploadService';
import { useLearn } from '@/components/learning/learn-context';
import { useToast } from '@/components/ui/use-toast';

type LessonWithQuiz = LessonResponse & { quizId?: number };

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function LessonPage() {
    const params = useParams();
    const lessonId = Number(params.lessonId);
    const courseId = params.courseId;
    const router = useRouter();
    const t = useTranslations();
    const { toast } = useToast();
    const { orderedLessons, completedLessonIds, studentId, markComplete } = useLearn();

    const [lesson, setLesson] = useState<LessonWithQuiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [playbackRetryUsed, setPlaybackRetryUsed] = useState(false);
    const [playbackError, setPlaybackError] = useState(false);
    const [marking, setMarking] = useState(false);

    const resolveVideoUrl = useCallback(async (lessonData: LessonResponse) => {
        if (lessonData.type !== 'VIDEO') {
            setVideoUrl(null);
            setPlaybackError(false);
            return;
        }

        try {
            const playback = await getLessonVideoPlaybackUrl(lessonData.id!);
            setVideoUrl(playback.url);
            setPlaybackError(false);
            return;
        } catch (error) {
            console.warn('Playback URL unavailable:', error);
        }

        if (lessonData.videoUrl) {
            setVideoUrl(lessonData.videoUrl);
            setPlaybackError(false);
        } else {
            setVideoUrl(null);
            setPlaybackError(true);
        }
    }, []);

    useEffect(() => {
        const fetchLesson = async () => {
            setLoading(true);
            try {
                const data = (await LessonsService.getLessonById(lessonId)) as LessonWithQuiz;
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
                <Loader2 className="h-10 w-10 text-[#c96442] animate-spin" />
            </div>
        );
    }

    if (!lesson) {
        return <div className="p-10">{t('lesson.notFound')}</div>;
    }

    const isVideoLesson = lesson.type === 'VIDEO';
    const status = lesson.videoStatus;
    const showProcessing = isVideoLesson && !videoUrl && (status === 'PENDING' || status === 'UPLOADING');
    const showFailed = isVideoLesson && !videoUrl && (status === 'FAILED' || (playbackError && status !== 'READY'));

    const retryPlayback = async () => {
        if (!lesson.id) return;
        setPlaybackRetryUsed(true);
        try {
            const playback = await getLessonVideoPlaybackUrl(lesson.id);
            setVideoUrl(playback.url);
            setPlaybackError(false);
        } catch (error) {
            console.error('Failed to refresh playback URL', error);
            setPlaybackError(true);
        }
    };

    // Lesson navigation derived from the ordered list shared via the learn context.
    const currentIndex = orderedLessons.findIndex((l) => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
    const nextLesson =
        currentIndex >= 0 && currentIndex < orderedLessons.length - 1
            ? orderedLessons[currentIndex + 1]
            : null;
    const isCompleted = completedLessonIds.has(lessonId);

    const handleMarkComplete = async () => {
        if (marking || isCompleted) return;
        setMarking(true);
        try {
            await markComplete(lessonId);
            toast({ title: t('lesson.markCompleteSuccess') });
        } catch (error) {
            console.error('Failed to mark lesson complete', error);
            toast({ title: t('lesson.markCompleteError'), variant: 'destructive' });
        } finally {
            setMarking(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Video Player Area - Using Advanced Video Player */}
            {isVideoLesson && videoUrl && (
                <div className="mb-8">
                    <VideoPlayer
                        videoUrl={videoUrl}
                        lessonId={lessonId}
                        autoPlay={false}
                        onPlaybackError={async () => {
                            if (!lesson.id || playbackRetryUsed) return;
                            await retryPlayback();
                        }}
                        onTimeUpdate={(time) => {
                            console.log(`Watching at ${time}s`);
                        }}
                        onEnded={() => {
                            console.log('Video completed');
                        }}
                    />
                </div>
            )}

            {showProcessing && (
                <div className="mb-8 flex items-center gap-3 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] p-6 text-[#4d4c48]">
                    <Loader2 className="h-5 w-5 animate-spin text-[#c96442]" />
                    <span>{t('lesson.videoProcessing')}</span>
                </div>
            )}

            {showFailed && (
                <div className="mb-8 flex flex-col gap-3 rounded-xl border border-[#f3c9be] bg-[#fdf3ef] p-6 text-[#b53333] sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5" />
                        <span>{t('lesson.videoFailed')}</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-[#f3c9be] text-[#b53333] hover:bg-[#f9e2da]"
                        onClick={() => void retryPlayback()}
                    >
                        {t('lesson.videoTryAgain')}
                    </Button>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        {lesson.quizId && (
                            <Link
                                href={`/learn/${courseId}/${lessonId}/quiz`}
                                className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#c96442] px-4 text-sm font-medium text-white transition hover:bg-[#b3573a]"
                            >
                                <ClipboardCheck className="h-4 w-4" />
                                {t("quiz.lesson.startQuiz")}
                            </Link>
                        )}
                        {studentId != null && (
                            <Button
                                variant="outline"
                                onClick={handleMarkComplete}
                                disabled={isCompleted || marking}
                                className={
                                    isCompleted
                                        ? "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-50 disabled:opacity-100"
                                        : "text-[#c96442] border-[#e8e6dc] hover:bg-[#f0eee6]"
                                }
                            >
                                {marking ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                {isCompleted ? t('lesson.completed') : t('lesson.markComplete')}
                            </Button>
                        )}
                    </div>
                </div>
                <Separator />
            </div>

            {/* Description */}
            {lesson.description && (
                <div className="mb-6">
                    <p className="text-[#5e5d59]">{lesson.description}</p>
                </div>
            )}

            {/* Content */}
            {lesson.content && (
                <div className="prose max-w-none text-[#4d4c48] mb-12 bg-[#faf9f5] rounded-xl p-6 shadow-sm border border-[#e8e6dc]">
                    <h2 className="text-xl font-semibold mb-4">{t('lesson.lessonContent')}</h2>
                    <div dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />
                </div>
            )}

            {!lesson.content && !videoUrl && !showProcessing && !showFailed && (
                <p className="italic text-gray-500 text-center py-8">
                    {t('lesson.noContent')}
                </p>
            )}

            {/* Navigation Footer */}
            <div className="flex justify-between mt-auto pt-8 border-t border-[#f0eee6]">
                <Button
                    variant="ghost"
                    disabled={!prevLesson}
                    onClick={() => prevLesson && router.push(`/learn/${courseId}/${prevLesson.id}`)}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t('lesson.previous')}
                </Button>
                <Button
                    disabled={!nextLesson}
                    onClick={() => nextLesson && router.push(`/learn/${courseId}/${nextLesson.id}`)}
                >
                    {t('lesson.nextLesson')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
