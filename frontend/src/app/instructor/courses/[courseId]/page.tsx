import { redirect } from "next/navigation"

export default async function CourseStudioIndex({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  redirect(`/instructor/courses/${courseId}/lessons`)
}
