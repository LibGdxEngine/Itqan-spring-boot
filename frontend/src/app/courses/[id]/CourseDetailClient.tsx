"use client";

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { AlertCircle, BarChart, BookOpen, Check, Clock, PlayCircle, Share2, Users } from 'lucide-react';

import { useAuth } from '@/components/auth-context';
import { Navbar } from '@/components/Navbar';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseCurriculum } from '@/components/courses/CourseCurriculum';
import { CourseReviews } from '@/components/courses/CourseReviews';
import { EnrollButton } from '@/components/courses/EnrollButton';
import { StarRating } from '@/components/courses/StarRating';
import { WishlistButton } from '@/components/courses/wishlist';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { VideoPlayer } from '@/components/video';
import { CoursesService, OpenAPI } from '@/lib/api';
import { CatalogCourse, catalogApi, learningApi } from '@/lib/learning-api';
import type { StudioCourse } from '@/lib/studio-api';
import { formatPrice, useSiteCurrency } from '@/lib/use-site-currency';
import { fadeUp, staggerParent } from '@/lib/motion';

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';


/** The course fields this page reads (the generated client predates outcomes/requirements/preview). */
type CourseDetail = StudioCourse;

/** Course page. The server passes the public course data in so the first paint is complete. */
export function CourseDetailClient({
    initialCourse,
    initialStats,
    initialRelated,
}: {
    initialCourse: CourseDetail | null;
    initialStats: CatalogCourse | null;
    initialRelated: CatalogCourse[];
}) {
    const params = useParams();
    const id = Number(params.id);
    const t = useTranslations();
    const locale = useLocale();
    const currency = useSiteCurrency();
    const { toast } = useToast();
    const { user, isAuthenticated } = useAuth();

    const [course, setCourse] = React.useState<CourseDetail | null>(initialCourse);
    const [stats, setStats] = React.useState<CatalogCourse | null>(initialStats);
    const [related, setRelated] = React.useState<CatalogCourse[]>(initialRelated);
    const [enrolled, setEnrolled] = React.useState(false);
    const [loading, setLoading] = React.useState(!initialCourse);
    const [error, setError] = React.useState(false);
    const [previewOpen, setPreviewOpen] = React.useState(false);

    // Only fetch in the browser when the server couldn't (e.g. a draft the signed-in owner previews).
    React.useEffect(() => {
        if (!id || initialCourse) return;
        let cancelled = false;
        CoursesService.getCourseById(id)
            .then((data) => {
                if (cancelled) return;
                setCourse(data as unknown as CourseDetail);
                setError(false);
                catalogApi
                    .search({ category: data.category, sort: 'popular', size: 5 })
                    .then((page) => !cancelled && setRelated(page.content.filter((c) => c.id !== id).slice(0, 4)))
                    .catch(() => undefined);
            })
            .catch(() => !cancelled && setError(true))
            .finally(() => !cancelled && setLoading(false));
        catalogApi
            .course(id)
            .then((s) => !cancelled && setStats(s))
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [id, initialCourse]);

    React.useEffect(() => {
        if (!id || !isAuthenticated || user?.role !== 'STUDENT') return;
        learningApi
            .courseState(id)
            .then((state) => setEnrolled(state.enrolled))
            .catch(() => setEnrolled(false));
    }, [id, isAuthenticated, user?.role]);

    const share = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: course?.title, url });
                return;
            }
            await navigator.clipboard.writeText(url);
            toast({ title: t('courseDetail.linkCopied') });
        } catch {
            // The share sheet was dismissed; nothing to do.
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-canvas">
                <Navbar />
                <div className="bg-night pb-12 pt-24">
                    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                        <div className="skeleton h-7 w-28 rounded-full" />
                        <div className="skeleton h-12 w-3/4 rounded-xl" />
                        <div className="skeleton h-4 w-2/3 rounded" />
                    </div>
                </div>
                <div className="mx-auto max-w-7xl space-y-4 px-4 py-12 sm:px-6 lg:px-8">
                    <div className="skeleton h-40 w-full rounded-xl lg:w-2/3" />
                    <div className="skeleton h-64 w-full rounded-xl lg:w-2/3" />
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen bg-canvas">
                <Navbar />
                <div className="flex h-[80vh] flex-col items-center justify-center px-4 text-center">
                    <AlertCircle className="mb-4 h-16 w-16 text-brand" />
                    <h1 className="mb-2 text-2xl font-bold text-ink">{t('courses.notFoundTitle')}</h1>
                    <p className="mb-6 text-ink-2">{t('courses.notFoundDesc')}</p>
                    <Link href="/courses" className="font-medium text-brand hover:underline">
                        {t('courseDetail.browseOthers')}
                    </Link>
                </div>
            </div>
        );
    }

    const price = typeof course.price === 'number' ? course.price : 0;
    const instructorName = course.instructor || t('courses.unknownInstructor');
    const levelLabel =
        course.level && t.has(`courses.levels.${course.level}`) ? t(`courses.levels.${course.level}`) : course.level;
    const lessonCount = stats?.lessonCount ?? course.modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
    const outcomes = course.learningOutcomes ?? [];
    const requirements = course.requirements ?? [];
    const updated = new Date(course.updatedAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
        month: 'long',
        year: 'numeric',
    });
    const isStaff = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';

    const purchaseCard = (
        <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-xl">
            <div className="relative h-48 bg-brand">
                {course.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <BookOpen className="h-20 w-20 text-on-night" />
                    </div>
                )}
                {course.previewVideoUrl ? (
                    <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 text-white transition hover:bg-black/45"
                    >
                        <PlayCircle className="h-14 w-14" />
                        <span className="text-sm font-semibold">{t('courseDetail.watchPreview')}</span>
                    </button>
                ) : null}
            </div>
            <div className="space-y-4 p-6">
                <p className="text-4xl font-bold tracking-tight text-ink">
                    {formatPrice(price, currency, locale, t('catalog.free'))}
                </p>
                {isStaff ? (
                    <p className="rounded-lg bg-subtle px-3 py-2 text-sm text-ink-2">{t('courseDetail.staffNote')}</p>
                ) : (
                    <EnrollButton courseId={course.id} coursePrice={price} courseTitle={course.title} />
                )}
                <div className="flex gap-2">
                    {!enrolled ? <WishlistButton courseId={course.id} variant="full" /> : null}
                    <button
                        type="button"
                        onClick={() => void share()}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-line-strong bg-paper px-4 text-sm font-medium text-ink transition hover:bg-subtle"
                    >
                        <Share2 className="h-4 w-4" /> {t('courseDetail.share')}
                    </button>
                </div>
                <ul className="space-y-2.5 text-sm text-ink-2">
                    {[
                        t('courseDetail.includes.lessons', { count: lessonCount }),
                        t('courseDetail.includes.hours', { count: course.duration }),
                        t('courses.fullLifetimeAccess'),
                        t('courses.certificate'),
                    ].map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/12 text-brand">
                                <Check className="h-3 w-3" />
                            </span>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-canvas">
            <Navbar />

            <div id="main-content" className="relative bg-night pb-12 pt-24 text-on-night">
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div
                        className="absolute -top-32 end-[-8%] h-[520px] w-[520px] opacity-30 blur-3xl"
                        style={{ background: 'radial-gradient(circle at 50% 50%, #d97757 0%, transparent 60%)' }}
                    />
                    <div className="absolute inset-0 pattern-islamic opacity-[0.06]" />
                </div>
                <motion.div
                    className="relative mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8 lg:pe-[calc(33%+2rem)]"
                    // Server-rendered: show the hero straight away rather than fading it in.
                    initial={false}
                    animate="visible"
                    variants={staggerParent}
                >
                    <motion.nav variants={fadeUp} aria-label={t('courseDetail.breadcrumb')} className="text-sm text-on-night-2">
                        <Link href="/courses" className="hover:text-white">
                            {t('courseDetail.allCourses')}
                        </Link>
                        {course.category && course.category !== 'GENERAL' ? (
                            <>
                                <span className="mx-2">/</span>
                                <Link href={`/courses?category=${encodeURIComponent(course.category)}`} className="hover:text-white">
                                    {course.category}
                                </Link>
                            </>
                        ) : null}
                    </motion.nav>
                    <motion.h1 variants={fadeUp} className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                        {course.title}
                    </motion.h1>
                    {course.description ? (
                        <motion.p variants={fadeUp} className="line-clamp-3 max-w-3xl text-lg leading-relaxed text-on-night-2">
                            {course.description}
                        </motion.p>
                    ) : null}
                    <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                        {stats && stats.reviewCount > 0 ? (
                            <a href="#reviews-heading" className="flex items-center gap-2 hover:underline">
                                <span className="font-bold text-star" dir="ltr">{stats.rating.toFixed(1)}</span>
                                <StarRating value={stats.rating} label={t('catalog.ratingLabel', { rating: stats.rating.toFixed(1) })} />
                                <span className="text-on-night-2">{t('reviews.count', { count: stats.reviewCount })}</span>
                            </a>
                        ) : null}
                        {stats && stats.studentCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-on-night-soft">
                                <Users className="h-4 w-4 text-coral" /> {t('catalog.students', { count: stats.studentCount })}
                            </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5 text-on-night-soft">
                            <BarChart className="h-4 w-4 text-coral" /> {levelLabel}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-on-night-soft">
                            <Clock className="h-4 w-4 text-coral" /> {t('catalog.hours', { count: course.duration })}
                        </span>
                    </motion.div>
                    <motion.p variants={fadeUp} className="text-sm text-on-night-2">
                        {t('courses.createdBy')} <span className="font-semibold text-on-night">{instructorName}</span>
                        <span className="mx-2">·</span>
                        {t('courseDetail.updated', { date: updated })}
                    </motion.p>
                </motion.div>
            </div>

            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
                <aside className="lg:col-start-3 lg:row-start-1">
                    <div className="lg:sticky lg:top-24 lg:-mt-64">{purchaseCard}</div>
                </aside>

                <div className="space-y-10 lg:col-span-2 lg:row-start-1">
                    {outcomes.length > 0 ? (
                        <section className="rounded-xl border border-line-strong bg-surface p-6">
                            <h2 className="mb-4 text-2xl font-bold text-ink">{t('courseDetail.whatYouLearn')}</h2>
                            <ul className="grid gap-3 sm:grid-cols-2">
                                {outcomes.map((item) => (
                                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-button">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    <CourseCurriculum modules={course.modules as never} courseId={isAuthenticated ? course.id : undefined} />

                    {requirements.length > 0 ? (
                        <section>
                            <h2 className="mb-4 text-2xl font-bold text-ink">{t('courseDetail.requirements')}</h2>
                            <ul className="list-disc space-y-2 ps-5 text-ink-button">
                                {requirements.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    {course.description ? (
                        <section>
                            <h2 className="mb-4 text-2xl font-bold text-ink">{t('courses.description')}</h2>
                            <p className="whitespace-pre-line leading-relaxed text-ink-2">{course.description}</p>
                        </section>
                    ) : null}

                    <section className="rounded-xl border border-line-strong bg-surface p-6">
                        <h2 className="mb-4 text-xl font-bold text-ink">{t('courseDetail.instructor')}</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">
                                {instructorName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-ink">{instructorName}</p>
                                <Link href="/instructors" className="text-sm text-brand hover:underline">
                                    {t('courseDetail.allInstructors')}
                                </Link>
                            </div>
                        </div>
                    </section>

                    <CourseReviews courseId={course.id} canReview={enrolled} />
                </div>
            </div>

            {related.length > 0 ? (
                <section className="border-t border-line-strong bg-surface py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h2 className="mb-6 text-2xl font-bold text-ink">{t('courseDetail.related')}</h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {related.map((c) => (
                                <CourseCard key={c.id} course={c} />
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('courseDetail.previewTitle', { title: course.title })}</DialogTitle>
                    </DialogHeader>
                    {previewOpen && course.previewVideoUrl ? (
                        <VideoPlayer videoUrl={course.previewVideoUrl} lessonId={0} autoPlay />
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}
