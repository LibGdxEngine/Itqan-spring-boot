"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  Image as ImageIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  SquareCode,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "@/components/articles/MarkdownRenderer"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

type ToolbarAction = {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  run: (ctx: SelectionContext) => Replacement
}

interface SelectionContext {
  before: string
  selected: string
  after: string
}

interface Replacement {
  // new full text
  text: string
  // selection range to restore (absolute indices)
  selectionStart: number
  selectionEnd: number
}

function wrapInline(
  ctx: SelectionContext,
  marker: string,
  placeholder: string,
): Replacement {
  const content = ctx.selected || placeholder
  const text = `${ctx.before}${marker}${content}${marker}${ctx.after}`
  const start = ctx.before.length + marker.length
  return { text, selectionStart: start, selectionEnd: start + content.length }
}

function prefixLines(
  ctx: SelectionContext,
  prefix: string,
  placeholder: string,
): Replacement {
  const content = ctx.selected || placeholder
  const prefixed = content
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n")
  const text = `${ctx.before}${prefixed}${ctx.after}`
  const start = ctx.before.length
  return { text, selectionStart: start, selectionEnd: start + prefixed.length }
}

function orderedList(
  ctx: SelectionContext,
  placeholder: string,
): Replacement {
  const content = ctx.selected || placeholder
  const prefixed = content
    .split("\n")
    .map((line, idx) => `${idx + 1}. ${line}`)
    .join("\n")
  const text = `${ctx.before}${prefixed}${ctx.after}`
  const start = ctx.before.length
  return { text, selectionStart: start, selectionEnd: start + prefixed.length }
}

function insertLink(
  ctx: SelectionContext,
  labelPlaceholder: string,
): Replacement {
  const label = ctx.selected || labelPlaceholder
  const snippet = `[${label}](url)`
  const text = `${ctx.before}${snippet}${ctx.after}`
  // place selection over "url"
  const urlStart = ctx.before.length + snippet.length - 4
  return { text, selectionStart: urlStart, selectionEnd: urlStart + 3 }
}

function insertImage(
  ctx: SelectionContext,
  altPlaceholder: string,
): Replacement {
  const alt = ctx.selected || altPlaceholder
  const snippet = `![${alt}](url)`
  const text = `${ctx.before}${snippet}${ctx.after}`
  const urlStart = ctx.before.length + snippet.length - 4
  return { text, selectionStart: urlStart, selectionEnd: urlStart + 3 }
}

function insertCodeBlock(
  ctx: SelectionContext,
  placeholder: string,
): Replacement {
  const content = ctx.selected || placeholder
  const snippet = `\n\`\`\`\n${content}\n\`\`\`\n`
  const text = `${ctx.before}${snippet}${ctx.after}`
  const start = ctx.before.length + 5 // after "\n```\n"
  return { text, selectionStart: start, selectionEnd: start + content.length }
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const t = useTranslations()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [tab, setTab] = useState<"write" | "preview">("write")

  const charCount = value.length
  const readingMinutes = Math.max(1, Math.ceil(value.length / 1000))

  const applyAction = (action: ToolbarAction) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart ?? value.length
    const end = textarea.selectionEnd ?? value.length
    const ctx: SelectionContext = {
      before: value.slice(0, start),
      selected: value.slice(start, end),
      after: value.slice(end),
    }
    const result = action.run(ctx)
    onChange(result.text)
    // restore focus + selection on next frame (after controlled re-render)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  const actions: ToolbarAction[] = [
    {
      key: "bold",
      label: t("articles.toolbar.bold"),
      icon: Bold,
      run: (ctx) => wrapInline(ctx, "**", t("articles.toolbar.boldText")),
    },
    {
      key: "italic",
      label: t("articles.toolbar.italic"),
      icon: Italic,
      run: (ctx) => wrapInline(ctx, "*", t("articles.toolbar.italicText")),
    },
    {
      key: "h1",
      label: t("articles.toolbar.heading1"),
      icon: Heading1,
      run: (ctx) => prefixLines(ctx, "# ", t("articles.toolbar.headingText")),
    },
    {
      key: "h2",
      label: t("articles.toolbar.heading2"),
      icon: Heading2,
      run: (ctx) => prefixLines(ctx, "## ", t("articles.toolbar.headingText")),
    },
    {
      key: "h3",
      label: t("articles.toolbar.heading3"),
      icon: Heading3,
      run: (ctx) => prefixLines(ctx, "### ", t("articles.toolbar.headingText")),
    },
    {
      key: "link",
      label: t("articles.toolbar.link"),
      icon: Link2,
      run: (ctx) => insertLink(ctx, t("articles.toolbar.linkText")),
    },
    {
      key: "image",
      label: t("articles.toolbar.image"),
      icon: ImageIcon,
      run: (ctx) => insertImage(ctx, t("articles.toolbar.imageAlt")),
    },
    {
      key: "ul",
      label: t("articles.toolbar.bulletedList"),
      icon: List,
      run: (ctx) => prefixLines(ctx, "- ", t("articles.toolbar.listItem")),
    },
    {
      key: "ol",
      label: t("articles.toolbar.numberedList"),
      icon: ListOrdered,
      run: (ctx) => orderedList(ctx, t("articles.toolbar.listItem")),
    },
    {
      key: "quote",
      label: t("articles.toolbar.quote"),
      icon: Quote,
      run: (ctx) => prefixLines(ctx, "> ", t("articles.toolbar.quoteText")),
    },
    {
      key: "code",
      label: t("articles.toolbar.inlineCode"),
      icon: Code,
      run: (ctx) => wrapInline(ctx, "`", t("articles.toolbar.codeText")),
    },
    {
      key: "codeblock",
      label: t("articles.toolbar.codeBlock"),
      icon: SquareCode,
      run: (ctx) => insertCodeBlock(ctx, t("articles.toolbar.codeText")),
    },
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-surface">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-line bg-canvas px-2">
        <div className="flex">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "write"
                ? "border-b-2 border-brand text-ink"
                : "text-ink-3 hover:text-ink",
            )}
          >
            {t("articles.write")}
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "preview"
                ? "border-b-2 border-brand text-ink"
                : "text-ink-3 hover:text-ink",
            )}
          >
            {t("articles.preview")}
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5">
            {actions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.key}
                  type="button"
                  title={action.label}
                  aria-label={action.label}
                  onClick={() => applyAction(action)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-sand hover:text-ink"
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("articles.contentPlaceholder")}
            className="block min-h-[360px] w-full resize-y bg-surface px-4 py-3 font-mono text-sm text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </>
      ) : (
        <div className="min-h-[360px] px-4 py-3">
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-ink-3">
              {t("articles.previewEmpty")}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-line bg-canvas px-4 py-2 text-xs text-ink-3 ltr-flex">
        <span>{t("articles.charCount", { count: charCount })}</span>
        <span>{t("articles.readingTime", { minutes: readingMinutes })}</span>
      </div>
    </div>
  )
}

export default MarkdownEditor
