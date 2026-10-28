import { Navbar } from "@/components/Navbar"
import { SiteFooter } from "@/components/SiteFooter"

/** Navbar + content + footer frame for simple public pages. */
export function PublicPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
