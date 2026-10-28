"use client"

import { ChangeEvent, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ImagePlus, Loader2, X, Eye, Pencil, Newspaper } from "lucide-react"

import {
  articlesApi,
  validateArticleImage,
  type Article,
  type ArticleRequest,
} from "@/lib/articles"
import { getErrorMessage } from "@/lib/api-axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { MarkdownEditor } from "@/components/articles/MarkdownEditor"
import { MarkdownRenderer } from "@/components/articles/MarkdownRenderer"

interface ArticleEditorFormProps {
  mode: "create" | "edit"
  initial?: Article
}

export function ArticleEditorForm({ mode, initial }: ArticleEditorFormProps) {
  const router = useRouter()
  const t = useTranslations()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [category, setCategory] = useState(initial?.category ?? "")
  const [content, setContent] = useState(initial?.content ?? "")

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initial?.coverImageUrl ?? null,
  )
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const [fullPreview, setFullPreview] = useState(false)
  const [submitting, setSubmitting] = useState<"draft" | "publish" | null>(null)

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    }
  }, [coverPreview])

  const onPickCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const validation = validateArticleImage(file)
    if (!validation.ok) {
      toast({
        variant: "destructive",
        title: t("articles.errorTitle"),
        description:
          validation.reason === "size"
            ? t("instructor.thumbnailTooLarge")
            : t("instructor.thumbnailUnsupportedType"),
      })
      return
    }

    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const clearCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview(null)
    setCoverImageUrl(null)
  }

  const displayCover = coverPreview ?? coverImageUrl

  const submit = async (published: boolean) => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: t("articles.errorTitle"),
        description: t("articles.titleRequired"),
      })
      return
    }
    if (published && !content.trim()) {
      toast({
        variant: "destructive",
        title: t("articles.errorTitle"),
        description: t("articles.contentRequired"),
      })
      return
    }

    setSubmitting(published ? "publish" : "draft")
    try {
      let finalCoverUrl: string | undefined = coverImageUrl ?? undefined
      if (coverFile) {
        try {
          const uploaded = await articlesApi.uploadCoverImage(coverFile)
          finalCoverUrl = uploaded.url
        } catch (uploadError) {
          toast({
            variant: "destructive",
            title: t("articles.errorTitle"),
            description: getErrorMessage(uploadError),
          })
          setSubmitting(null)
          return
        }
      }

      const payload: ArticleRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        content,
        coverImageUrl: finalCoverUrl,
        category: category.trim() || undefined,
        published,
      }

      if (mode === "create") {
        await articlesApi.create(payload)
        toast({ title: t("articles.createdSuccess") })
      } else if (initial) {
        await articlesApi.update(initial.id, payload)
        toast({ title: t("articles.updatedSuccess") })
      }

      router.push("/instructor/articles")
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("articles.errorTitle"),
        description: getErrorMessage(error),
      })
    } finally {
      setSubmitting(null)
    }
  }

  if (fullPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2
            className="text-lg text-ink"
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
          >
            {t("articles.preview")}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFullPreview(false)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            {t("articles.backToEditor")}
          </Button>
        </div>

        <article className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="h-56 w-full overflow-hidden bg-brand sm:h-72">
            {displayCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayCover}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Newspaper className="h-16 w-16 text-on-night opacity-80" />
              </div>
            )}
          </div>
          <div className="px-6 py-8 sm:px-10">
            <h1
              className="text-3xl text-ink sm:text-4xl"
              style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
            >
              {title || t("articles.untitled")}
            </h1>
            {description ? (
              <p className="mt-3 text-lg text-ink-2">{description}</p>
            ) : null}
            <div className="mt-8">
              {content.trim() ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="text-sm text-ink-3">
                  {t("articles.previewEmpty")}
                </p>
              )}
            </div>
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFullPreview(true)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          {t("articles.preview")}
        </Button>
      </div>

      {/* Cover image */}
      <div className="space-y-2">
        <Label>{t("articles.coverImage")}</Label>
        {displayCover ? (
          <div className="relative overflow-hidden rounded-xl border border-line-strong bg-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayCover}
              alt=""
              className="aspect-video w-full object-cover"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute end-2 top-2 gap-1"
              onClick={clearCover}
            >
              <X className="h-3 w-3" />
              {t("instructor.thumbnailRemove")}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-surface text-sm text-ink-3 transition-colors hover:border-brand hover:text-brand"
          >
            <ImagePlus className="h-6 w-6" />
            <span>{t("articles.uploadCover")}</span>
            <span className="text-xs">{t("instructor.thumbnailHint")}</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onPickCover}
        />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label>{t("articles.titleLabel")}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("articles.titleLabel")}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>{t("articles.descriptionLabel")}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("articles.descriptionLabel")}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>{t("articles.categoryLabel")}</Label>
        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder={t("articles.categoryLabel")}
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label>{t("articles.contentLabel")}</Label>
        <MarkdownEditor value={content} onChange={setContent} />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          disabled={submitting !== null}
          onClick={() => void submit(false)}
        >
          {submitting === "draft" && (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          )}
          {t("articles.saveDraft")}
        </Button>
        <Button
          type="button"
          disabled={submitting !== null}
          onClick={() => void submit(true)}
        >
          {submitting === "publish" && (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          )}
          {t("articles.publish")}
        </Button>
      </div>
    </div>
  )
}

export default ArticleEditorForm
