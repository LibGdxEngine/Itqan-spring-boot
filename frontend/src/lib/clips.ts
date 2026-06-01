import axios from "@/lib/api-axios"

export type ClipType = "VIDEO" | "AUDIO"

export interface ClipResponse {
  id: number
  title: string
  type: ClipType
  fileUrl: string
  mimeType: string | null
  sizeBytes: number | null
  createdAt: string
}

export interface ClipsPage {
  content: ClipResponse[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const clipsApi = {
  async list(params: {
    search?: string
    type?: ClipType | ""
    page?: number
    size?: number
  }): Promise<ClipsPage> {
    const { data } = await axios.get<ClipsPage>("/api/clips", { params })
    return data
  },

  async bulkUpload(files: File[]): Promise<ClipResponse[]> {
    const form = new FormData()
    for (const file of files) {
      form.append("files", file)
    }
    const { data } = await axios.post<ClipResponse[]>("/api/admin/clips/bulk-upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return data
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`/api/admin/clips/${id}`)
  },
}
