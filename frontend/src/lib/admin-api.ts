import api from "@/lib/api-axios"

// Typed client for the /api/admin/** endpoints used by the admin panel.

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface PageQuery {
  page?: number
  size?: number
  sort?: string
}

type Params = Record<string, string | number | boolean | undefined | null>

function clean(params: Params): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") out[key] = value
  }
  return out
}

async function getPage<T>(url: string, params: Params): Promise<Page<T>> {
  const { data } = await api.get<Page<T>>(url, { params: clean(params) })
  return data
}

async function getList<T>(url: string, params: Params = {}): Promise<T[]> {
  const { data } = await api.get<T[]>(url, { params: clean(params) })
  return data
}

// ---------- Users ----------

export type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN"

export interface AdminUserRow {
  id: number
  email: string
  firstName: string
  lastName: string
  role: UserRole
  enabled: boolean
  superAdmin: boolean
  authProvider: "LOCAL" | "GOOGLE"
  createdAt: string
  lastLoginAt: string | null
}

export interface UserFilters {
  q?: string
  role?: UserRole | ""
  enabled?: "true" | "false" | ""
}

export const adminUsersApi = {
  search: (filters: UserFilters & PageQuery) => getPage<AdminUserRow>("/api/admin/users", { ...filters }),
  export: (filters: UserFilters) => getList<AdminUserRow>("/api/admin/users/export", { ...filters }),
  setEnabled: async (id: number, enabled: boolean) =>
    (await api.patch<AdminUserRow>(`/api/admin/users/${id}/status`, { enabled })).data,
}

// ---------- Courses ----------

export interface AdminCourseRow {
  id: number
  title: string
  instructor: string
  ownerUserId: number | null
  price: number
  level: string
  category: string
  thumbnailUrl: string | null
  active: boolean
  moduleCount: number
  lessonCount: number
  enrollmentCount: number
  createdAt: string
  updatedAt: string
}

export interface CourseOption {
  id: number
  title: string
  price: number
  active: boolean
}

export interface CourseFilters {
  q?: string
  active?: "true" | "false" | ""
}

export const adminCoursesApi = {
  search: (filters: CourseFilters & PageQuery) => getPage<AdminCourseRow>("/api/admin/courses", { ...filters }),
  options: () => getList<CourseOption>("/api/admin/courses/options"),
  setActive: async (id: number, active: boolean) =>
    (await api.patch<AdminCourseRow>(`/api/admin/courses/${id}/status`, { active })).data,
  duplicate: async (id: number) => (await api.post<{ id: number }>(`/api/admin/courses/${id}/duplicate`)).data,
  remove: async (id: number) => {
    await api.delete(`/api/courses/${id}`)
  },
}

// ---------- Enrollments ----------

export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "DROPPED"

export interface AdminEnrollmentRow {
  id: number
  studentId: number
  studentName: string
  studentEmail: string
  courseId: number
  courseTitle: string
  status: EnrollmentStatus
  progress: number
  enrolledAt: string
  lastAccessedAt: string | null
}

export interface EnrollmentFilters {
  q?: string
  courseId?: number | ""
  status?: EnrollmentStatus | ""
}

export const adminEnrollmentsApi = {
  search: (filters: EnrollmentFilters & PageQuery) =>
    getPage<AdminEnrollmentRow>("/api/admin/enrollments", { ...filters }),
  export: (filters: EnrollmentFilters) => getList<AdminEnrollmentRow>("/api/admin/enrollments/export", { ...filters }),
  grant: async (studentEmail: string, courseId: number) =>
    (await api.post<AdminEnrollmentRow>("/api/admin/enrollments", { studentEmail, courseId })).data,
  setStatus: async (id: number, status: EnrollmentStatus) =>
    (await api.patch<AdminEnrollmentRow>(`/api/admin/enrollments/${id}/status`, { status })).data,
  remove: async (id: number) => {
    await api.delete(`/api/admin/enrollments/${id}`)
  },
}

// ---------- Payments ----------

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED"

export interface AdminPaymentRow {
  id: number
  studentId: number
  studentName: string
  studentEmail: string
  courseId: number
  courseTitle: string
  amount: number
  discountAmount: number | null
  currency: string
  status: PaymentStatus
  gateway: string | null
  method: string | null
  transactionId: string | null
  couponCode: string | null
  notes: string | null
  createdAt: string
  completedAt: string | null
}

export interface PaymentFilters {
  q?: string
  status?: PaymentStatus | ""
  courseId?: number | ""
  gateway?: string
}

export interface ManualPaymentRequest {
  studentEmail: string
  courseId: number
  amount: number
  currency: string
  method: string
  reference?: string
  notes?: string
}

