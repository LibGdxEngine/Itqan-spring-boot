"use client"

import { useState } from "react"
import { Music2, Play, X } from "lucide-react"
import { ClipResponse } from "@/lib/clips"

interface ClipCardProps {
  clip: ClipResponse
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return ""
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function ClipCard({ clip }: ClipCardProps) {
  const [open, setOpen] = useState(false)
  const isVideo = clip.type === "VIDEO"

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group cursor-pointer rounded-xl border border-line-strong bg-surface hover:border-ring-warm hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        {/* Thumbnail / icon area */}
        <div className="relative flex items-center justify-center h-40 bg-subtle">
          {isVideo ? (
            <div className="flex flex-col items-center gap-2 text-ink-3">
              <div className="w-14 h-14 rounded-full bg-sand flex items-center justify-center group-hover:bg-ring-warm transition-colors">
                <Play className="w-6 h-6 text-ink translate-x-0.5" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-ink-3">
              <div className="w-14 h-14 rounded-full bg-sand flex items-center justify-center group-hover:bg-ring-warm transition-colors">
                <Music2 className="w-6 h-6 text-ink" />
              </div>
            </div>
          )}
          <span className={`absolute top-2 end-2 text-xs font-medium px-2 py-0.5 rounded-full ${
            isVideo
              ? "bg-night text-on-night"
              : "bg-[#3b5e9e] text-white"
          }`}>
            {isVideo ? "فيديو" : "صوت"}
          </span>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="font-medium text-ink text-sm leading-snug line-clamp-2 text-end" dir="auto">
            {clip.title}
          </p>
          {clip.sizeBytes != null && (
            <p className="mt-1 text-xs text-ink-3 text-end">{formatBytes(clip.sizeBytes)}</p>
          )}
        </div>
      </div>

      {/* Modal player */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl bg-night rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 end-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="px-4 pt-4 pb-2 text-sm font-medium text-on-night-soft text-end" dir="auto">
              {clip.title}
            </p>
            {isVideo ? (
              <video
                src={clip.fileUrl}
                controls
                autoPlay
                className="w-full max-h-[70vh] bg-black"
              />
            ) : (
              <div className="flex items-center justify-center p-8">
                <audio src={clip.fileUrl} controls autoPlay className="w-full" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
