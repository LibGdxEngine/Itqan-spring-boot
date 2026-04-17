"use client";

import { useEffect, useState } from 'react';
import { CoursesService, CourseResponse, OpenAPI } from '@/lib/api';
import { LearningSidebar } from '@/components/learning/LearningSidebar';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function LearnLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const courseId = Number(params.courseId);
    
    const [course, setCourse] = useState<CourseResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId) return;

        const fetchCourse = async () => {
            try {
                const data = await CoursesService.getCourseById(courseId);
                setCourse(data);
            } catch (err) {
                console.error("Failed to load course", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
        );
    }

    if (!course) {
        return <div className="text-white p-8">Course not found</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar */}
            <LearningSidebar courseTitle={course.title || "Course"} modules={course.modules || []} />
            
            {/* Main Content Area */}
            <div className="ml-80 min-h-screen">
                {children}
            </div>
        </div>
    );
}
