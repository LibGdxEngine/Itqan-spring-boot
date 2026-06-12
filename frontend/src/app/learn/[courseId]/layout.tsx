"use client";

import { useEffect, useState } from 'react';
import { CoursesService, CourseResponse, OpenAPI } from '@/lib/api';
import { LearningSidebar } from '@/components/learning/LearningSidebar';
import { LearnProvider } from '@/components/learning/learn-context';
import { Menu, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function LearnLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const courseId = Number(params.courseId);
    const t = useTranslations('lesson');
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const reduced = useReducedMotion();

    const [course, setCourse] = useState<CourseResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

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

    // Lock body scroll while the mobile drawer is open.
    useEffect(() => {
        if (drawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [drawerOpen]);

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-[#141413] text-[#faf9f5]">
                <div className="relative flex h-16 w-16 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c96442] opacity-30" />
                    <span className="absolute inline-flex h-12 w-12 rounded-full bg-[#c96442] opacity-20" />
                    <motion.span
                        className="relative h-10 w-10 rounded-full border-2 border-[#30302e] border-t-[#d97757]"
                        animate={reduced ? undefined : { rotate: 360 }}
                        transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                    />
                </div>
                <p className="text-sm font-medium text-[#b0aea5]">{t('courseContent')}</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#141413] text-[#faf9f5] p-8">
                {t('courseNotFound')}
            </div>
        );
    }

    // Slide offset: drawer enters from the start edge — left in LTR, right in RTL.
    const closedX = isRTL ? '100%' : '-100%';

    return (
        <LearnProvider course={course} courseId={courseId}>
            <div className="min-h-screen bg-[#f5f4ed]">
                {/* Desktop sidebar — always visible from lg, anchored to the start edge */}
                <aside className="hidden lg:block fixed inset-y-0 start-0 z-40 w-80 border-e border-[#30302e]">
                    <LearningSidebar />
                </aside>

                {/* Mobile drawer + backdrop */}
                <AnimatePresence>
                    {drawerOpen && (
                        <div className="lg:hidden">
                            <motion.div
                                className="fixed inset-0 z-40 bg-[#141413]/60 backdrop-blur-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                onClick={() => setDrawerOpen(false)}
                                aria-hidden
                            />
                            <motion.aside
                                className="fixed inset-y-0 start-0 z-50 w-[85vw] max-w-sm border-e border-[#30302e] shadow-2xl"
                                initial={reduced ? { opacity: 0 } : { x: closedX }}
                                animate={reduced ? { opacity: 1 } : { x: 0 }}
                                exit={reduced ? { opacity: 0 } : { x: closedX }}
                                transition={{ duration: 0.35, ease: EASE }}
                                role="dialog"
                                aria-modal="true"
                            >
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    aria-label="Close"
                                    className="absolute top-4 end-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#30302e] text-[#b0aea5] hover:bg-[#3f3f3c] hover:text-[#faf9f5] transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <LearningSidebar onNavigate={() => setDrawerOpen(false)} />
                            </motion.aside>
                        </div>
                    )}
                </AnimatePresence>

                {/* Main content area — offset by the sidebar width from lg via logical margin */}
                <div className="lg:ms-80 min-h-screen flex flex-col">
                    {/* Mobile top bar with the drawer toggle */}
                    <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-[#e8e6dc] bg-[#f5f4ed]/90 px-4 py-3 backdrop-blur ltr-flex">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Open course menu"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e8e6dc] bg-[#faf9f5] text-[#4d4c48] hover:bg-[#f0eee6] hover:text-[#141413] transition-colors"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <span className="truncate text-sm font-semibold text-[#141413]">
                            {course.title}
                        </span>
                    </div>

                    <div className="flex-1">{children}</div>
                </div>
            </div>
        </LearnProvider>
    );
}
