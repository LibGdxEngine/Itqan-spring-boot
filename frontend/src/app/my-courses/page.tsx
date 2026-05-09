"use client";

import { useEffect, useState } from 'react';
import { EnrollmentsService, EnrollmentResponse, StudentsService, OpenAPI } from '@/lib/api';
import { CourseCard } from '@/components/courses/CourseCard';
import { Navbar } from '@/components/Navbar';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function MyCoursesPage() {
    const { user, isAuthenticated, token, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        
        const fetchEnrollments = async () => {
            if (!isAuthenticated) return;
            
            try {
                // Get student profile
                const student = await StudentsService.getProfile().catch(() => null);
                if (!student?.id) {
                    if (user?.role === "INSTRUCTOR") router.replace("/instructor");
                    else if (user?.role === "ADMIN") router.replace("/admin");
                    else router.replace("/");
                    return;
                }

                const data = await EnrollmentsService.getStudentEnrollments(student.id, { page: 0, size: 100 });
                setEnrollments(data.content ?? []);
            } catch (err) {
                console.error("Failed to fetch enrollments", err);
                setError(t('myCourses.loadFailed'));
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchEnrollments();
        } else {
             // Let auth context handle redirect or show nothing
             setLoading(false);
             router.push('/login?redirect=/my-courses');
        }
    }, [isAuthenticated, router, authLoading, user, t]);

    return (
        <div className="min-h-screen bg-[#f5f4ed]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#141413]">
                        {t('myCourses.title')}
                    </h1>
                    <p className="mt-2 text-[#5e5d59]">
                        {t('myCourses.subtitle')}
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
                ) : enrollments.length === 0 ? (
                    <div className="text-center text-[#87867f] py-12">
                        {t('myCourses.empty')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {enrollments.map((enrollment) => (
                            enrollment.course ? (
                                <div key={enrollment.id} className="h-full">
                                    <CourseCard course={enrollment.course} />
                                    <div className="mt-2 text-sm text-gray-500 text-right">
                                        {t('myCourses.status')}: <span className="font-semibold text-[#c96442]">{enrollment.status}</span>
                                    </div>
                                </div>
                            ) : null
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
