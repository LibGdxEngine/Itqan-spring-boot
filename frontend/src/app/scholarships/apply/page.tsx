import { Suspense } from "react"
import { scholarshipMetadata } from "../metadata"
import ApplyClient from "./ApplyClient"

export const generateMetadata = () => scholarshipMetadata("apply", "/scholarships/apply")

export default function ApplyPage() {
  return (
    <Suspense>
      <ApplyClient />
    </Suspense>
  )
}
