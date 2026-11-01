"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ModuleResponse, LessonResponse } from '@/lib/api';
import { ChevronDown, PlayCircle, FileText, Lock } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface CourseCurriculumProps {
    modules: ModuleResponse[];
    /** When set, free-preview lessons link into the lesson player. */
    courseId?: number;
}

export function CourseCurriculum({ modules, courseId }: CourseCurriculumProps) {
    const t = useTranslations();

    if (!modules || modules.length === 0) {
        return <div className="text-ink-3 italic">{t('courses.noCurriculum')}</div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-ink">{t('courses.courseCurriculum')}</h2>
            <div className="border border-line rounded-xl divide-y divide-line bg-surface overflow-hidden shadow-whisper">
                {modules.map((module, index) => (
                    <ModuleItem key={module.id} module={module} index={index} courseId={courseId} />
                ))}
            </div>
        </div>
    );
}

function ModuleItem({ module, index, courseId }: { module: ModuleResponse; index: number; courseId?: number }) {
    const t = useTranslations();
    const reduceMotion = useReducedMotion();
    const [isOpen, setIsOpen] = useState(false);

    // Assume lessons are sorted by orderIndex
    const lessons = module.lessons || [];

    return (
        <div className="bg-surface">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="ltr-flex w-full flex items-center justify-between gap-3 p-4 hover:bg-subtle/60 transition-smooth text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
                <div className="ltr-flex flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand tabular-nums">
                        {index + 1}
                    </span>
                    <div>
                        <h3 className="font-semibold text-ink">{module.title}</h3>
                        <p className="text-xs text-ink-3">{lessons.length} {t('courses.lessons')}</p>
                    </div>
                </div>
                <motion.span
                    aria-hidden
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="shrink-0 text-ink-3"
                >
                    <ChevronDown className="h-5 w-5" />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { height: 'auto', opacity: 1 },
                            collapsed: { height: 0, opacity: 0 },
                        }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-line bg-canvas/40">
                            {lessons.length === 0 ? (
                                <div className="p-4 text-sm text-ink-3 text-center">{t('courses.noLessons')}</div>
                            ) : (
                                lessons.map((lesson) => (
                                    <LessonItem key={lesson.id} lesson={lesson} courseId={courseId} />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function LessonItem({ lesson, courseId }: { lesson: LessonResponse; courseId?: number }) {
    const t = useTranslations();
    return (
        <div className="group ltr-flex flex items-center justify-between gap-3 ps-9 pe-3 py-3 sm:ps-12 border-b border-line last:border-0 border-s-2 border-s-transparent hover:border-s-brand hover:bg-subtle transition-smooth cursor-default">
            <div className="ltr-flex flex min-w-0 items-center gap-3">
                {lesson.type === 'VIDEO' ? (
                    <PlayCircle className="h-4 w-4 shrink-0 text-brand" />
                ) : (
                    <FileText className="h-4 w-4 shrink-0 text-brand" />
                )}
                <span className="text-sm text-ink-2 font-medium group-hover:text-ink transition-smooth">{lesson.title}</span>
            </div>
            <div className="ltr-flex flex shrink-0 items-center gap-3">
                <span className="whitespace-nowrap text-xs text-ink-3 tabular-nums">{lesson.duration} {t('courses.minutes')}</span>
                {lesson.isFree && courseId ? (
                    <Link
                        href={`/learn/${courseId}/${lesson.id}`}
                        className="text-xs font-semibold text-brand bg-brand/10 ring-1 ring-brand/20 px-2 py-0.5 rounded-full hover:bg-brand/20"
                    >
                        {t('courses.preview')}
                    </Link>
                ) : lesson.isFree ? (
                    <span className="text-xs font-semibold text-brand bg-brand/10 ring-1 ring-brand/20 px-2 py-0.5 rounded-full">{t('courses.preview')}</span>
                ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sand/60">
                        <Lock className="h-3 w-3 text-ink-3" />
                    </span>
                )}
            </div>
        </div>
    );
}
