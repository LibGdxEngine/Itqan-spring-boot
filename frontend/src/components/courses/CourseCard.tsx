import Link from 'next/link';
import { CourseResponse } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, BarChart } from 'lucide-react';

interface CourseCardProps {
  course: CourseResponse;
}

export function CourseCard({ course }: CourseCardProps) {
  const price = typeof course.price === 'number' ? course.price : 0;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="h-48 bg-gradient-to-r from-sky-400 to-indigo-500 w-full rounded-t-lg flex items-center justify-center">
             {/* Placeholder for course image */}
             <BookOpen className="h-16 w-16 text-white opacity-80" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6">
        <div className="flex justify-between items-start mb-2">
            <span className="bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded-full font-semibold">
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
            Instructor: <span className="font-semibold text-gray-700">{course.instructor}</span>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0 mt-auto">
        <Link href={`/courses/${course.id}`} className="w-full">
            <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white">
                View Course
            </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
