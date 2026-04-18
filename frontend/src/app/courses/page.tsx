"use client";

import { useEffect, useState } from 'react';
import { CoursesService, CourseResponse, OpenAPI } from '@/lib/api';
import { CourseCard } from '@/components/courses/CourseCard';
import { Navbar } from '@/components/Navbar';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Set API Base URL
OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function CoursesPage() {
    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Fetch active courses
                const data = await CoursesService.getActiveCourses();
                setCourses(data);
            } catch (err) {
                console.error("Failed to fetch courses", err);
                setError("Failed to load courses. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    return (
        <div className="min-h-screen bg-[#f5f4ed]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#141413]">
                        Explore Our Courses
                    </h1>
                    <p className="mt-2 text-[#5e5d59]">
                        Discover top-rated courses to upskill yourself.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-10 w-10 text-[#c96442] animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-12">
                        {error}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center text-[#87867f] py-12">
                        No active courses found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {courses.map((course) => (
                            <div key={course.id} className="h-full">
                                <CourseCard course={course} />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
