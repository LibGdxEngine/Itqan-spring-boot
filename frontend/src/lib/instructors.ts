import api from "@/lib/api-axios"

export interface InstructorUser {
  id: number
  email: string
  firstName: string
  lastName: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateInstructorRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  enabled?: boolean
}

export interface UpdateInstructorRequest {
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
}
