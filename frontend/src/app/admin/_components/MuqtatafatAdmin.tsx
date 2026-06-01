"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Music2, Trash2, Upload, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { clipsApi, ClipResponse } from "@/lib/clips"

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "-"
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString()
}

export function MuqtatafatAdmin() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [clips, setClips] = useState<ClipResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

  const fetchClips = useCallback(async () => {
    setLoading(true)
    try {
      const page = await clipsApi.list({ size: 500 })
      setClips(page.content)
    } catch (err) {
      toast({ title: "خطأ", description: getErrorMessage(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void fetchClips()
  }, [fetchClips])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    if (fileInputRef.current) fileInputRef.current.value = ""

    setUploading(true)
    setUploadProgress(`جارٍ رفع ${files.length} ملف...`)
    try {
      const uploaded = await clipsApi.bulkUpload(files)
      toast({ title: "تم الرفع", description: `تم رفع ${uploaded.length} مقطع بنجاح` })
      setClips((prev) => [...uploaded, ...prev])
    } catch (err) {
      toast({ title: "فشل الرفع", description: getErrorMessage(err), variant: "destructive" })
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingIds((prev) => new Set(prev).add(id))
    try {
      await clipsApi.delete(id)
      setClips((prev) => prev.filter((c) => c.id !== id))
      toast({ title: "تم الحذف", description: "تم حذف المقطع بنجاح" })
    } catch (err) {
      toast({ title: "فشل الحذف", description: getErrorMessage(err), variant: "destructive" })
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <section className="mt-12 bg-white rounded-2xl shadow-sm border border-[#f0eee6] overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#f0eee6] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#141413]">مقطتفات</h2>
          <p className="text-sm text-[#87867f] mt-0.5">مقاطع مرئية وصوتية عامة مجانية</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadProgress ?? "جارٍ الرفع..."}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                رفع مقاطع
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 text-[#c96442] animate-spin" />
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center text-[#87867f] py-16">لا توجد مقتطفات بعد. ارفع أول مقطع الآن.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f5f4ed]">
                <th className="px-4 py-3 text-right font-medium text-[#87867f]">العنوان</th>
                <th className="px-4 py-3 text-right font-medium text-[#87867f]">النوع</th>
                <th className="px-4 py-3 text-right font-medium text-[#87867f]">الحجم</th>
                <th className="px-4 py-3 text-right font-medium text-[#87867f]">التاريخ</th>
                <th className="px-4 py-3 text-right font-medium text-[#87867f]">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {clips.map((clip) => {
                const isDeleting = deletingIds.has(clip.id)
                return (
                  <tr key={clip.id} className="border-t border-[#f0eee6] hover:bg-[#faf9f5]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {clip.type === "VIDEO" ? (
                          <Video className="w-4 h-4 text-[#5e5d59] shrink-0" />
                        ) : (
                          <Music2 className="w-4 h-4 text-[#3b5e9e] shrink-0" />
                        )}
                        <span className="font-medium text-[#141413] truncate max-w-xs">{clip.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        clip.type === "VIDEO"
                          ? "bg-[#e8e6dc] text-[#4d4c48]"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        {clip.type === "VIDEO" ? "فيديو" : "صوت"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5e5d59]">{formatBytes(clip.sizeBytes)}</td>
                    <td className="px-4 py-3 text-[#87867f]">{formatDate(clip.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => void handleDelete(clip.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
