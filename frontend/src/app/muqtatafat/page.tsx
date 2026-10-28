"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { Navbar } from "@/components/Navbar"
import { ClipCard } from "@/components/clips/ClipCard"
import { clipsApi, ClipResponse, ClipType } from "@/lib/clips"
import { Input } from "@/components/ui/input"

type FilterType = "" | ClipType

const TABS: { label: "all" | "video" | "audio"; value: FilterType }[] = [
  { label: "all", value: "" },
  { label: "video", value: "VIDEO" },
  { label: "audio", value: "AUDIO" },
]

export default function MuqtatafatPage() {
  const t = useTranslations("clipsPage")
  const [clips, setClips] = useState<ClipResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeType, setActiveType] = useState<FilterType>("")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const fetchClips = useCallback(async (q: string, type: FilterType, pageNum: number, append: boolean) => {
    if (pageNum === 0) setLoading(true)
    else setLoadingMore(true)
    setError(null)
    try {
      const result = await clipsApi.list({ search: q || undefined, type: type || undefined, page: pageNum, size: 24 })
      setClips((prev) => append ? [...prev, ...result.content] : result.content)
      setTotalPages(result.totalPages)
      setPage(result.number)
    } catch {
      setError("تعذّر تحميل المقتطفات. حاول مجدداً لاحقاً.")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // Initial load and when type changes
  useEffect(() => {
    fetchClips(search, activeType, 0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType])

  // Debounced search
  const handleSearch = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchClips(value, activeType, 0, false)
    }, 350)
  }

  const handleLoadMore = () => {
    fetchClips(search, activeType, page + 1, true)
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="mb-8 text-end" dir="rtl">
          <h1 className="text-3xl font-bold text-ink font-serif-ar">{t("title")}</h1>
          <p className="mt-2 text-ink-2">{t("subtitle")}</p>
        </div>

        {/* Search + Filter row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8" dir="rtl">
          <div className="relative flex-1">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className="pe-9 text-end bg-paper border-line-strong focus:border-ink"
              dir="rtl"
            />
          </div>

          {/* Type tabs */}
          <div className="flex gap-2 shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveType(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeType === tab.value
                    ? "bg-night text-on-night"
                    : "bg-paper border border-line-strong text-ink-2 hover:border-ink"
                }`}
              >
                {t(`tabs.${tab.label}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 text-brand animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-danger py-12">{error}</div>
        ) : clips.length === 0 ? (
          <div className="text-center text-ink-3 py-12" dir="rtl">
            {t("empty")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {clips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} />
              ))}
            </div>

            {page < totalPages - 1 && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-lg bg-night text-on-night text-sm font-medium hover:bg-[#2a2925] disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                  تحميل المزيد
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
