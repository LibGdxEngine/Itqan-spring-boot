"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CoursesService, CourseResponse, OpenAPI } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { EnrollButton } from '@/components/courses/EnrollButton';
import { CourseCurriculum } from '@/components/courses/CourseCurriculum';
import { Loader2, Clock, BarChart, BookOpen, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { SVGProps } from 'react';

// Ensure API base is set
OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function CourseDetailPage() {
    const params = useParams();
    const id = Number(params.id);
    const { toast } = useToast();
    
    const [course, setCourse] = useState<CourseResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchCourse = async () => {
            try {
                const data = await CoursesService.getCourseById(id);
                setCourse(data);
            } catch (err) {
                console.error("Failed to fetch course", err);
                setError("Failed to load course details.");
                toast({
                    title: "Error",
                    description: "Failed to load course details.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [id, toast]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center">
                <Loader2 className="h-10 w-10 text-sky-600 animate-spin" />
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
                    <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
                    <p className="text-gray-600">{error || "The requested course could not be found."}</p>
                </div>
            </div>
        );
    }

    const coursePrice = typeof course.price === "number" ? course.price : 0;
    const instructorName = course.instructor || "Unknown Instructor";

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            
            {/* Hero Section */}
            <div className="bg-slate-900 text-white pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="inline-flex items-center space-x-2 bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-sm font-medium">
                                <span className="uppercase tracking-wide">{course.level}</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                                {course.title}
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed max-w-3xl">
                                {course.description}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
                                <div className="flex items-center">
                                    <Clock className="h-5 w-5 mr-2 text-sky-400" />
                                    <span>{course.duration} Hours</span>
                                </div>
                                <div className="flex items-center">
                                    <BookOpen className="h-5 w-5 mr-2 text-sky-400" />
                                    <span>{course.modules?.length || 0} Modules</span>
                                </div>
                                <div className="flex items-center">
                                    <BarChart className="h-5 w-5 mr-2 text-sky-400" />
                                    <span>All Levels</span>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sky-400">
                                    {instructorName.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Created by</p>
                                    <p className="font-semibold text-white">{instructorName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Floating Card (Desktop) */}
                        <div className="hidden lg:block relative">
                            <div className="absolute top-0 right-0 w-full">
                                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                                    <div className="h-48 bg-gradient-to-r from-sky-400 to-indigo-500 flex items-center justify-center">
                                        <BookOpen className="h-20 w-20 text-white/90" />
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-sm text-slate-500 mb-1">Total Price</p>
                                                <p className="text-3xl font-bold text-slate-900">${coursePrice.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        
                                        <EnrollButton courseId={course.id ?? id} coursePrice={coursePrice} />
                                        
                                        <ul className="space-y-3 text-sm text-slate-600">
                                            <li className="flex items-center">
                                                <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                                                Full Lifetime Access
                                            </li>
                                            <li className="flex items-center">
                                                <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                                                Certificate of Completion
                                            </li>
                                            <li className="flex items-center">
                                                <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                                                Mobile & TV Support
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Card (Bottom Fixed or Inline) */}
            <div className="lg:hidden p-4 bg-white border-b border-slate-200">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold">${coursePrice.toFixed(2)}</span>
                 </div>
                 <EnrollButton courseId={course.id ?? id} coursePrice={coursePrice} />
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-12">
                     {/* Curriculum */}
                     <CourseCurriculum modules={course.modules || []} />
                     
                     {/* Description */}
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-2xl font-bold mb-4">Description</h2>
                        <div className="prose max-w-none text-slate-600">
                            {course.description}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
}

function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    )
}
