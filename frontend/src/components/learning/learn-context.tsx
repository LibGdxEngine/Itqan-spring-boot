"use client";

import * as React from "react";
import {
    CourseResponse,
    ModuleResponse,
    LessonResponse,
    EnrollmentsService,
    StudentsService,
} from "@/lib/api";
import { learningApi } from "@/lib/learning-api";

interface LearnContextValue {
    course: CourseResponse | null;
    /** Modules sorted by orderIndex, each with its lessons sorted by orderIndex. */
    orderedModules: ModuleResponse[];
    /** All lessons across modules, flattened in display order. Used for prev/next. */
    orderedLessons: LessonResponse[];
    completedLessonIds: Set<number>;
    studentId: number | null;
    /** Whether the signed-in student is enrolled (free-preview visitors are not). */
    enrolled: boolean;
    /** Saved video positions in seconds, by lesson id. */
    positions: Record<number, number>;
    /** The lesson the student opened most recently in this course. */
    lastLessonId: number | null;
    /** Marks a lesson complete on the backend and updates local state. No-op if no student. */
    markComplete: (lessonId: number) => Promise<void>;
    /** Saves the resume point for a video lesson (fire-and-forget). */
    savePosition: (lessonId: number, seconds: number) => void;
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
    const [enrolled, setEnrolled] = React.useState(false);
    const [positions, setPositions] = React.useState<Record<number, number>>({});
    const [lastLessonId, setLastLessonId] = React.useState<number | null>(null);

    // Load the current student and their completed lessons for this course.
    React.useEffect(() => {
        if (!courseId) return;
        let cancelled = false;

        const loadProgress = async () => {
            const student = await StudentsService.getProfile().catch(() => null);
            if (cancelled || !student?.id) return;
            setStudentId(student.id);

            const state = await learningApi.courseState(courseId).catch(() => null);
            if (cancelled || !state) return;
            setCompletedLessonIds(new Set(state.completedLessonIds));
            setEnrolled(state.enrolled);
            setLastLessonId(state.lastLessonId);
            setPositions(
                Object.fromEntries(
                    Object.entries(state.positions).map(([id, seconds]) => [Number(id), seconds]),
                ),
            );
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

    const savePosition = React.useCallback(
        (lessonId: number, seconds: number) => {
            if (!enrolled) return;
            const rounded = Math.max(0, Math.floor(seconds));
            setPositions((prev) => ({ ...prev, [lessonId]: rounded }));
            void learningApi.activity(lessonId, rounded).catch(() => undefined);
        },
        [enrolled],
    );

    const value = React.useMemo<LearnContextValue>(
        () => ({
            course,
            orderedModules,
            orderedLessons,
            completedLessonIds,
            studentId,
            enrolled,
            positions,
            lastLessonId,
            markComplete,
            savePosition,
        }),
        [
            course,
            orderedModules,
            orderedLessons,
            completedLessonIds,
            studentId,
            enrolled,
            positions,
            lastLessonId,
            markComplete,
            savePosition,
        ],
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
