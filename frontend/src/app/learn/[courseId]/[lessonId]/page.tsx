"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LessonsService, LessonResponse, OpenAPI } from '@/lib/api';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { VideoPlayer } from '@/components/video';
import { getLessonVideoPlaybackUrl } from '@/lib/lessonVideoUploadService';
import { useLearn } from '@/components/learning/learn-context';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
    motion,
    AnimatePresence,
    useReducedMotion,
    type Variants,
} from 'framer-motion';

type LessonWithQuiz = LessonResponse & { quizId?: number };

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const staggerParent: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export default function LessonPage() {
    const params = useParams();
    const lessonId = Number(params.lessonId);
    const courseId = params.courseId;
    const router = useRouter();
    const t = useTranslations();
    const reduced = useReducedMotion();
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
            <div className="flex min-h-[60vh] items-center justify-center p-20">
                <div className="relative flex h-12 w-12 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c96442] opacity-20" />
                    <motion.span
                        className="relative h-8 w-8 rounded-full border-2 border-[#e8e6dc] border-t-[#c96442]"
                        animate={reduced ? undefined : { rotate: 360 }}
                        transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                    />
                </div>
            </div>
        );
    }

    if (!lesson) {
        return <div className="p-10 text-[#5e5d59]">{t('lesson.notFound')}</div>;
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
        <motion.div
            className="max-w-7xl mx-auto p-6 sm:p-8 flex flex-col min-h-full"
            initial={reduced ? false : 'hidden'}
            animate="visible"
            variants={staggerParent}
        >
            {/* Video Player Area - Using Advanced Video Player */}
            {isVideoLesson && videoUrl && (
                <motion.div variants={fadeUp} className="mb-8">
                    <div className="overflow-hidden rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] ring-1 ring-[#e8e6dc]">
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
                </motion.div>
            )}

            {showProcessing && (
                <motion.div
                    variants={fadeUp}
                    className="mb-8 flex items-center gap-3 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] p-6 text-[#4d4c48]"
                >
                    <Loader2 className="h-5 w-5 animate-spin text-[#c96442]" />
                    <span>{t('lesson.videoProcessing')}</span>
                </motion.div>
            )}

            {showFailed && (
                <motion.div
                    variants={fadeUp}
                    className="mb-8 flex flex-col gap-3 rounded-xl border border-[#f3c9be] bg-[#fdf3ef] p-6 text-[#b53333] sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="flex items-center gap-3 ltr-flex">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <span>{t('lesson.videoFailed')}</span>
                    </div>
                    <button
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#f3c9be] px-4 text-xs font-medium text-[#b53333] transition hover:bg-[#f9e2da]"
                        onClick={() => void retryPlayback()}
                    >
                        {t('lesson.videoTryAgain')}
                    </button>
                </motion.div>
            )}

            {/* Header */}
            <motion.div variants={fadeUp} className="mb-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#141413] leading-tight">
                        {lesson.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 ltr-flex">
                        {lesson.quizId && (
                            <Link
                                href={`/learn/${courseId}/${lessonId}/quiz`}
                                className="group inline-flex h-11 items-center gap-2 rounded-lg bg-[#c96442] px-4 text-sm font-medium text-white shadow-[0_0_0_1px_#c96442] transition-all hover:bg-[#b55836] hover:shadow-[0_6px_16px_rgba(201,100,66,0.3)] hover:-translate-y-0.5 active:translate-y-0 ltr-flex"
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
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600 disabled:opacity-100'
                                        : 'border-[#e8e6dc] text-[#c96442] hover:bg-[#f0eee6] disabled:opacity-60',
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
                    <p className="text-[17px] leading-[1.7] text-[#5e5d59]">{lesson.description}</p>
                </motion.div>
            )}

            {/* Content */}
            {lesson.content && (
                <motion.div
                    variants={fadeUp}
                    className="prose max-w-none text-[#4d4c48] mb-12 bg-[#faf9f5] rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)] border border-[#e8e6dc]"
                >
                    <h2 className="text-xl font-semibold text-[#141413] mb-4">
                        {t('lesson.lessonContent')}
                    </h2>
                    <div dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />
                </motion.div>
            )}

            {!lesson.content && !videoUrl && !showProcessing && !showFailed && (
                <motion.p
                    variants={fadeUp}
                    className="italic text-[#87867f] text-center py-12"
                >
                    {t('lesson.noContent')}
                </motion.p>
            )}

            {/* Navigation Footer */}
            <motion.div
                variants={fadeUp}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto pt-8 border-t border-[#f0eee6]"
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
                    ? 'cursor-not-allowed border-[#f0eee6] bg-[#faf9f5]/50 opacity-50'
                    : 'border-[#e8e6dc] bg-[#faf9f5] hover:border-[#c96442]/40 hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:-translate-y-0.5',
            )}
        >
            <span
                className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
                    disabled
                        ? 'bg-[#f0eee6] text-[#b0aea5]'
                        : 'bg-[#f0eee6] text-[#5e5d59] group-hover:bg-[#c96442] group-hover:text-white',
                )}
            >
                <Chevron className="h-4 w-4 rtl:rotate-180" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#87867f]">
                    {label}
                </span>
                {title && (
                    <span className="mt-0.5 block truncate text-sm font-medium text-[#141413]">
                        {title}
                    </span>
                )}
            </span>
        </button>
    );
}
