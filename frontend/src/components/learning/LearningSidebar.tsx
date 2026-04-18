"use client";

import { ModuleResponse, LessonResponse } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown, PlayCircle, FileText, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface LearningSidebarProps {
    courseTitle: string;
    modules: ModuleResponse[];
}

export function LearningSidebar({ courseTitle, modules }: LearningSidebarProps) {
    const params = useParams();
    const currentLessonId = Number(params.lessonId);
    const courseId = params.courseId;

    return (
        <div className="h-full flex flex-col bg-[#141413] border-r border-[#30302e] text-[#faf9f5] w-80 fixed left-0 top-0 overflow-y-auto z-40">
            <div className="p-5 border-b border-[#30302e]">
                <Link href={`/courses/${courseId}`} className="text-xs text-[#87867f] hover:text-[#faf9f5] mb-2 block">
                    ← Back to Course Home
                </Link>
                <h1 className="font-bold text-lg leading-snug">{courseTitle}</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {modules.map((module, index) => (
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
                     <span className="text-xs text-[#87867f] font-semibold uppercase tracking-wider block mb-1">Module {index + 1}</span>
                     <span className="text-sm font-medium text-[#b0aea5]">{module.title}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-[#87867f] transition-transform", isOpen ? "transform rotate-180" : "")} />
            </button>
            
            {isOpen && (
                <div className="bg-[#141413]">
                    {module.lessons?.map((lesson, idx) => {
                        const isActive = lesson.id === currentLessonId;
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
                                <span className="line-clamp-2">{lesson.title}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
