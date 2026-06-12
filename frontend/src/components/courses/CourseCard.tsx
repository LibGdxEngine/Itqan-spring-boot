import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CourseResponse } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, BarChart, ArrowRight } from 'lucide-react';

interface CourseCardProps {
  course: CourseResponse;
}

export function CourseCard({ course }: CourseCardProps) {
  const t = useTranslations();
  const price = typeof course.price === 'number' ? course.price : 0;
  const levelLabel =
    course.level && t.has(`courses.levels.${course.level}`)
      ? t(`courses.levels.${course.level}`)
      : course.level;

  return (
    <Card className="group relative flex flex-col h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#c96442]/40 hover:shadow-[0_12px_32px_rgba(201,100,66,0.12)]">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full overflow-hidden rounded-t-2xl bg-[#c96442]">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt={course.title ?? ''}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #c96442 0%, #d97757 100%)',
              }}
            >
              <div className="absolute inset-0 pattern-islamic opacity-30" />
              <BookOpen className="relative h-16 w-16 text-[#faf9f5] opacity-90 drop-shadow-sm" />
            </div>
          )}

          {/* Bottom gradient overlay so the level pill stays legible */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
          />

          {/* Floating level badge */}
          {levelLabel ? (
            <span className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-[#faf9f5]/95 px-3 py-1 text-xs font-semibold text-[#c96442] shadow-whisper backdrop-blur-sm">
              <BarChart className="h-3 w-3" />
              {levelLabel}
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex-grow p-6 pt-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3
            className="line-clamp-2 text-xl leading-snug text-[#141413]"
            style={{ fontFamily: 'var(--font-serif-ar)', fontWeight: 500 }}
          >
            {course.title}
          </h3>
          <span className="shrink-0 text-xl font-bold text-[#c96442]">
            ${price.toFixed(2)}
          </span>
        </div>

        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#5e5d59]">
          {course.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-[#87867f]">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{course.duration}h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart className="h-4 w-4" />
            <span>{levelLabel}</span>
          </div>
        </div>

        <div className="mt-4 text-sm text-[#87867f]">
          {t('courses.instructorLabel')}{' '}
          <span className="font-semibold text-[#5e5d59]">
            {course.instructor}
          </span>
        </div>
      </CardContent>

      <CardFooter className="mt-auto p-6 pt-0">
        <Link href={`/courses/${course.id}`} className="w-full">
          <Button className="group/btn w-full bg-[#c96442] text-[#faf9f5] hover:bg-[#b55836]">
            {t('courses.viewCourse')}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
