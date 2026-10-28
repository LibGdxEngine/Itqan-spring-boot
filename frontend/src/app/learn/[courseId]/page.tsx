"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';

import { useLearn } from '@/components/learning/learn-context';
import { CourseLearningState, learningApi } from '@/lib/learning-api';

/** Sends the student to the lesson they last opened, else the first one they haven't finished. */
export default function LearnPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = Number(params.courseId);
    const t = useTranslations('lesson');
    const reduced = useReducedMotion();
    const { course, orderedLessons } = useLearn();
    const [state, setState] = useState<CourseLearningState | null | undefined>(undefined);
    const redirected = useRef(false);

    useEffect(() => {
        let cancelled = false;
        learningApi
            .courseState(courseId)
            .then((result) => !cancelled && setState(result))
            .catch(() => !cancelled && setState(null));
        return () => {
            cancelled = true;
        };
    }, [courseId]);

    useEffect(() => {
        if (redirected.current || state === undefined || !course || orderedLessons.length === 0) return;
        const ids = orderedLessons.map((lesson) => lesson.id);
        const completed = new Set(state?.completedLessonIds ?? []);
        const target =
            (state?.lastLessonId && ids.includes(state.lastLessonId) ? state.lastLessonId : undefined) ??
            ids.find((id) => id != null && !completed.has(id)) ??
            ids[0];
        if (target != null) {
            redirected.current = true;
            router.replace(`/learn/${courseId}/${target}`);
        }
    }, [state, course, orderedLessons, courseId, router]);

    const empty = course && orderedLessons.length === 0;

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
            {empty ? (
                <span className="text-sm font-medium text-ink-2">{t('noLessonsYet')}</span>
            ) : (
                <>
                    <div className="relative flex h-14 w-14 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-25" />
                        <motion.span
                            className="relative h-9 w-9 rounded-full border-2 border-line-strong border-t-brand"
                            animate={reduced ? undefined : { rotate: 360 }}
                            transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                        />
                    </div>
                    <span className="text-sm font-medium text-ink-2">{t('courseContent')}</span>
                </>
            )}
        </div>
    );
}
