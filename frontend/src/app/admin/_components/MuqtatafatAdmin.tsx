"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Loader2, Music2, Pencil, Trash2, Upload, Video, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field-row"
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
  const t = useTranslations("admin.clipsEditor")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [clips, setClips] = useState<ClipResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")

  const fetchClips = useCallback(async () => {
    setLoading(true)
    try {
      const page = await clipsApi.list({ size: 500 })
      setClips(page.content)
    } catch (err) {
      toast({ title: t("toasts.error"), description: getErrorMessage(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  useEffect(() => {
    void fetchClips()
  }, [fetchClips])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    if (fileInputRef.current) fileInputRef.current.value = ""

    setUploading(true)
    setUploadProgress(t("uploadingFiles", { count: files.length }))
    try {
      const uploaded = await clipsApi.bulkUpload(files)
      toast({ title: t("toasts.uploaded"), description: t("toasts.uploadedDescription", { count: uploaded.length }) })
      setClips((prev) => [...uploaded, ...prev])
    } catch (err) {
      toast({ title: t("toasts.uploadFailed"), description: getErrorMessage(err), variant: "destructive" })
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const startEdit = (clip: ClipResponse) => {
    setEditingId(clip.id)
    setEditTitle(clip.title)
    setEditDesc(clip.description ?? "")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
    setEditDesc("")
  }

  const handleSave = async (id: number) => {
    const title = editTitle.trim()
    if (!title) return
    setSavingIds((prev) => new Set(prev).add(id))
    try {
      const updated = await clipsApi.update(id, { title, description: editDesc.trim() || null })
      setClips((prev) => prev.map((c) => (c.id === id ? updated : c)))
      setEditingId(null)
      toast({ title: t("toasts.saved"), description: t("toasts.savedDescription") })
    } catch (err) {
      toast({ title: t("toasts.saveFailed"), description: getErrorMessage(err), variant: "destructive" })
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingIds((prev) => new Set(prev).add(id))
    try {
      await clipsApi.delete(id)
      setClips((prev) => prev.filter((c) => c.id !== id))
      toast({ title: t("toasts.deleted"), description: t("toasts.deletedDescription") })
    } catch (err) {
      toast({ title: t("toasts.deleteFailed"), description: getErrorMessage(err), variant: "destructive" })
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      {/* Header */}
      <div className="px-6 py-5 border-b border-line flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">{t("title")}</h2>
          <p className="text-sm text-ink-3 mt-0.5">{t("subtitle")}</p>
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
                {uploadProgress ?? t("uploading")}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {t("uploadButton")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 text-brand animate-spin" />
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center text-ink-3 py-16">{t("empty")}</div>
      ) : (
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-canvas">
                <th className="px-4 py-3 text-end font-medium text-ink-3">{t("columns.title")}</th>
                <th className="px-4 py-3 text-end font-medium text-ink-3">{t("columns.description")}</th>
                <th className="px-4 py-3 text-end font-medium text-ink-3">{t("columns.type")}</th>
                <th className="px-4 py-3 text-end font-medium text-ink-3">{t("columns.size")}</th>
                <th className="px-4 py-3 text-end font-medium text-ink-3">{t("columns.date")}</th>
                <th className="px-4 py-3 text-end font-medium text-ink-3">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {clips.map((clip) => {
                const isDeleting = deletingIds.has(clip.id)
                const isSaving = savingIds.has(clip.id)
                const isEditing = editingId === clip.id
                return (
                  <tr key={clip.id} className="border-t border-line hover:bg-surface">
                    {/* Title cell */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void handleSave(clip.id)
                            if (e.key === "Escape") cancelEdit()
                          }}
                          className="w-full border border-ring-warm rounded-md px-2 py-1 text-sm focus:outline-none focus:border-ink"
                          dir="rtl"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {clip.type === "VIDEO" ? (
                            <Video className="w-4 h-4 text-ink-2 shrink-0" />
                          ) : (
                            <Music2 className="w-4 h-4 text-[#3b5e9e] shrink-0" />
                          )}
                          <span className="font-medium text-ink truncate max-w-xs">{clip.title}</span>
                        </div>
                      )}
                    </td>

                    {/* Description cell */}
                    <td className="px-4 py-3 max-w-xs">
                      {isEditing ? (
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Escape") cancelEdit() }}
                          placeholder={t("descriptionPlaceholder")}
                          rows={2}
                          className="w-full border border-ring-warm rounded-md px-2 py-1 text-sm resize-none focus:outline-none focus:border-ink"
                          dir="rtl"
                        />
                      ) : (
                        <span className="text-ink-3 truncate block max-w-xs">
                          {clip.description || <span className="text-ring-warm">—</span>}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        clip.type === "VIDEO"
                          ? "bg-sand text-ink-button"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        {clip.type === "VIDEO" ? t("types.video") : t("types.audio")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-2">{formatBytes(clip.sizeBytes)}</td>
                    <td className="px-4 py-3 text-ink-3">{formatDate(clip.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSaving || !editTitle.trim()}
                              onClick={() => void handleSave(clip.id)}
                              className="text-success border-success-line hover:bg-success-soft hover:border-success-line"
                            >
                              {isSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSaving}
                              onClick={cancelEdit}
                              className="text-ink-2 border-ring-warm hover:bg-canvas"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => startEdit(clip)}
                            className="text-ink-2 border-ring-warm hover:bg-canvas"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isDeleting || isEditing}
                          onClick={() => void handleDelete(clip.id)}
                          className="text-danger border-danger-line hover:bg-danger-soft hover:border-danger-line"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && clips.length > 0 && (
        <div className="space-y-3 px-4 py-4 md:hidden">
          {clips.map((clip) => {
            const isDeleting = deletingIds.has(clip.id)
            const isSaving = savingIds.has(clip.id)
            const isEditing = editingId === clip.id
            return (
              <div key={clip.id} className="rounded-lg border border-line bg-surface p-4 text-sm">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSave(clip.id)
                        if (e.key === "Escape") cancelEdit()
                      }}
                      className="w-full border border-ring-warm rounded-md px-2 py-1 text-sm focus:outline-none focus:border-ink"
                      dir="rtl"
                      autoFocus
                    />
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit() }}
                      placeholder={t("descriptionPlaceholder")}
                      rows={2}
                      className="w-full border border-ring-warm rounded-md px-2 py-1 text-sm resize-none focus:outline-none focus:border-ink"
                      dir="rtl"
                    />
                  </div>
                ) : (
                  <>
                    <Field label={t("columns.title")}>
                      <span className="flex items-center gap-2">
                        {clip.type === "VIDEO" ? (
                          <Video className="w-4 h-4 text-ink-2 shrink-0" />
                        ) : (
                          <Music2 className="w-4 h-4 text-[#3b5e9e] shrink-0" />
                        )}
                        <span className="font-medium text-ink">{clip.title}</span>
                      </span>
                    </Field>
                    <Field label={t("columns.description")}>
                      {clip.description || <span className="text-ring-warm">—</span>}
                    </Field>
                    <Field label={t("columns.type")}>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        clip.type === "VIDEO"
                          ? "bg-sand text-ink-button"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        {clip.type === "VIDEO" ? t("types.video") : t("types.audio")}
                      </span>
                    </Field>
                    <Field label={t("columns.size")}>{formatBytes(clip.sizeBytes)}</Field>
                    <Field label={t("columns.date")}>{formatDate(clip.createdAt)}</Field>
                  </>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSaving || !editTitle.trim()}
                        onClick={() => void handleSave(clip.id)}
                        className="text-success border-success-line hover:bg-success-soft hover:border-success-line"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        onClick={cancelEdit}
                        className="text-ink-2 border-ring-warm hover:bg-canvas"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => startEdit(clip)}
                      className="text-ink-2 border-ring-warm hover:bg-canvas"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDeleting || isEditing}
                    onClick={() => void handleDelete(clip.id)}
                    className="text-danger border-danger-line hover:bg-danger-soft hover:border-danger-line"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
