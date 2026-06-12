"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ModuleResponse, LessonResponse } from '@/lib/api';
import { ChevronDown, PlayCircle, FileText, Lock } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface CourseCurriculumProps {
    modules: ModuleResponse[];
}

export function CourseCurriculum({ modules }: CourseCurriculumProps) {
    const t = useTranslations();

    if (!modules || modules.length === 0) {
        return <div className="text-[#87867f] italic">{t('courses.noCurriculum')}</div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#141413]">{t('courses.courseCurriculum')}</h2>
            <div className="border border-[#f0eee6] rounded-xl divide-y divide-[#f0eee6] bg-[#faf9f5] overflow-hidden shadow-whisper">
                {modules.map((module, index) => (
                    <ModuleItem key={module.id} module={module} index={index} />
                ))}
            </div>
        </div>
    );
}

function ModuleItem({ module, index }: { module: ModuleResponse; index: number }) {
    const t = useTranslations();
    const reduceMotion = useReducedMotion();
    const [isOpen, setIsOpen] = useState(false);

    // Assume lessons are sorted by orderIndex
    const lessons = module.lessons || [];

    return (
        <div className="bg-[#faf9f5]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 p-4 hover:bg-[#f0eee6]/60 transition-smooth text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c96442]/40"
            >
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c96442]/10 text-sm font-semibold text-[#c96442] tabular-nums">
                        {index + 1}
                    </span>
                    <div>
                        <h3 className="font-semibold text-[#141413]">{module.title}</h3>
                        <p className="text-xs text-[#87867f]">{lessons.length} {t('courses.lessons')}</p>
                    </div>
                </div>
                <motion.span
                    aria-hidden
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="shrink-0 text-[#87867f]"
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
                        <div className="border-t border-[#f0eee6] bg-[#f5f4ed]/40">
                            {lessons.length === 0 ? (
                                <div className="p-4 text-sm text-[#87867f] text-center">{t('courses.noLessons')}</div>
                            ) : (
                                lessons.map((lesson) => (
                                    <LessonItem key={lesson.id} lesson={lesson} />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function LessonItem({ lesson }: { lesson: LessonResponse }) {
    const t = useTranslations();
    return (
        <div className="group flex items-center justify-between gap-3 ps-12 pe-3 py-3 border-b border-[#f0eee6] last:border-0 border-s-2 border-s-transparent hover:border-s-[#c96442] hover:bg-[#f0eee6] transition-smooth cursor-default">
            <div className="flex items-center gap-3">
                {lesson.type === 'VIDEO' ? (
                    <PlayCircle className="h-4 w-4 shrink-0 text-[#c96442]" />
                ) : (
                    <FileText className="h-4 w-4 shrink-0 text-[#c96442]" />
                )}
                <span className="text-sm text-[#5e5d59] font-medium group-hover:text-[#141413] transition-smooth">{lesson.title}</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs text-[#87867f] tabular-nums">{lesson.duration} {t('courses.minutes')}</span>
                {lesson.isFree ? (
                    <span className="text-xs font-semibold text-[#c96442] bg-[#c96442]/10 ring-1 ring-[#c96442]/20 px-2 py-0.5 rounded-full">{t('courses.preview')}</span>
                ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e8e6dc]/60">
                        <Lock className="h-3 w-3 text-[#87867f]" />
                    </span>
                )}
            </div>
        </div>
    );
}
