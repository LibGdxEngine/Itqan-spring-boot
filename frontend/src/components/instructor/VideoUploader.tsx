"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { CheckCircle2, Loader2, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  abortLessonVideoMultipartUpload,
  completeLessonVideoMultipartUpload,
  initiateLessonVideoMultipartUpload,
} from "@/lib/lessonVideoUploadService"
import { LessonResponse } from "@/lib/api"
import { MEDIA_FILE_ACCEPT, guessMediaMimeType } from "@/lib/videoSource"

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024 // 5 GB
const RETRY_COUNT = 3

type Phase = "idle" | "preparing" | "uploading" | "completing" | "done" | "error" | "cancelled"

interface VideoUploaderProps {
  lessonId: number
  onUploaded?: (lesson: LessonResponse) => void
}

interface UploadContext {
  uploadId: string
  objectKey: string
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, idx)
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}

async function uploadPartWithRetry(
  url: string,
  chunk: Blob,
  contentType: string,
  signal: AbortSignal,
  onAttempt: (attempt: number) => void,
): Promise<string> {
  let lastError: unknown = null
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError")
    onAttempt(attempt)
    try {
      const response = await fetch(url, {
        method: "PUT",
        body: chunk,
        headers: { "Content-Type": contentType },
        signal,
      })
      if (!response.ok) {
        throw new Error(`Upload failed (status ${response.status})`)
      }
      const etag = response.headers.get("ETag")
      if (!etag) throw new Error("Missing ETag in response")
      return etag
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") throw err
      lastError = err
      if (attempt < RETRY_COUNT) {
        const wait = Math.min(2000, 250 * Math.pow(2, attempt))
        await new Promise((resolve) => setTimeout(resolve, wait))
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Upload failed after retries")
}

export function VideoUploader({ lessonId, onUploaded }: VideoUploaderProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const contextRef = useRef<UploadContext | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [progress, setProgress] = useState(0) // 0..100
  const [partInfo, setPartInfo] = useState<{ current: number; total: number; attempt: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setFile(null)
    setPhase("idle")
    setProgress(0)
    setPartInfo(null)
    setError(null)
    contextRef.current = null
    abortRef.current = null
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  const onSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    if (!selected) {
      setFile(null)
      return
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError(t("instructor.videoUploader.tooLarge", { max: "5 GB" }))
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    setError(null)
    setPhase("idle")
    setProgress(0)
    setFile(selected)
  }

  const cancelUpload = useCallback(async () => {
    abortRef.current?.abort()
    if (contextRef.current) {
      try {
        await abortLessonVideoMultipartUpload(
          lessonId,
          contextRef.current.uploadId,
          contextRef.current.objectKey,
        )
      } catch {
        // best effort
      }
    }
    setPhase("cancelled")
  }, [lessonId])

  const startUpload = useCallback(async () => {
    if (!file) return
    const controller = new AbortController()
    abortRef.current = controller
    setError(null)
    setProgress(0)
    setPhase("preparing")

    const mimeType = guessMediaMimeType(file)
    try {
      const init = await initiateLessonVideoMultipartUpload(lessonId, {
        filename: file.name,
        mimeType,
        fileSizeBytes: file.size,
      })
      contextRef.current = { uploadId: init.uploadId, objectKey: init.objectKey }

      const sortedParts = [...init.partUrls].sort((a, b) => a.partNumber - b.partNumber)
      const completed: { partNumber: number; etag: string }[] = []
      let uploadedBytes = 0

      setPhase("uploading")
      for (const part of sortedParts) {
        if (controller.signal.aborted) {
          throw new DOMException("Aborted", "AbortError")
        }
        const start = (part.partNumber - 1) * init.partSizeBytes
        const end = Math.min(start + init.partSizeBytes, file.size)
        const chunk = file.slice(start, end)

        setPartInfo({ current: part.partNumber, total: sortedParts.length, attempt: 1 })
        const etag = await uploadPartWithRetry(
          part.url,
          chunk,
          mimeType,
          controller.signal,
          (attempt) =>
            setPartInfo({ current: part.partNumber, total: sortedParts.length, attempt }),
        )

        completed.push({ partNumber: part.partNumber, etag })
        uploadedBytes += chunk.size
        setProgress(Math.min(99, Math.round((uploadedBytes / file.size) * 100)))
      }

      setPhase("completing")
      const lesson = await completeLessonVideoMultipartUpload(lessonId, {
        uploadId: init.uploadId,
        objectKey: init.objectKey,
        parts: completed,
      })

      setProgress(100)
      setPhase("done")
      contextRef.current = null
      onUploaded?.(lesson)
      toast({
        title: t("instructor.videoUploader.successTitle"),
      })
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError" || phase === "cancelled") {
        setPhase("cancelled")
        return
      }
      const message = err instanceof Error ? err.message : t("instructor.videoUploader.failed")
      setError(message)
      setPhase("error")
      // Best-effort abort upstream so MinIO/S3 cleans up
      if (contextRef.current) {
        try {
          await abortLessonVideoMultipartUpload(
            lessonId,
            contextRef.current.uploadId,
            contextRef.current.objectKey,
          )
        } catch {
          // ignored
        }
        contextRef.current = null
      }
      toast({
        title: t("instructor.videoUploader.failed"),
        description: message,
        variant: "destructive",
      })
    } finally {
      abortRef.current = null
    }
  }, [file, lessonId, onUploaded, phase, t, toast])

  const isBusy = phase === "preparing" || phase === "uploading" || phase === "completing"

  return (
    <div className="space-y-3 rounded-lg border border-line bg-paper p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={MEDIA_FILE_ACCEPT}
          onChange={onSelect}
          disabled={isBusy}
          className="block text-sm text-ink-button file:me-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-subtle"
        />
        {file && phase !== "done" && !isBusy && (
          <Button onClick={() => void startUpload()} size="sm">
            <Upload className="me-1 h-4 w-4" />
            {t("instructor.videoUploader.start")}
          </Button>
        )}
      </div>

      {file && (
        <p className="text-xs text-ink-3">
          {file.name} • {formatBytes(file.size)}
        </p>
      )}

      {(phase === "preparing" || phase === "uploading" || phase === "completing") && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-2">
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
              {phase === "preparing" && t("instructor.videoUploader.preparing")}
              {phase === "uploading" && partInfo &&
                t("instructor.videoUploader.partProgress", {
                  current: partInfo.current,
                  total: partInfo.total,
                })}
              {phase === "uploading" && partInfo && partInfo.attempt > 1 &&
                ` (${t("instructor.videoUploader.retryAttempt", { n: partInfo.attempt })})`}
              {phase === "completing" && t("instructor.videoUploader.finalizing")}
            </span>
            <span className="font-medium text-ink">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => void cancelUpload()}>
            <X className="me-1 h-4 w-4" />
            {t("instructor.videoUploader.cancel")}
          </Button>
        </div>
      )}

      {phase === "done" && (
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          {t("instructor.videoUploader.done")}
          <Button variant="ghost" size="sm" onClick={reset}>
            {t("instructor.videoUploader.uploadAnother")}
          </Button>
        </div>
      )}

      {phase === "cancelled" && (
        <div className="flex items-center justify-between gap-2 text-sm text-ink-3">
          <span>{t("instructor.videoUploader.cancelled")}</span>
          <Button variant="ghost" size="sm" onClick={reset}>
            {t("instructor.videoUploader.retry")}
          </Button>
        </div>
      )}

      {phase === "error" && error && (
        <div className="flex flex-col gap-2 rounded-md border border-danger-line bg-brand-soft p-3 text-sm text-danger">
          <span>{error}</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void startUpload()}>
              {t("instructor.videoUploader.retry")}
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              {t("instructor.videoUploader.cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
