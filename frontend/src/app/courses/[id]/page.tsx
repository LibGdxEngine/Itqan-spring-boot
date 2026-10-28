import { CourseDetailClient } from "./CourseDetailClient"
import { getCourseData } from "./course-data"

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { course, stats, related } = await getCourseData(id)
  return <CourseDetailClient initialCourse={course} initialStats={stats} initialRelated={related} />
}
