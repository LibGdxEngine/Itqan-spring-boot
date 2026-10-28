"use client"

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { BarChart, BookOpen, Clock, PlayCircle, Users } from 'lucide-react';

import { StarRating } from '@/components/courses/StarRating';
import { WishlistButton } from '@/components/courses/wishlist';
import type { CatalogCourse } from '@/lib/learning-api';
import { formatPrice, useSiteCurrency } from '@/lib/use-site-currency';

interface CourseCardProps {
  course: CatalogCourse;
}

export function CourseCard({ course }: CourseCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const currency = useSiteCurrency();
  const levelLabel =
    course.level && t.has(`courses.levels.${course.level}`) ? t(`courses.levels.${course.level}`) : course.level;
  const price = formatPrice(course.price, currency, locale, t('catalog.free'));

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_0_0_1px_var(--color-line-strong)] transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_12px_32px_rgba(201,100,66,0.12)]">
      <div className="relative h-44 w-full overflow-hidden bg-brand">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundImage: 'linear-gradient(135deg, #c96442 0%, #d97757 100%)' }}
          >
            <div className="absolute inset-0 pattern-islamic opacity-30" />
            <BookOpen className="relative h-14 w-14 text-on-night opacity-90" />
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {levelLabel ? (
          <span className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1 text-xs font-semibold text-brand shadow-whisper">
            <BarChart className="h-3 w-3" />
            {levelLabel}
          </span>
        ) : null}
        <WishlistButton courseId={course.id} className="absolute end-3 top-3 z-10" />
      </div>

      <div className="flex flex-grow flex-col p-5">
        <h3 className="mb-1 line-clamp-2 text-lg leading-snug text-ink" style={{ fontFamily: 'var(--font-serif-ar)', fontWeight: 500 }}>
          {/* The whole card is clickable through this stretched link. */}
          <Link href={`/courses/${course.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {course.title}
          </Link>
        </h3>
        <p className="mb-3 text-sm text-ink-3">{course.instructor}</p>

        <div className="mb-3 flex items-center gap-2 text-sm">
          {course.reviewCount > 0 ? (
            <>
              <span className="font-semibold text-warning" dir="ltr">{course.rating.toFixed(1)}</span>
              <StarRating value={course.rating} label={t('catalog.ratingLabel', { rating: course.rating.toFixed(1) })} />
              <span className="text-ink-3" dir="ltr">({course.reviewCount})</span>
            </>
          ) : (
            <span className="text-xs text-ink-3">{t('catalog.newCourse')}</span>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5" /> {t('catalog.lessons', { count: course.lessonCount })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {t('catalog.hours', { count: course.durationHours })}
          </span>
          {course.studentCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {t('catalog.students', { count: course.studentCount })}
            </span>
          ) : null}
        </div>
        <p className="mt-4 text-xl font-bold text-ink">{price}</p>
      </div>
    </article>
  );
}
