"use client";

import { useEffect, useState } from 'react';
import { CoursesService, CourseResponse, OpenAPI } from '@/lib/api';
import { CourseCard } from '@/components/courses/CourseCard';
import { Navbar } from '@/components/Navbar';
import { BookOpen, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

// Set API Base URL
OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const EASE = [0.22, 1, 0.36, 1] as const;

const GRID_CLASS =
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

function CourseCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#f0eee6] bg-[#faf9f5] shadow-[0_0_0_1px_#d1cfc5]">
      <div className="skeleton h-48 w-full rounded-none" />
      <div className="flex flex-grow flex-col gap-3 p-6">
        <div className="skeleton h-6 w-4/5 rounded-md" />
        <div className="skeleton h-4 w-full rounded-md" />
        <div className="skeleton h-4 w-2/3 rounded-md" />
        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="skeleton h-4 w-20 rounded-md" />
          <div className="skeleton h-9 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Fetch active courses
        const page = await CoursesService.getActiveCourses({});
        setCourses(page.content ?? []);
      } catch (err) {
        console.error("Failed to fetch courses", err);
        setError(t('courses.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };

  const staggerParent: Variants = {
    hidden: {},
    visible: {
      transition: reduceMotion
        ? {}
        : { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* ===== Animated hero / header ===== */}
        <section className="relative mb-12 overflow-hidden">
          {/* Islamic pattern whisper behind the header */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-8 -top-16 h-56 pattern-islamic opacity-50 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]"
          />
          {/* Soft terracotta radial glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 start-1/3 -z-0 h-72 w-72 opacity-30 blur-3xl"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, #d97757 0%, transparent 60%)',
            }}
          />

          <motion.div
            className="relative space-y-4"
            initial="hidden"
            animate="visible"
            variants={staggerParent}
          >
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12px] text-[#87867f]"
            >
              <span className="relative flex h-2 w-2">
                {!reduceMotion && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c96442] opacity-60" />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c96442]" />
              </span>
              {t('courses.exploreSubtitle')}
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="text-4xl text-[#141413] sm:text-5xl"
              style={{ fontFamily: 'var(--font-serif-ar)', fontWeight: 500 }}
            >
              {t('courses.exploreTitle')}
            </motion.h1>

            {/* Terracotta accent rule */}
            <motion.div
              variants={fadeUp}
              className="h-1 w-20 rounded-full bg-gradient-to-r from-[#c96442] to-[#d97757]"
            />

            <motion.p
              variants={fadeUp}
              className="max-w-xl text-[17px] leading-relaxed text-[#5e5d59]"
            >
              {t('courses.exploreSubtitle')}
            </motion.p>
          </motion.div>
        </section>

        {loading ? (
          <div className={GRID_CLASS} aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#f0eee6] bg-[#faf9f5] px-6 py-20 text-center shadow-whisper">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#c96442]/10">
              <AlertTriangle className="h-7 w-7 text-[#c96442]" />
            </div>
            <h2
              className="mb-2 text-xl text-[#141413]"
              style={{ fontFamily: 'var(--font-serif-ar)', fontWeight: 500 }}
            >
              {t('courses.errorTitle')}
            </h2>
            <p className="max-w-md text-[#5e5d59]">{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#f0eee6] bg-[#faf9f5] px-6 py-20 text-center shadow-whisper">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8e6dc]">
              <BookOpen className="h-7 w-7 text-[#87867f]" />
            </div>
            <p className="max-w-md text-[#5e5d59]">{t('courses.noCourses')}</p>
          </div>
        ) : (
          <motion.div
            className={GRID_CLASS}
            initial="hidden"
            animate="visible"
            variants={staggerParent}
          >
            {courses.map((course) => (
              <motion.div key={course.id} variants={fadeUp} className="h-full">
                <CourseCard course={course} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
