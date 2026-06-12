"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CoursesService, CourseResponse, OpenAPI } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { EnrollButton } from '@/components/courses/EnrollButton';
import { CourseCurriculum } from '@/components/courses/CourseCurriculum';
import { Clock, BarChart, BookOpen, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { SVGProps } from 'react';

// Ensure API base is set
OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const staggerParent: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export default function CourseDetailPage() {
    const params = useParams();
    const id = Number(params.id);
    const { toast } = useToast();
    const t = useTranslations();
    const reduceMotion = useReducedMotion();

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
                setError(t('courses.detailLoadFailed'));
                toast({
                    title: t('courses.errorTitle'),
                    description: t('courses.detailLoadFailed'),
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
            <div className="min-h-screen bg-[#f5f4ed]">
                <Navbar />
                {/* Dark hero skeleton */}
                <div className="relative overflow-hidden bg-[#141413] pt-24 pb-12">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -top-32 end-[-10%] h-[480px] w-[480px] opacity-30 blur-3xl"
                        style={{ background: "radial-gradient(circle at 50% 50%, #d97757 0%, transparent 60%)" }}
                    />
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="skeleton h-7 w-28 rounded-full" />
                                <div className="skeleton h-12 w-3/4 rounded-xl" />
                                <div className="space-y-3">
                                    <div className="skeleton h-4 w-full rounded" />
                                    <div className="skeleton h-4 w-5/6 rounded" />
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <div className="skeleton h-9 w-32 rounded-full" />
                                    <div className="skeleton h-9 w-32 rounded-full" />
                                    <div className="skeleton h-9 w-28 rounded-full" />
                                </div>
                            </div>
                            <div className="hidden lg:block">
                                <div className="rounded-2xl overflow-hidden border border-[#30302e]">
                                    <div className="skeleton h-48 w-full" />
                                    <div className="bg-[#faf9f5] p-6 space-y-4">
                                        <div className="skeleton h-9 w-32 rounded-lg" />
                                        <div className="skeleton h-11 w-full rounded-lg" />
                                        <div className="space-y-2">
                                            <div className="skeleton h-4 w-3/4 rounded" />
                                            <div className="skeleton h-4 w-2/3 rounded" />
                                            <div className="skeleton h-4 w-3/4 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Content skeleton */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="lg:max-w-2xl space-y-4">
                        <div className="skeleton h-7 w-48 rounded-lg" />
                        <div className="skeleton h-20 w-full rounded-xl" />
                        <div className="skeleton h-20 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen bg-[#f5f4ed]">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
                    <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('courses.notFoundTitle')}</h1>
                    <p className="text-gray-600">{error || t('courses.notFoundDesc')}</p>
                </div>
            </div>
        );
    }

    const coursePrice = typeof course.price === "number" ? course.price : 0;
    const instructorName = course.instructor || t('courses.unknownInstructor');
    const levelLabel =
        course.level && t.has(`courses.levels.${course.level}`)
            ? t(`courses.levels.${course.level}`)
            : course.level;

    const features = [
        t('courses.fullLifetimeAccess'),
        t('courses.certificate'),
        t('courses.mobileTvSupport'),
    ];

    return (
        <div className="min-h-screen bg-[#f5f4ed]">
            <Navbar />

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-[#141413] text-[#faf9f5] pt-24 pb-12">
                {/* Soft terracotta radial glow */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-32 end-[-8%] h-[520px] w-[520px] opacity-30 blur-3xl"
                    style={{ background: "radial-gradient(circle at 50% 50%, #d97757 0%, transparent 60%)" }}
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-40 start-[-12%] h-[420px] w-[420px] opacity-20 blur-3xl"
                    style={{ background: "radial-gradient(circle at 50% 50%, #c96442 0%, transparent 65%)" }}
                />
                {/* Subtle light pattern/texture overlay */}
                <div aria-hidden className="pointer-events-none absolute inset-0 pattern-islamic opacity-[0.06]" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <motion.div
                            className="lg:col-span-2 space-y-6"
                            initial="hidden"
                            animate="visible"
                            variants={staggerParent}
                        >
                            <motion.div variants={fadeUp}>
                                <span className="inline-flex items-center gap-2 bg-[#30302e] text-[#d97757] px-3 py-1 rounded-full text-sm font-medium ring-1 ring-white/5">
                                    <span className="uppercase tracking-wide">{levelLabel}</span>
                                </span>
                            </motion.div>
                            <motion.h1
                                variants={fadeUp}
                                className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
                            >
                                {course.title}
                            </motion.h1>
                            <motion.p
                                variants={fadeUp}
                                className="text-lg text-[#b0aea5] leading-relaxed max-w-3xl"
                            >
                                {course.description}
                            </motion.p>

                            {/* Metadata pill chips */}
                            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-2 bg-white/5 ring-1 ring-white/10 rounded-full px-3 py-1.5 text-sm text-[#e8e6dc] transition-smooth hover:bg-white/10">
                                    <Clock className="h-4 w-4 text-[#d97757]" />
                                    <span>{course.duration} {t('courses.hours')}</span>
                                </span>
                                <span className="inline-flex items-center gap-2 bg-white/5 ring-1 ring-white/10 rounded-full px-3 py-1.5 text-sm text-[#e8e6dc] transition-smooth hover:bg-white/10">
                                    <BookOpen className="h-4 w-4 text-[#d97757]" />
                                    <span>{course.modules?.length || 0} {t('courses.modulesLabel')}</span>
                                </span>
                                <span className="inline-flex items-center gap-2 bg-white/5 ring-1 ring-white/10 rounded-full px-3 py-1.5 text-sm text-[#e8e6dc] transition-smooth hover:bg-white/10">
                                    <BarChart className="h-4 w-4 text-[#d97757]" />
                                    <span>{t('courses.allLevels')}</span>
                                </span>
                            </motion.div>

                            <motion.div variants={fadeUp} className="pt-4 flex items-center gap-3">
                                <div className="h-11 w-11 rounded-full bg-[#30302e] ring-1 ring-white/10 flex items-center justify-center font-bold text-[#d97757]">
                                    {instructorName.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm text-[#b0aea5]">{t('courses.createdBy')}</p>
                                    <p className="font-semibold text-[#faf9f5]">{instructorName}</p>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Floating Card (Desktop) */}
                        <div className="hidden lg:block relative">
                            <motion.div
                                className="absolute top-0 end-0 w-full"
                                initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
                            >
                                <div className="group bg-[#faf9f5] rounded-2xl shadow-xl overflow-hidden border border-[#e8e6dc]">
                                    <div className="h-48 bg-[#c96442] overflow-hidden">
                                        {course.thumbnailUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={course.thumbnailUrl}
                                                alt={course.title ?? ''}
                                                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center transition-transform duration-700 ease-out group-hover:scale-105">
                                                <BookOpen className="h-20 w-20 text-[#faf9f5]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-[#87867f] mb-1">{t('courses.totalPrice')}</p>
                                                <p className="text-4xl font-bold tracking-tight text-[#141413]">
                                                    <span className="align-top text-2xl text-[#c96442]">$</span>{coursePrice.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        <EnrollButton courseId={course.id ?? id} coursePrice={coursePrice} courseTitle={course.title ?? ''} />

                                        <ul className="space-y-3 text-sm text-[#5e5d59]">
                                            {features.map((feature) => (
                                                <li key={feature} className="flex items-center gap-3">
                                                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c96442]/12 text-[#c96442]">
                                                        <CheckIcon className="h-3 w-3" />
                                                    </span>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Card (Bottom Fixed or Inline) */}
            <div className="lg:hidden p-4 bg-[#faf9f5] border-b border-[#e8e6dc] shadow-whisper">
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-[#87867f] mb-0.5">{t('courses.totalPrice')}</p>
                        <span className="text-3xl font-bold tracking-tight text-[#141413]">
                            <span className="align-top text-xl text-[#c96442]">$</span>{coursePrice.toFixed(2)}
                        </span>
                    </div>
                </div>
                <EnrollButton courseId={course.id ?? id} coursePrice={coursePrice} courseTitle={course.title ?? ''} />
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    className="lg:col-span-2 space-y-12"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    variants={staggerParent}
                >
                    {/* Curriculum */}
                    <motion.div variants={fadeUp}>
                        <CourseCurriculum modules={course.modules || []} />
                    </motion.div>

                    {/* Description */}
                    <motion.div variants={fadeUp} className="bg-[#faf9f5] p-6 rounded-xl border border-[#e8e6dc] shadow-whisper">
                        <h2 className="text-2xl font-bold mb-4 text-[#141413]">{t('courses.description')}</h2>
                        <div className="prose max-w-none text-[#5e5d59] leading-relaxed">
                            {course.description}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    )
}
