import { notFound } from "next/navigation"

/** Developer showcase for the video player; not part of the public site. */
export default function VideoDemoLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound()
  return children
}
