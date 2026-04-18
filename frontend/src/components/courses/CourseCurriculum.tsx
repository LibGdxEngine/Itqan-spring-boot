"use client";

import { useState } from 'react';
import { ModuleResponse, LessonResponse } from '@/lib/api';
import { ChevronDown, ChevronRight, PlayCircle, FileText, Lock, CheckCircle } from 'lucide-react';

interface CourseCurriculumProps {
    modules: ModuleResponse[];
}

export function CourseCurriculum({ modules }: CourseCurriculumProps) {
    if (!modules || modules.length === 0) {
        return <div className="text-gray-500 italic">No curriculum available for this course yet.</div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Course Curriculum</h2>
            <div className="border rounded-lg divide-y bg-[#faf9f5] text-gray-400 border-gray-100">
                {modules.map((module) => (
                    <ModuleItem key={module.id} module={module} />
                ))}
            </div>
        </div>
    );
}

function ModuleItem({ module }: { module: ModuleResponse }) {
    const [isOpen, setIsOpen] = useState(false);

    // Assume lessons are sorted by orderIndex
    const lessons = module.lessons || [];

    return (
        <div className="bg-[#faf9f5]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left focus:outline-none"
            >
                <div className="flex items-center space-x-3">
                    {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-xs text-gray-500">{lessons.length} Lessons</p>
                    </div>
                </div>
            </button>
            
            {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                    {lessons.length === 0 ? (
                       <div className="p-4 text-sm text-gray-500 text-center">No lessons in this module.</div>
                    ) : (
                        lessons.map((lesson) => (
                            <LessonItem key={lesson.id} lesson={lesson} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function LessonItem({ lesson }: { lesson: LessonResponse }) {
    return (
        <div className="flex items-center justify-between p-3 pl-12 border-b border-gray-100 last:border-0 hover:bg-[#f0eee6] transition-colors cursor-default">
            <div className="flex items-center space-x-3">
                {lesson.type === 'VIDEO' ? (
                    <PlayCircle className="h-4 w-4 text-[#c96442]" />
                ) : (
                    <FileText className="h-4 w-4 text-[#c96442]" />
                )}
                <span className="text-sm text-gray-700 font-medium">{lesson.title}</span>
            </div>
            <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400">{lesson.duration} min</span>
                {lesson.isFree ? (
                    <span className="text-xs font-semibold text-[#c96442] border border-[#e8e6dc] px-2 py-0.5 rounded-full">Preview</span>
                ) : (
                    <Lock className="h-3 w-3 text-gray-400" />
                )}
            </div>
        </div>
    );
}
