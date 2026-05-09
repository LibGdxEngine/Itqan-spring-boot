import api from "@/lib/api-axios"

export interface AnalyticsOverview {
  totalStudents: number
  totalCourses: number
  totalEnrollments: number
  revenueByCurrency: Record<string, number>
  activeUsers: number
  newUsersThisMonth: number
}

export interface RevenueDataPoint {
  date: string
  amount: number
  currency: string
}

export interface RevenueTrend {
  granularity: string
  dataPoints: RevenueDataPoint[]
}

export interface CoursePopularity {
  courseId: number
  title: string
  enrollmentCount: number
  completionRate: number
  averageProgress: number
}

export const analyticsApi = {
  async getOverview(): Promise<AnalyticsOverview> {
    const response = await api.get<AnalyticsOverview>("/api/admin/analytics/overview")
    return response.data
  },

  async getRevenueTrend(days = 30): Promise<RevenueTrend> {
    const response = await api.get<RevenueTrend>("/api/admin/analytics/revenue-trend", {
      params: { days },
    })
    return response.data
  },

  async getTopCourses(limit = 5): Promise<CoursePopularity[]> {
    const response = await api.get<CoursePopularity[]>("/api/admin/analytics/top-courses", {
      params: { limit },
    })
    return response.data
  },
}
