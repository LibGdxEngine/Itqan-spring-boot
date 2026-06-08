import api from "@/lib/api-axios"

export interface LandingHero {
  videoUrl: string | null
  titleAr: string | null
  titleEn: string | null
  teacherNameAr: string | null
  teacherNameEn: string | null
  durationLabelAr: string | null
  durationLabelEn: string | null
}

export interface LandingStats {
  courses: number
  teachers: number
  students: number
  specializations: number
}

export interface LandingSpecialization {
  id: number
  nameAr: string
  nameEn: string
  slug: string
  icon: string | null
  displayOrder: number
  active: boolean
}

export interface LandingCourse {
  id: number
  title: string
  instructor: string
  category: string | null
  durationHours: number | null
  price: number | null
  thumbnailUrl: string | null
  level: string | null
}

export interface LandingTeacher {
  id: number
  name: string
  specialty: string | null
  coursesCount: number
  studentsCount: number
}

export interface LandingArticle {
  id: number
  title: string
  slug: string
  description: string | null
  coverImageUrl: string | null
  readingTimeMinutes: number
  authorName: string | null
  category: string | null
  publishedAt: string | null
}

export interface LandingPageData {
  hero: LandingHero
  stats: LandingStats
  specializations: LandingSpecialization[]
  featuredCourses: LandingCourse[]
  featuredInstructors: LandingTeacher[]
  featuredArticles: LandingArticle[]
}

export interface LandingPageUpdateRequest {
  heroVideoUrl?: string | null
  heroVideoTitleAr?: string | null
  heroVideoTitleEn?: string | null
  heroTeacherNameAr?: string | null
  heroTeacherNameEn?: string | null
  heroDurationLabelAr?: string | null
  heroDurationLabelEn?: string | null
  featuredCourseIds?: number[]
  featuredInstructorIds?: number[]
  featuredArticleIds?: number[]
}

export interface SpecializationRequest {
  nameAr: string
  nameEn: string
  slug: string
  icon?: string | null
  displayOrder?: number
  active?: boolean
}

export const landingPageApi = {
  async getPublic(): Promise<LandingPageData> {
    const response = await api.get<LandingPageData>("/api/landing-page")
    return response.data
  },

  async update(payload: LandingPageUpdateRequest): Promise<LandingPageData> {
    const response = await api.patch<LandingPageData>("/api/admin/landing-page", payload)
    return response.data
  },

  async uploadHeroVideo(file: File): Promise<{ url: string; objectKey: string }> {
    const form = new FormData()
    form.append("file", file)
    const response = await api.post<{ url: string; objectKey: string }>(
      "/api/admin/landing-page/hero-video",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    )
    return response.data
  },
}

export const specializationsApi = {
  async getPublic(): Promise<LandingSpecialization[]> {
    const response = await api.get<LandingSpecialization[]>("/api/specializations")
    return response.data
  },

  async getAll(): Promise<LandingSpecialization[]> {
    const response = await api.get<LandingSpecialization[]>("/api/admin/specializations")
    return response.data
  },

  async create(payload: SpecializationRequest): Promise<LandingSpecialization> {
    const response = await api.post<LandingSpecialization>("/api/admin/specializations", payload)
    return response.data
  },

  async update(id: number, payload: SpecializationRequest): Promise<LandingSpecialization> {
    const response = await api.put<LandingSpecialization>(`/api/admin/specializations/${id}`, payload)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/admin/specializations/${id}`)
  },
}

export async function fetchLandingPageServerSide(): Promise<LandingPageData | null> {
  const baseUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080"
  try {
    const res = await fetch(`${baseUrl}/api/landing-page`, {
      cache: "no-store",
    })
    if (!res.ok) {
      console.error(`fetchLandingPageServerSide: ${res.status} from ${baseUrl}/api/landing-page`)
      return null
    }
    return (await res.json()) as LandingPageData
  } catch (err) {
    console.error(`fetchLandingPageServerSide failed (${baseUrl}/api/landing-page):`, err)
    return null
  }
}
