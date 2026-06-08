import api from "@/lib/api-axios"

export interface Article {
  id: number
  title: string
  slug: string
  description: string | null
  content: string
  coverImageUrl: string | null
  readingTimeMinutes: number
  published: boolean
  authorUserId: number | null
  authorName: string | null
  category: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface ArticleSummary {
  id: number
  title: string
  slug: string
  description: string | null
  coverImageUrl: string | null
  readingTimeMinutes: number
  authorName: string | null
  category: string | null
  published: boolean
  publishedAt: string | null
}

export interface ArticleRequest {
  title: string
  description?: string
  content: string
  coverImageUrl?: string
  category?: string
  published: boolean
}

export interface ArticleImageUpload {
  url: string
  objectKey: string
}

interface ArticlePage {
  content: ArticleSummary[]
  totalElements?: number
  totalPages?: number
  number?: number
  size?: number
}

export const ALLOWED_ARTICLE_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]
export const MAX_ARTICLE_IMAGE_BYTES = 5 * 1024 * 1024

export type ArticleImageValidation =
  | { ok: true }
  | { ok: false; reason: "type" | "size" }

export function validateArticleImage(file: File): ArticleImageValidation {
  if (!ALLOWED_ARTICLE_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return { ok: false, reason: "type" }
  }
  if (file.size > MAX_ARTICLE_IMAGE_BYTES) {
    return { ok: false, reason: "size" }
  }
  return { ok: true }
}

export const articlesApi = {
  async list(page = 0, size = 20): Promise<ArticlePage> {
    const response = await api.get<ArticlePage>("/api/articles", {
      params: { page, size },
    })
    return response.data
  },

  async search(query: string): Promise<ArticleSummary[]> {
    const response = await api.get<ArticleSummary[]>("/api/articles/search", {
      params: { query },
    })
    return response.data
  },

  async getBySlug(slug: string): Promise<Article> {
    const response = await api.get<Article>(`/api/articles/${slug}`)
    return response.data
  },

  async getById(id: number): Promise<Article> {
    const response = await api.get<Article>(`/api/articles/id/${id}`)
    return response.data
  },

  async listMine(): Promise<Article[]> {
    const response = await api.get<Article[]>("/api/articles/mine")
    return response.data
  },

  async create(req: ArticleRequest): Promise<Article> {
    const response = await api.post<Article>("/api/articles", req)
    return response.data
  },

  async update(id: number, req: ArticleRequest): Promise<Article> {
    const response = await api.put<Article>(`/api/articles/${id}`, req)
    return response.data
  },

  async setPublished(id: number, published: boolean): Promise<Article> {
    const response = await api.patch<Article>(
      `/api/articles/${id}/publish`,
      null,
      { params: { published } },
    )
    return response.data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/articles/${id}`)
  },

  async uploadCoverImage(file: File): Promise<ArticleImageUpload> {
    const form = new FormData()
    form.append("file", file)
    const response = await api.post<ArticleImageUpload>(
      "/api/articles/cover-image",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    )
    return response.data
  },
}
