import api from "@/lib/api-axios"
import type { Page } from "@/lib/admin-api"

// Typed client for the student-facing endpoints: catalog, reviews, wishlist, learning state,
// certificates and enrollment codes.

export interface CatalogCourse {
  id: number
  title: string
  description?: string | null
  instructor: string
  ownerUserId?: number | null
  price: number
  level: string
  category: string
  thumbnailUrl?: string | null
  durationHours: number
  lessonCount: number
  studentCount: number
  rating: number
  reviewCount: number
  tags: string[]
  createdAt: string
}

export type CatalogSort = "newest" | "popular" | "rating" | "price_asc" | "price_desc"

export interface CatalogQuery {
  q?: string
  category?: string
  level?: string
  price?: "" | "free" | "paid"
  minRating?: number
  sort?: CatalogSort
  page?: number
  size?: number
}

function clean<T extends object>(params: T) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""))
}

export const catalogApi = {
  search: async (query: CatalogQuery) =>
    (await api.get<Page<CatalogCourse>>("/api/catalog", { params: clean(query) })).data,
  course: async (id: number) => (await api.get<CatalogCourse>(`/api/catalog/courses/${id}`)).data,
}

// ---------- Reviews ----------

export interface Review {
  id: number
  courseId: number
  authorName: string
  rating: number
  comment?: string | null
  createdAt: string
  updatedAt: string
}

export interface ReviewSummary {
  courseId: number
  average: number
  count: number
  distribution: Record<string, number>
}

export const reviewsApi = {
  list: async (courseId: number, page = 0, size = 5) =>
    (await api.get<Page<Review>>(`/api/courses/${courseId}/reviews`, { params: { page, size } })).data,
  summary: async (courseId: number) =>
    (await api.get<ReviewSummary>(`/api/courses/${courseId}/reviews/summary`)).data,
  mine: async (courseId: number) => {
    const response = await api.get<Review | "">(`/api/courses/${courseId}/reviews/mine`)
    return response.status === 204 || !response.data ? null : (response.data as Review)
  },
  save: async (courseId: number, rating: number, comment: string) =>
    (await api.put<Review>(`/api/courses/${courseId}/reviews/mine`, { rating, comment })).data,
  remove: async (courseId: number) => {
    await api.delete(`/api/courses/${courseId}/reviews/mine`)
  },
}

// ---------- Wishlist ----------

export const wishlistApi = {
  list: async () => (await api.get<CatalogCourse[]>("/api/wishlist")).data,
  ids: async () => (await api.get<number[]>("/api/wishlist/ids")).data,
  add: async (courseId: number) => {
    await api.put(`/api/wishlist/${courseId}`)
  },
  remove: async (courseId: number) => {
    await api.delete(`/api/wishlist/${courseId}`)
  },
}

// ---------- Learning ----------

export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "DROPPED"

export interface CourseLearningState {
  courseId: number
  enrolled: boolean
  progress: number
  lastLessonId: number | null
  completedLessonIds: number[]
  positions: Record<string, number>
  certificateCode: string | null
}

export interface MyCourse {
  courseId: number
  title: string
  thumbnailUrl?: string | null
  instructor: string
  status: EnrollmentStatus
  progress: number
  totalLessons: number
  completedLessons: number
  lastLessonId: number | null
  lastLessonTitle: string | null
  enrolledAt: string
  lastAccessedAt: string | null
  certificateCode: string | null
}

export interface LearningDashboard {
  stats: { inProgress: number; completed: number; certificates: number; lessonsThisWeek: number; streakDays: number }
  continueLearning: MyCourse | null
  courses: MyCourse[]
}

export const learningApi = {
  dashboard: async () => (await api.get<LearningDashboard>("/api/learning/me")).data,
  courseState: async (courseId: number) =>
    (await api.get<CourseLearningState>(`/api/learning/courses/${courseId}`)).data,
  /** Records that a lesson was opened; pass a position to save the video resume point. */
  activity: async (lessonId: number, positionSeconds?: number) => {
    await api.put(`/api/learning/lessons/${lessonId}/activity`, positionSeconds === undefined ? {} : { positionSeconds })
  },
}

// ---------- Certificates ----------

export interface Certificate {
  code: string
  courseId: number
  courseTitle: string
  studentName: string
  instructorName?: string | null
  issuedAt: string
}

export interface CertificateEligibility {
  eligible: boolean
  lessonsRemaining: number
  quizzesRemaining: number
}

export const certificatesApi = {
  mine: async () => (await api.get<Certificate[]>("/api/certificates/me")).data,
  eligibility: async (courseId: number) =>
    (await api.get<CertificateEligibility>(`/api/certificates/courses/${courseId}/eligibility`)).data,
  claim: async (courseId: number) => (await api.post<Certificate>(`/api/certificates/courses/${courseId}`)).data,
  verify: async (code: string) =>
    (await api.get<Certificate>(`/api/certificates/verify/${encodeURIComponent(code)}`)).data,
}

// ---------- Enrollment codes ----------

export const enrollmentCodesApi = {
  redeem: async (code: string) =>
    (await api.post<{ courseId?: number; id?: number }>("/api/enrollment-codes/redeem", { code })).data,
}