export const adminPaymentsApi = {
  search: (filters: PaymentFilters & PageQuery) => getPage<AdminPaymentRow>("/api/admin/payments", { ...filters }),
  export: (filters: PaymentFilters) => getList<AdminPaymentRow>("/api/admin/payments/export", { ...filters }),
  recordManual: async (request: ManualPaymentRequest) =>
    (await api.post<AdminPaymentRow>("/api/admin/payments/manual", request)).data,
  refund: async (id: number, reason?: string) =>
    (await api.post<AdminPaymentRow>(`/api/admin/payments/${id}/refund`, { reason })).data,
}

// ---------- Enrollment codes ----------

export interface EnrollmentCodeRow {
  id: number
  code: string
  courseId: number
  courseTitle: string
  usageLimit: number
  usedCount: number
  expiresAt: string | null
  active: boolean
  usable: boolean
  createdAt: string
}

export const enrollmentCodesApi = {
  list: (filters: { courseId?: number | "" } & PageQuery) =>
    getPage<EnrollmentCodeRow>("/api/admin/enrollment-codes", { ...filters }),
  generate: async (request: { courseId: number; quantity: number; usageLimit: number; expiresAt?: string }) =>
    (await api.post<EnrollmentCodeRow[]>("/api/admin/enrollment-codes", request)).data,
  deactivate: async (id: number) => {
    await api.patch(`/api/admin/enrollment-codes/${id}/deactivate`)
  },
}

// ---------- Audit log ----------

export interface AuditLogRow {
  id: number
  actorUserId: number | null
  actorEmail: string | null
  action: string
  resourceType: string | null
  resourceId: string | null
  ipAddress: string | null
  metadata: Record<string, unknown> | null
  status: "SUCCESS" | "FAILURE"
  createdAt: string
}

export interface AuditFilters {
  q?: string
  resourceType?: string
  status?: "SUCCESS" | "FAILURE" | ""
  from?: string
  to?: string
}

export const auditLogApi = {
  search: (filters: AuditFilters & PageQuery) => getPage<AuditLogRow>("/api/audit-logs", { ...filters }),
}

// ---------- Settings ----------

export type SiteSettings = Record<string, string>

export const settingsApi = {
  get: async () => (await api.get<SiteSettings>("/api/settings")).data,
  update: async (changes: SiteSettings) => (await api.put<SiteSettings>("/api/admin/settings", changes)).data,
}

// ---------- Analytics ----------

export type Granularity = "DAILY" | "WEEKLY" | "MONTHLY"

export interface DateRange {
  from: string
  to: string
}

export interface AnalyticsSummary {
  range: DateRange
  previousRange: DateRange
  revenueByCurrency: Record<string, number>
  previousRevenueByCurrency: Record<string, number>
  newUsers: number
  previousNewUsers: number
  newEnrollments: number
  previousNewEnrollments: number
  activeUsers30d: number
  totalStudents: number
  activeCourses: number
  totalEnrollments: number
}

export interface SeriesPoint {
  date: string
  value: number
}

export interface Series {
  key: string
  points: SeriesPoint[]
}

export interface CourseRevenue {
  courseId: number
  courseTitle: string
  currency: string
  revenue: number
  payments: number
}

export interface UserBreakdown {
  totalUsers: number
  newSignups: number
  activeUsers: number
  usersByRole: Record<string, number>
}

export interface CoursePopularity {
  courseId: number
  title: string
  enrollmentCount: number
  completionRate: number
  averageProgress: number
}

export const reportsApi = {
  summary: (range: DateRange) => api.get<AnalyticsSummary>("/api/admin/analytics/summary", { params: range }).then((r) => r.data),
  revenueSeries: (range: DateRange, granularity: Granularity) =>
    api.get<Series[]>("/api/admin/analytics/revenue-series", { params: { ...range, granularity } }).then((r) => r.data),
  enrollmentSeries: (range: DateRange, granularity: Granularity) =>
    api.get<Series>("/api/admin/analytics/enrollment-series", { params: { ...range, granularity } }).then((r) => r.data),
  revenueByCourse: (range: DateRange) =>
    api.get<CourseRevenue[]>("/api/admin/analytics/revenue-by-course", { params: range }).then((r) => r.data),
  users: (range: DateRange) => api.get<UserBreakdown>("/api/admin/analytics/users", { params: range }).then((r) => r.data),
  topCourses: (limit = 5) =>
    api.get<CoursePopularity[]>("/api/admin/analytics/top-courses", { params: { limit } }).then((r) => r.data),
  refresh: () => api.post("/api/admin/analytics/refresh"),
}

// ---------- Helpers ----------

/** ISO yyyy-mm-dd for a date in local time. */
export function isoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Builds a CSV file from rows and triggers a browser download. */
export function downloadCsv<T>(filename: string, rows: T[], columns: { header: string; value: (row: T) => unknown }[]) {
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [
    columns.map((c) => escape(c.header)).join(","),
    ...rows.map((row) => columns.map((c) => escape(c.value(row))).join(",")),
  ]
  // BOM so Excel opens Arabic text as UTF-8
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
