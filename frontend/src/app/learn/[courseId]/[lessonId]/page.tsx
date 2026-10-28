"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LessonsService, LessonResponse, OpenAPI } from '@/lib/api';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle, ClipboardCheck, AlertTriangle, Download, Paperclip } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { VideoPlayer } from '@/components/video';
import { MarkdownRenderer } from '@/components/articles/MarkdownRenderer';
import { getLessonVideoPlaybackUrl } from '@/lib/lessonVideoUploadService';
import { learningApi } from '@/lib/learning-api';
import { useLearn } from '@/components/learning/learn-context';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
    motion,
    AnimatePresence,
    useReducedMotion,
} from 'framer-motion';
import { EASE, fadeUp, staggerParent } from '@/lib/motion';

type LessonWithQuiz = LessonResponse & { quizId?: number };

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';




export default function LessonPage() {
    const params = useParams();
    const lessonId = Number(params.lessonId);
    const courseId = params.courseId;
    const router = useRouter();
    const t = useTranslations();
    const reduced = useReducedMotion();
    const { toast } = useToast();
    const { orderedLessons, completedLessonIds, studentId, markComplete, enrolled, positions, savePosition } =
        useLearn();

    const [lesson, setLesson] = useState<LessonWithQuiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [playbackRetryUsed, setPlaybackRetryUsed] = useState(false);
    const [playbackError, setPlaybackError] = useState(false);
    const [marking, setMarking] = useState(false);
    const lastTimeRef = useRef(0);
    const lastSavedRef = useRef(0);

    // Remember this as the lesson to continue from.
    useEffect(() => {
        if (enrolled && lessonId) void learningApi.activity(lessonId).catch(() => undefined);
    }, [enrolled, lessonId]);

    // Save the resume point when leaving the lesson.
    useEffect(() => {
        return () => {
            if (lastTimeRef.current > 0 && Math.abs(lastTimeRef.current - lastSavedRef.current) >= 3) {
                savePosition(lessonId, lastTimeRef.current);
            }
        };
    }, [lessonId, savePosition]);

    const handleTimeUpdate = (seconds: number) => {
        lastTimeRef.current = seconds;
        if (Math.abs(seconds - lastSavedRef.current) >= 15) {
            lastSavedRef.current = seconds;
            savePosition(lessonId, seconds);
        }
    };

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
            <div className="flex min-h-[60vh] items-center justify-center p-20">
                <div className="relative flex h-12 w-12 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-20" />
                    <motion.span
                        className="relative h-8 w-8 rounded-full border-2 border-line-strong border-t-brand"
                        animate={reduced ? undefined : { rotate: 360 }}
                        transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                    />
                </div>
            </div>
        );
    }

    if (!lesson) {
        return <div className="p-10 text-ink-2">{t('lesson.notFound')}</div>;
    }

    const isVideoLesson = lesson.type === 'VIDEO';
    // Compared as a string: the generated client predates the RESOURCE lesson type.
    const resourceUrl = (lesson.type as string | undefined) === 'RESOURCE' ? lesson.resourceUrl : undefined;
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
        <motion.div
            className="max-w-7xl mx-auto p-6 sm:p-8 flex flex-col min-h-full"
            initial={reduced ? false : 'hidden'}
            animate="visible"
            variants={staggerParent}
        >
            {/* Video Player Area - Using Advanced Video Player */}
            {isVideoLesson && videoUrl && (
                <motion.div variants={fadeUp} className="mb-8">
                    <div className="overflow-hidden rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] ring-1 ring-line-strong">
                        <VideoPlayer
                            videoUrl={videoUrl}
                            lessonId={lessonId}
                            autoPlay={false}
                            startAt={positions[lessonId]}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={() => {
                                lastTimeRef.current = 0;
                                lastSavedRef.current = 0;
                                savePosition(lessonId, 0);
                                if (studentId != null && !completedLessonIds.has(lessonId)) {
                                    void markComplete(lessonId)
                                        .then(() => toast({ title: t('lesson.autoCompleted') }))
                                        .catch(() => undefined);
                                }
                            }}
                            onPlaybackError={async () => {
                                if (!lesson.id || playbackRetryUsed) return;
                                await retryPlayback();
                            }}
                        />
                    </div>
                </motion.div>
            )}

            {showProcessing && (
                <motion.div
                    variants={fadeUp}
                    className="mb-8 flex items-center gap-3 rounded-xl border border-line-strong bg-surface p-6 text-ink-button"
                >
                    <Loader2 className="h-5 w-5 animate-spin text-brand" />
                    <span>{t('lesson.videoProcessing')}</span>
                </motion.div>
            )}

            {showFailed && (
                <motion.div
                    variants={fadeUp}
                    className="mb-8 flex flex-col gap-3 rounded-xl border border-danger-line bg-brand-soft p-6 text-danger sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="flex items-center gap-3 ltr-flex">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <span>{t('lesson.videoFailed')}</span>
                    </div>
                    <button
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-danger-line px-4 text-xs font-medium text-danger transition hover:bg-brand-soft"
                        onClick={() => void retryPlayback()}
                    >
                        {t('lesson.videoTryAgain')}
                    </button>
                </motion.div>
            )}

            {/* Header */}
            <motion.div variants={fadeUp} className="mb-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-ink leading-tight">
                        {lesson.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 ltr-flex">
                        {lesson.quizId && (
                            <Link
                                href={`/learn/${courseId}/${lessonId}/quiz`}
                                className="group inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white shadow-[0_0_0_1px_var(--color-brand)] transition-all hover:bg-brand-hover hover:shadow-[0_6px_16px_rgba(201,100,66,0.3)] hover:-translate-y-0.5 active:translate-y-0 ltr-flex"
                            >
                                <ClipboardCheck className="h-4 w-4" />
                                {t("quiz.lesson.startQuiz")}
                            </Link>
                        )}
                        {studentId != null && (
                            <motion.button
                                type="button"
                                onClick={handleMarkComplete}
                                disabled={isCompleted || marking}
                                whileTap={isCompleted || marking ? undefined : { scale: 0.97 }}
                                animate={
                                    reduced
                                        ? undefined
                                        : isCompleted
                                          ? { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }
                                          : { backgroundColor: 'rgba(0,0,0,0)', borderColor: '#e8e6dc' }
                                }
                                transition={{ duration: 0.4, ease: EASE }}
                                className={cn(
                                    'inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors disabled:cursor-default ltr-flex',
                                    isCompleted
                                        ? 'border-emerald-200 bg-success-soft text-success disabled:opacity-100'
                                        : 'border-line-strong text-brand hover:bg-subtle disabled:opacity-60',
                                )}
                            >
                                <span className="relative flex h-4 w-4 items-center justify-center">
                                    <AnimatePresence mode="wait" initial={false}>
                                        {marking ? (
                                            <motion.span
                                                key="spin"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="check"
                                                initial={
                                                    reduced ? false : { scale: 0.5, opacity: 0 }
                                                }
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 500,
                                                    damping: 26,
                                                }}
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </span>
                                {isCompleted ? t('lesson.completed') : t('lesson.markComplete')}
                            </motion.button>
                        )}
                    </div>
                </div>
                <Separator />
            </motion.div>

            {/* Description */}
            {lesson.description && (
                <motion.div variants={fadeUp} className="mb-6">
                    <p className="text-[17px] leading-[1.7] text-ink-2">{lesson.description}</p>
                </motion.div>
            )}

            {/* Content */}
            {lesson.content && (
                <motion.div
                    variants={fadeUp}
                    className="prose max-w-none text-ink-button mb-12 bg-surface rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)] border border-line-strong"
                >
                    <h2 className="text-xl font-semibold text-ink mb-4">
                        {t('lesson.lessonContent')}
                    </h2>
                    <MarkdownRenderer content={lesson.content} />
                </motion.div>
            )}

            {resourceUrl && (
                <motion.a
                    variants={fadeUp}
                    href={resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-12 flex items-center gap-4 rounded-2xl border border-line-strong bg-surface p-6 transition hover:border-brand hover:shadow-[0_4px_24px_rgba(0,0,0,0.05)]"
                >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                        <Paperclip className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{t('lesson.resourceTitle')}</span>
                        <span className="block text-sm text-ink-3">{t('lesson.resourceHint')}</span>
                    </span>
                    <Download className="h-5 w-5 shrink-0 text-brand" />
                </motion.a>
            )}

            {!lesson.content && !videoUrl && !showProcessing && !showFailed && !resourceUrl && !lesson.quizId && (
                <motion.p
                    variants={fadeUp}
                    className="italic text-ink-3 text-center py-12"
                >
                    {t('lesson.noContent')}
                </motion.p>
            )}

            {/* Navigation Footer */}
            <motion.div
                variants={fadeUp}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto pt-8 border-t border-line"
            >
                <NavCard
                    direction="prev"
                    label={t('lesson.previous')}
                    disabled={!prevLesson}
                    title={prevLesson?.title}
                    onClick={() =>
                        prevLesson && router.push(`/learn/${courseId}/${prevLesson.id}`)
                    }
                />
                <NavCard
                    direction="next"
                    label={t('lesson.nextLesson')}
                    disabled={!nextLesson}
                    title={nextLesson?.title}
                    onClick={() =>
                        nextLesson && router.push(`/learn/${courseId}/${nextLesson.id}`)
                    }
                />
            </motion.div>
        </motion.div>
    );
}

function NavCard({
    direction,
    label,
    title,
    disabled,
    onClick,
}: {
    direction: 'prev' | 'next';
    label: string;
    title?: string;
    disabled: boolean;
    onClick: () => void;
}) {
    const isNext = direction === 'next';
    const Chevron = isNext ? ChevronRight : ChevronLeft;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'group flex items-center gap-3 rounded-xl border p-4 text-start transition-all ltr-flex',
                isNext ? 'sm:flex-row-reverse sm:text-end' : '',
                disabled
                    ? 'cursor-not-allowed border-line bg-surface/50 opacity-50'
                    : 'border-line-strong bg-surface hover:border-brand/40 hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:-translate-y-0.5',
            )}
        >
            <span
                className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
                    disabled
                        ? 'bg-subtle text-on-night-2'
                        : 'bg-subtle text-ink-2 group-hover:bg-brand group-hover:text-white',
                )}
            >
                <Chevron className="h-4 w-4 rtl:rotate-180" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                    {label}
                </span>
                {title && (
                    <span className="mt-0.5 block truncate text-sm font-medium text-ink">
                        {title}
                    </span>
                )}
            </span>
        </button>
    );
}
