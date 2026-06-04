import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CourseResponse } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, BarChart } from 'lucide-react';

interface CourseCardProps {
  course: CourseResponse;
}

export function CourseCard({ course }: CourseCardProps) {
  const t = useTranslations();
  const price = typeof course.price === 'number' ? course.price : 0;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="h-48 w-full overflow-hidden rounded-t-lg bg-[#c96442]">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt={course.title ?? ''}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-16 w-16 text-[#faf9f5] opacity-80" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6">
        <div className="flex justify-between items-start mb-2">
            <span className="bg-[#f0eee6] text-[#c96442] text-xs px-2 py-1 rounded-full font-semibold">
              {course.level}
            </span>
            <span className="text-xl font-bold text-gray-900">
                ${price.toFixed(2)}
            </span>
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-900 line-clamp-2">{course.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{course.duration}h</span>
          </div>
          <div className="flex items-center">
             <BarChart className="h-4 w-4 mr-1" />
             <span>{course.level}</span>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
            {t('courses.instructorLabel')} <span className="font-semibold text-gray-700">{course.instructor}</span>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0 mt-auto">
        <Link href={`/courses/${course.id}`} className="w-full">
            <Button className="w-full bg-[#c96442] hover:bg-[#b55836] text-[#faf9f5]">
                {t('courses.viewCourse')}
            </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
