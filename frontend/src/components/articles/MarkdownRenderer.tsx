"use client"

import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

const markdownComponents: Components = {
  h1: ({ ...props }) => (
    <h1
      className="mt-8 mb-4 text-3xl text-[#141413] font-serif-ar"
      style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
      {...props}
    />
  ),
  h2: ({ ...props }) => (
    <h2
      className="mt-7 mb-3 text-2xl text-[#141413] font-serif-ar"
      style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
      {...props}
    />
  ),
  h3: ({ ...props }) => (
    <h3
      className="mt-6 mb-2 text-xl text-[#141413] font-serif-ar"
      style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
      {...props}
    />
  ),
  p: ({ ...props }) => (
    <p className="my-4 text-[#3d3d3a] leading-relaxed" {...props} />
  ),
  a: ({ ...props }) => (
    <a
      className="text-[#c96442] underline underline-offset-2 hover:text-[#b55836] transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: ({ ...props }) => (
    <ul className="my-4 list-disc ps-6 space-y-1.5 text-[#3d3d3a]" {...props} />
  ),
  ol: ({ ...props }) => (
    <ol
      className="my-4 list-decimal ps-6 space-y-1.5 text-[#3d3d3a]"
      {...props}
    />
  ),
  li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
  blockquote: ({ ...props }) => (
    <blockquote
      className="my-5 border-s-4 border-[#e8e6dc] ps-4 text-[#5e5d59] italic"
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
        className="rounded bg-[#f0eee6] px-1.5 py-0.5 font-mono text-[0.875em] text-[#141413]"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ ...props }) => (
    <pre
      className="my-5 overflow-auto rounded-lg bg-[#141413] p-4 text-sm text-[#faf9f5]"
      {...props}
    />
  ),
  img: ({ ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img className="my-4 max-w-full rounded-lg" loading="lazy" {...props} />
  ),
  hr: ({ ...props }) => <hr className="my-8 border-[#e8e6dc]" {...props} />,
  table: ({ ...props }) => (
    <div className="my-5 overflow-x-auto">
      <table
        className="min-w-full border-collapse border border-[#e8e6dc] text-sm"
        {...props}
      />
    </div>
  ),
  th: ({ ...props }) => (
    <th
      className="border border-[#e8e6dc] bg-[#f0eee6] px-3 py-2 text-start font-semibold text-[#141413]"
      {...props}
    />
  ),
  td: ({ ...props }) => (
    <td
      className="border border-[#e8e6dc] px-3 py-2 text-[#3d3d3a]"
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
    <div className={cn("text-[#3d3d3a]", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
