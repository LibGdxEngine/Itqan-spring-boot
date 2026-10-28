import { redirect } from "next/navigation"

/** "My courses" now lives on the student dashboard. */
export default function MyCoursesPage() {
  redirect("/dashboard")
}
