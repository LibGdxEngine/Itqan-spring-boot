"use client"

import { useState } from "react"
import { Play } from "lucide-react"

interface HeroVideoProps {
  videoUrl: string
  youTubeId: string | null
  title: string
  playLabel: string
}

/**
 * Lightweight hero player: shows a still with a branded play button and only loads the
 * YouTube iframe (privacy-enhanced domain, autoplay) once the visitor asks for it.
 */
export function HeroVideo({ videoUrl, youTubeId, title, playLabel }: HeroVideoProps) {
  const [playing, setPlaying] = useState(false)
  const [thumb, setThumb] = useState(youTubeId ? `https://i.ytimg.com/vi/${youTubeId}/maxresdefault.jpg` : null)

  if (!youTubeId) {
    return (
      <video
        src={videoUrl}
        controls
        preload="metadata"
        aria-label={title}
        className="absolute inset-0 h-full w-full object-cover"
      />
    )
  }

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youTubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`${playLabel}: ${title}`}
      className="group absolute inset-0 h-full w-full cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-focus"
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element -- external YouTube still, no optimisation needed
        <img
          src={thumb}
          alt=""
          loading="eager"
          decoding="async"
          onLoad={(e) => {
            // YouTube serves a 120px grey placeholder when no maxres still exists.
            if (e.currentTarget.naturalWidth < 200 && thumb.includes("maxresdefault")) {
              setThumb(`https://i.ytimg.com/vi/${youTubeId}/hqdefault.jpg`)
            }
          }}
          onError={() => setThumb(`https://i.ytimg.com/vi/${youTubeId}/hqdefault.jpg`)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
        />
      ) : null}
      {/* Calm the busy thumbnail so the play button and page headline lead. */}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-night/75 via-night/25 to-night/10" />
      <span
        aria-hidden
        className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-on-night shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-8 ring-on-night/20 transition-transform duration-200 motion-safe:group-hover:scale-110 sm:h-20 sm:w-20"
      >
        <Play className="h-7 w-7 translate-x-0.5 fill-current sm:h-8 sm:w-8" />
      </span>
    </button>
  )
}
