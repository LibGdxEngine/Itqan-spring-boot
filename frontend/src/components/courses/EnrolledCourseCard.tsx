"use client"

import Link from "next/link"
import { PlayCircle, Clock, Award } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { EnrollmentResponse } from "@/lib/api"
import { useTranslations } from "next-intl"

interface EnrolledCourseCardProps {
  enrollment: EnrollmentResponse
}

export function EnrolledCourseCard({ enrollment }: EnrolledCourseCardProps) {
  const t = useTranslations()
  const enrolledAt = enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : "-"

  return (
    <div className="bg-[#faf9f5] rounded-xl border border-[#e8e6dc] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Course Image */}
      <div className="aspect-video relative bg-[#f0eee6]">
        {/* Placeholder for course image if available in backend, currently CourseResponse might not have image */}
        <div className="absolute inset-0 flex items-center justify-center text-[#87867f]">
           <PlayCircle className="w-12 h-12 opacity-50" />
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {enrollment.course?.title || "Untitled Course"}
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-[#87867f] mb-4">
            {/* If enrolledAt or other metadata exists */}
           <span className="flex items-center gap-1">
             <Clock className="w-4 h-4" />
             {/* Format date if needed */}
             {enrolledAt}
           </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#5e5d59] font-medium">
                {enrollment.progress}% {t("common.completed") || "Completed"}
            </span>
          </div>
          <Progress value={enrollment.progress} className="h-2" />
        </div>

        <Button asChild className="w-full">
          <Link href={`/learn/${enrollment.courseId}`}>
            {enrollment.progress && enrollment.progress > 0 
                ? (t("common.continueLearning") || "Continue Learning") 
                : (t("common.startLearning") || "Start Learning")}
          </Link>
        </Button>
      </div>
    </div>
  )
}
