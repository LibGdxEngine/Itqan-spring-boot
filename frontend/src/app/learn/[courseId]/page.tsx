"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CoursesService } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';

export default function LearnPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = Number(params.courseId);
    const t = useTranslations('lesson');
    const reduced = useReducedMotion();

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
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="relative flex h-14 w-14 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c96442] opacity-25" />
                <motion.span
                    className="relative h-9 w-9 rounded-full border-2 border-[#e8e6dc] border-t-[#c96442]"
                    animate={reduced ? undefined : { rotate: 360 }}
                    transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                />
            </div>
            <span className="text-sm font-medium text-[#5e5d59]">{t('courseContent')}</span>
        </div>
    );
}
