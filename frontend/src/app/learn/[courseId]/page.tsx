"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CoursesService } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function LearnPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = Number(params.courseId);

    useEffect(() => {
        const redirect = async () => {
            try {
                const course = await CoursesService.getCourseById(courseId);
                if (course.modules && course.modules.length > 0) {
                    const firstModule = course.modules[0];
                    if (firstModule.lessons && firstModule.lessons.length > 0) {
                        router.replace(`/learn/${courseId}/${firstModule.lessons[0].id}`);
                        return;
                    }
                }
                // No lessons found
            } catch (e) {
                console.error(e);
            }
        };
        redirect();
    }, [courseId, router]);

    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-[#c96442]" />
            <span className="ml-2 text-[#5e5d59]">Loading your course...</span>
        </div>
    );
}
