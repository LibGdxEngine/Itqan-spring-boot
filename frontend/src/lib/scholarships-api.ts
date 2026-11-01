import api from "@/lib/api-axios"
import type { Page, PageQuery } from "@/lib/admin-api"

// Scholarships (students asking for a free course) and donations to the scholarship fund.

export type ScholarshipStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN"
export type FundingSource = "FUND" | "ACADEMY"
export type DonationStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"

export interface MyScholarshipApplication {
  id: number
  courseId: number
  courseTitle: string
  status: ScholarshipStatus
  adminNote: string | null
  createdAt: string
  decidedAt: string | null
}

export interface ScholarshipApplyRequest {
  courseId: number
  reason: string
  circumstances?: string
  phone?: string
}

export interface DonationCheckoutRequest {
  amount: number
  donorEmail: string
  donorName?: string
  message?: string
}

export interface DonationCheckoutResponse {
  donationId: number
  sessionId: string
  checkoutUrl: string
}

export interface DonationStatusResponse {
  status: DonationStatus
  amount: number
  currency: string
}

export const scholarshipsApi = {
  apply: async (request: ScholarshipApplyRequest) =>
    (await api.post<MyScholarshipApplication>("/api/scholarships/applications", request)).data,
  mine: async () => (await api.get<MyScholarshipApplication[]>("/api/scholarships/applications/me")).data,
  withdraw: async (id: number) =>
    (await api.post<MyScholarshipApplication>(`/api/scholarships/applications/${id}/withdraw`)).data,
}

export const donationsApi = {
  checkout: async (request: DonationCheckoutRequest) =>
    (await api.post<DonationCheckoutResponse>("/api/donations/checkout", request)).data,
  status: async (reference: string) =>
    (await api.get<DonationStatusResponse>(`/api/donations/checkout/${encodeURIComponent(reference)}`)).data,
}

// ---------- Admin ----------

export interface AdminScholarshipRow {
  id: number
  studentId: number
  studentName: string
  studentEmail: string
  phone: string | null
  courseId: number
  courseTitle: string
  coursePrice: number | null
  reason: string
  circumstances: string | null
  status: ScholarshipStatus
  fundingSource: FundingSource | null
  fundAmount: number | null
  adminNote: string | null
  createdAt: string
  decidedAt: string | null
}

export interface AdminDonationRow {
  id: number
  donorName: string | null
  donorEmail: string | null
  message: string | null
  amount: number
  currency: string
  status: DonationStatus
  gateway: string
  method: string | null
  reference: string | null
  createdAt: string
  completedAt: string | null
}

export interface ScholarshipFundSummary {
  received: number
  used: number
  balance: number
  donationsCount: number
  pendingApplications: number
  approvedApplications: number
}

export interface ManualDonationRequest {
  amount: number
  currency: string
  method: string
  donorEmail?: string
  donorName?: string
  reference?: string
  message?: string
}

type Params = Record<string, string | number | undefined>

const clean = (params: Params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))

export const adminScholarshipsApi = {
  search: async (filters: { q?: string; status?: ScholarshipStatus | ""; courseId?: number | "" } & PageQuery) =>
    (await api.get<Page<AdminScholarshipRow>>("/api/admin/scholarships", { params: clean(filters as Params) })).data,
  approve: async (id: number, fundingSource: FundingSource, note?: string) =>
    (await api.post<AdminScholarshipRow>(`/api/admin/scholarships/${id}/approve`, { fundingSource, note })).data,
  reject: async (id: number, note?: string) =>
    (await api.post<AdminScholarshipRow>(`/api/admin/scholarships/${id}/reject`, { note })).data,
  fund: async () => (await api.get<ScholarshipFundSummary>("/api/admin/scholarships/fund")).data,
  donations: async (filters: { q?: string; status?: DonationStatus | ""; gateway?: string } & PageQuery) =>
    (await api.get<Page<AdminDonationRow>>("/api/admin/donations", { params: clean(filters as Params) })).data,
  recordDonation: async (request: ManualDonationRequest) =>
    (await api.post<AdminDonationRow>("/api/admin/donations/manual", request)).data,
}
