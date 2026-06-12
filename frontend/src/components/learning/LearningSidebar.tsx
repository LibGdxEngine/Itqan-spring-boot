"use client";

import { ModuleResponse } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ChevronDown, PlayCircle, FileText, CheckCircle, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useLearn } from '@/components/learning/learn-context';
import {
    motion,
    AnimatePresence,
    useReducedMotion,
    type Variants,
} from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

const lessonStagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.04 } },
};

const lessonItem: Variants = {
    hidden: { opacity: 0, x: -6 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
};

/**
 * Dark course-navigation sidebar.
 *
 * @param onNavigate optional callback fired when a lesson link is clicked.
 *   Used by the mobile drawer to close itself after navigation. Defaults to a
 *   no-op so the desktop (always-visible) variant keeps working unchanged.
 */
export function LearningSidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
    const params = useParams();
    const currentLessonId = Number(params.lessonId);
    const courseId = params.courseId;
    const t = useTranslations('lesson');
    const reduced = useReducedMotion();
    const { course, orderedModules, orderedLessons, completedLessonIds } = useLearn();

    const total = orderedLessons.length;
    const completedCount = completedLessonIds.size;
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return (
        <div className="h-full flex flex-col bg-[#141413] text-[#faf9f5] overflow-y-auto">
            {/* Header */}
            <div className="p-5 border-b border-[#30302e]">
                <Link
                    href={`/courses/${courseId}`}
                    onClick={onNavigate}
                    className="group inline-flex items-center gap-1.5 text-xs text-[#87867f] hover:text-[#faf9f5] mb-3 transition-colors ltr-flex"
                >
                    <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" />
                    {t('backToCourse')}
                </Link>
                <h1 className="font-bold text-lg leading-snug text-[#faf9f5]">
                    {course?.title || 'Course'}
                </h1>
            </div>

            {/* Progress block */}
            <div className="px-5 py-5 border-b border-[#30302e]">
                <div className="flex items-baseline justify-between mb-2.5 ltr-flex">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#b0aea5]">
                        {t('yourProgress')}
                    </span>
                    <span className="text-sm font-bold text-[#d97757] tabular-nums">{percent}%</span>
                </div>

                <div className="h-2 w-full rounded-full bg-[#30302e] overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#c96442] to-[#d97757]"
                        initial={reduced ? false : { width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.9, ease: EASE, delay: reduced ? 0 : 0.15 }}
                    />
                </div>

                <p className="mt-2.5 text-xs text-[#87867f]">
                    {t('progressOf', { completed: completedCount, total })}
                </p>
            </div>

            {/* Course content section */}
            <div className="px-5 pt-5 pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#87867f]">
                    {t('courseContent')}
                </span>
            </div>

            <div className="flex-1 pb-6">
                {orderedModules.map((module, index) => (
                    <ModuleSection
                        key={module.id}
                        module={module}
                        courseId={String(courseId)}
                        currentLessonId={currentLessonId}
                        index={index}
                        onNavigate={onNavigate}
                    />
                ))}
            </div>
        </div>
    );
}

function ModuleSection({
    module,
    courseId,
    currentLessonId,
    index,
    onNavigate,
}: {
    module: ModuleResponse;
    courseId: string;
    currentLessonId: number;
    index: number;
    onNavigate?: () => void;
}) {
    const t = useTranslations('lesson');
    const reduced = useReducedMotion();
    const { completedLessonIds } = useLearn();
    // Open if it contains the current lesson, or it's the first module.
    const isActiveModule = module.lessons?.some((l) => l.id === currentLessonId);
    const [isOpen, setIsOpen] = useState(isActiveModule || index === 0);

    const lessonCount = module.lessons?.length ?? 0;
    const completedInModule =
        module.lessons?.filter((l) => l.id != null && completedLessonIds.has(l.id)).length ?? 0;

    return (
        <div className="border-b border-[#30302e]/70">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-start hover:bg-[#30302e]/60 transition-colors ltr-flex"
            >
                <div className="min-w-0">
                    <span className="text-[11px] text-[#87867f] font-semibold uppercase tracking-wider block mb-1">
                        {t('module', { number: index + 1 })}
                        {lessonCount > 0 && (
                            <span className="ms-2 text-[#5e5d59] tabular-nums normal-case font-normal tracking-normal">
                                {completedInModule}/{lessonCount}
                            </span>
                        )}
                    </span>
                    <span className="text-sm font-medium text-[#b0aea5] line-clamp-2">
                        {module.title}
                    </span>
                </div>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="shrink-0"
                >
                    <ChevronDown className="h-4 w-4 text-[#87867f]" />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial={reduced ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="overflow-hidden"
                    >
                        <motion.div
                            className="bg-[#141413] pb-2"
                            variants={lessonStagger}
                            initial={reduced ? false : 'hidden'}
                            animate="visible"
                        >
                            {module.lessons?.map((lesson) => {
                                const isActive = lesson.id === currentLessonId;
                                const isCompleted =
                                    lesson.id != null && completedLessonIds.has(lesson.id);
                                return (
                                    <motion.div key={lesson.id} variants={lessonItem}>
                                        <Link
                                            href={`/learn/${courseId}/${lesson.id}`}
                                            onClick={onNavigate}
                                            aria-current={isActive ? 'page' : undefined}
                                            className={cn(
                                                'group flex items-center gap-3 ps-5 pe-4 py-2.5 border-s-2 text-sm transition-all duration-200 ltr-flex',
                                                isActive
                                                    ? 'border-[#c96442] bg-[#30302e] text-[#d97757] font-medium'
                                                    : 'border-transparent text-[#87867f] hover:text-[#faf9f5] hover:bg-[#30302e]/50 hover:ps-6',
                                            )}
                                        >
                                            {lesson.type === 'VIDEO' ? (
                                                <PlayCircle
                                                    className={cn(
                                                        'h-4 w-4 shrink-0 transition-colors',
                                                        isActive
                                                            ? 'text-[#d97757]'
                                                            : 'text-[#5e5d59] group-hover:text-[#b0aea5]',
                                                    )}
                                                />
                                            ) : (
                                                <FileText
                                                    className={cn(
                                                        'h-4 w-4 shrink-0 transition-colors',
                                                        isActive
                                                            ? 'text-[#d97757]'
                                                            : 'text-[#5e5d59] group-hover:text-[#b0aea5]',
                                                    )}
                                                />
                                            )}
                                            <span className="line-clamp-2 flex-1">{lesson.title}</span>
                                            <AnimatePresence>
                                                {isCompleted && (
                                                    <motion.span
                                                        initial={
                                                            reduced ? false : { scale: 0, opacity: 0 }
                                                        }
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 500,
                                                            damping: 28,
                                                        }}
                                                        className="shrink-0"
                                                    >
                                                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
