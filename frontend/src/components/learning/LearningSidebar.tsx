"use client";

import { ModuleResponse } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ChevronDown, PlayCircle, FileText, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useLearn } from '@/components/learning/learn-context';

export function LearningSidebar() {
    const params = useParams();
    const currentLessonId = Number(params.lessonId);
    const courseId = params.courseId;
    const t = useTranslations('lesson');
    const { course, orderedModules } = useLearn();

    return (
        <div className="h-full flex flex-col bg-[#141413] border-r border-[#30302e] text-[#faf9f5] w-80 fixed left-0 top-0 overflow-y-auto z-40">
            <div className="p-5 border-b border-[#30302e]">
                <Link href={`/courses/${courseId}`} className="text-xs text-[#87867f] hover:text-[#faf9f5] mb-2 block">
                    {t('backToCourse')}
                </Link>
                <h1 className="font-bold text-lg leading-snug">{course?.title || "Course"}</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
                {orderedModules.map((module, index) => (
                    <ModuleSection
                        key={module.id}
                        module={module}
                        courseId={String(courseId)}
                        currentLessonId={currentLessonId}
                        index={index}
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
    index
}: {
    module: ModuleResponse;
    courseId: string;
    currentLessonId: number;
    index: number;
}) {
    const t = useTranslations('lesson');
    const { completedLessonIds } = useLearn();
    // Open if contains current lesson
    const isActiveModule = module.lessons?.some(l => l.id === currentLessonId);
    const [isOpen, setIsOpen] = useState(isActiveModule || index === 0);

    return (
        <div className="border-b border-[#30302e]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#30302e] transition-colors"
            >
                <div>
                     <span className="text-xs text-[#87867f] font-semibold uppercase tracking-wider block mb-1">{t('module', { number: index + 1 })}</span>
                     <span className="text-sm font-medium text-[#b0aea5]">{module.title}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-[#87867f] transition-transform", isOpen ? "transform rotate-180" : "")} />
            </button>

            {isOpen && (
                <div className="bg-[#141413]">
                    {module.lessons?.map((lesson) => {
                        const isActive = lesson.id === currentLessonId;
                        const isCompleted = lesson.id != null && completedLessonIds.has(lesson.id);
                        return (
                            <Link
                                key={lesson.id}
                                href={`/learn/${courseId}/${lesson.id}`}
                                className={cn(
                                    "flex items-center p-3 pl-4 border-l-2 transition-colors text-sm gap-3",
                                    isActive
                                        ? "border-[#c96442] bg-[#30302e] text-[#d97757]"
                                        : "border-transparent text-[#87867f] hover:text-[#b0aea5] hover:bg-[#30302e]"
                                )}
                            >
                                {lesson.type === 'VIDEO' ? <PlayCircle className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
                                <span className="line-clamp-2 flex-1">{lesson.title}</span>
                                {isCompleted && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
