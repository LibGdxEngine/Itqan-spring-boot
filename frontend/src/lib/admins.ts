import api from "@/lib/api-axios"

export interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  enabled: boolean
  superAdmin: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAdminRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  enabled?: boolean
  superAdmin?: boolean
}

export interface UpdateAdminRequest {
  email: string
  firstName: string
  lastName: string
  password?: string
  enabled?: boolean
  superAdmin?: boolean
}

export const adminsApi = {
  async getAll(): Promise<AdminUser[]> {
    const response = await api.get<AdminUser[] | { content?: AdminUser[] }>("/api/admins")
    const data = response.data
    return Array.isArray(data) ? data : (data?.content ?? [])
  },

  async create(data: CreateAdminRequest): Promise<AdminUser> {
    const response = await api.post<AdminUser>("/api/admins", data)
    return response.data
  },

  async update(id: number, data: UpdateAdminRequest): Promise<AdminUser> {
    const response = await api.put<AdminUser>(`/api/admins/${id}`, data)
    return response.data
  },
}
