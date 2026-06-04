"use client";

import * as React from "react";
import {
    CourseResponse,
    ModuleResponse,
    LessonResponse,
    EnrollmentsService,
    StudentsService,
} from "@/lib/api";

interface LearnContextValue {
    course: CourseResponse | null;
    /** Modules sorted by orderIndex, each with its lessons sorted by orderIndex. */
    orderedModules: ModuleResponse[];
    /** All lessons across modules, flattened in display order. Used for prev/next. */
    orderedLessons: LessonResponse[];
    completedLessonIds: Set<number>;
    studentId: number | null;
    /** Marks a lesson complete on the backend and updates local state. No-op if no student. */
    markComplete: (lessonId: number) => Promise<void>;
}

const LearnContext = React.createContext<LearnContextValue | undefined>(undefined);

const byOrderIndex = (a: { orderIndex?: number }, b: { orderIndex?: number }) =>
    (a.orderIndex ?? 0) - (b.orderIndex ?? 0);

export function LearnProvider({
    course,
    courseId,
    children,
}: {
    course: CourseResponse | null;
    courseId: number;
    children: React.ReactNode;
}) {
    const [studentId, setStudentId] = React.useState<number | null>(null);
    const [completedLessonIds, setCompletedLessonIds] = React.useState<Set<number>>(
        () => new Set<number>(),
    );

    // Load the current student and their completed lessons for this course.
    React.useEffect(() => {
        if (!courseId) return;
        let cancelled = false;

        const loadProgress = async () => {
            const student = await StudentsService.getProfile().catch(() => null);
            if (cancelled || !student?.id) return;
            setStudentId(student.id);

            const completed = await EnrollmentsService.getCompletedLessons(
                student.id,
                courseId,
            ).catch(() => [] as number[]);
            if (cancelled) return;
            setCompletedLessonIds(new Set(completed));
        };

        loadProgress();
        return () => {
            cancelled = true;
        };
    }, [courseId]);

    const orderedModules = React.useMemo<ModuleResponse[]>(() => {
        const modules = course?.modules ?? [];
        return [...modules].sort(byOrderIndex).map((module) => ({
            ...module,
            lessons: [...(module.lessons ?? [])].sort(byOrderIndex),
        }));
    }, [course]);

    const orderedLessons = React.useMemo<LessonResponse[]>(
        () => orderedModules.flatMap((module) => module.lessons ?? []),
        [orderedModules],
    );

    const markComplete = React.useCallback(
        async (lessonId: number) => {
            if (studentId == null) return;
            await EnrollmentsService.completeLesson(studentId, lessonId);
            setCompletedLessonIds((prev) => {
                const next = new Set(prev);
                next.add(lessonId);
                return next;
            });
        },
        [studentId],
    );

    const value = React.useMemo<LearnContextValue>(
        () => ({
            course,
            orderedModules,
            orderedLessons,
            completedLessonIds,
            studentId,
            markComplete,
        }),
        [course, orderedModules, orderedLessons, completedLessonIds, studentId, markComplete],
    );

    return <LearnContext.Provider value={value}>{children}</LearnContext.Provider>;
}

export function useLearn() {
    const ctx = React.useContext(LearnContext);
    if (ctx === undefined) {
        throw new Error("useLearn must be used within a LearnProvider");
    }
    return ctx;
}
