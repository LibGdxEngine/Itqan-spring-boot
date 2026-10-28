import { NextResponse, type NextRequest } from "next/server"

const LOCALES = new Set(["en", "ar"])

/**
 * `?lang=en|ar` selects the language for this request (so each language has a crawlable URL)
 * and remembers it in the NEXT_LOCALE cookie for later navigation.
 */
export function proxy(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang")
  if (!lang || !LOCALES.has(lang)) return NextResponse.next()

  const headers = new Headers(request.headers)
  headers.set("x-itqan-locale", lang)
  const response = NextResponse.next({ request: { headers } })
  if (request.cookies.get("NEXT_LOCALE")?.value !== lang) {
    response.cookies.set("NEXT_LOCALE", lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
  }
  return response
}

export const config = {
  // Pages only: skip API routes, Next internals and the files crawlers fetch directly.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|sw.js).*)"],
}
