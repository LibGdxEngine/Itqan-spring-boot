"use client"

import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

const markdownComponents: Components = {
  h1: ({ ...props }) => (
    <h1
      className="mt-8 mb-4 text-3xl text-ink font-serif-ar"
      style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
      {...props}
    />
  ),
  h2: ({ ...props }) => (
    <h2
      className="mt-7 mb-3 text-2xl text-ink font-serif-ar"
      style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
      {...props}
    />
  ),
  h3: ({ ...props }) => (
    <h3
      className="mt-6 mb-2 text-xl text-ink font-serif-ar"
      style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
      {...props}
    />
  ),
  p: ({ ...props }) => (
    <p className="my-4 text-ink-emphasis leading-relaxed" {...props} />
  ),
  a: ({ ...props }) => (
    <a
      className="text-brand underline underline-offset-2 hover:text-brand-hover transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: ({ ...props }) => (
    <ul className="my-4 list-disc ps-6 space-y-1.5 text-ink-emphasis" {...props} />
  ),
  ol: ({ ...props }) => (
    <ol
      className="my-4 list-decimal ps-6 space-y-1.5 text-ink-emphasis"
      {...props}
    />
  ),
  li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
  blockquote: ({ ...props }) => (
    <blockquote
      className="my-5 border-s-4 border-line-strong ps-4 text-ink-2 italic"
      {...props}
    />
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = typeof className === "string" && className.includes("language-")
    if (isBlock) {
      return (
        <code className={cn("font-mono text-sm", className)} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded bg-subtle px-1.5 py-0.5 font-mono text-[0.875em] text-ink"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ ...props }) => (
    <pre
      className="my-5 overflow-auto rounded-lg bg-night p-4 text-sm text-on-night"
      {...props}
    />
  ),
  img: ({ ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img className="my-4 max-w-full rounded-lg" loading="lazy" {...props} />
  ),
  hr: ({ ...props }) => <hr className="my-8 border-line-strong" {...props} />,
  table: ({ ...props }) => (
    <div className="my-5 overflow-x-auto">
      <table
        className="min-w-full border-collapse border border-line-strong text-sm"
        {...props}
      />
    </div>
  ),
  th: ({ ...props }) => (
    <th
      className="border border-line-strong bg-subtle px-3 py-2 text-start font-semibold text-ink"
      {...props}
    />
  ),
  td: ({ ...props }) => (
    <td
      className="border border-line-strong px-3 py-2 text-ink-emphasis"
      {...props}
    />
  ),
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("text-ink-emphasis", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
