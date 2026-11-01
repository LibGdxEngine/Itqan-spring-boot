import api from "@/lib/api-axios"

export interface InstructorUser {
  id: number
  email: string
  firstName: string
  lastName: string
  enabled: boolean
  photoUrl: string | null
  titleAr: string | null
  titleEn: string | null
  bioAr: string | null
  bioEn: string | null
  createdAt: string
  updatedAt: string
}

export interface InstructorProfileFields {
  photoUrl?: string | null
  titleAr?: string | null
  titleEn?: string | null
  bioAr?: string | null
  bioEn?: string | null
}

export interface CreateInstructorRequest extends InstructorProfileFields {
  email: string
  password: string
  firstName: string
  lastName: string
  enabled?: boolean
}

export interface UpdateInstructorRequest extends InstructorProfileFields {
  email: string
  firstName: string
  lastName: string
  password?: string
  enabled?: boolean
}

export const instructorsApi = {
  async getAll(): Promise<InstructorUser[]> {
    const response = await api.get<InstructorUser[] | { content?: InstructorUser[] }>("/api/instructors")
    const data = response.data
    return Array.isArray(data) ? data : (data?.content ?? [])
  },

  async create(data: CreateInstructorRequest): Promise<InstructorUser> {
    const response = await api.post<InstructorUser>("/api/instructors", data)
    return response.data
  },

  async update(id: number, data: UpdateInstructorRequest): Promise<InstructorUser> {
    const response = await api.put<InstructorUser>(`/api/instructors/${id}`, data)
    return response.data
  },

  async deactivate(id: number): Promise<InstructorUser> {
    const response = await api.patch<InstructorUser>(`/api/instructors/${id}/deactivate`)
    return response.data
  },

  async uploadPhoto(file: File): Promise<{ url: string; objectKey: string }> {
    const form = new FormData()
    form.append("file", file)
    const response = await api.post<{ url: string; objectKey: string }>("/api/instructors/photo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },
}
