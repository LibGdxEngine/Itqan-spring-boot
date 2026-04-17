"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-context"
import { EnrollmentsService, EnrollmentResponse, StudentsService } from "@/lib/api"
import { EnrolledCourseCard } from "@/components/courses/EnrolledCourseCard"
import { Navbar } from "@/components/Navbar"
import { Loader2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { paymentsBillingApi, PaymentResponse } from "@/lib/payments-billing"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([])
  const [payments, setPayments] = useState<PaymentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false)
      return
    }

    const fetchEnrollments = async () => {
      try {
        setLoading(true)
        const student = await StudentsService.getProfile()
        if (!student.id) {
          setEnrollments([])
          return
        }
        const [enrollmentData, paymentData] = await Promise.all([
          EnrollmentsService.getStudentEnrollments(student.id),
          paymentsBillingApi.getMyPayments(),
        ])
        setEnrollments(enrollmentData)
        setPayments(paymentData)
      } catch (error) {
        console.error("Failed to load dashboard enrollments", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollments()
  }, [isAuthenticated, user])
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container max-w-7xl mx-auto px-4 pt-24 pb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {t("dashboard.title") || "My Dashboard"}
            </h1>
            <p className="text-slate-600 mt-2">
              {t("dashboard.welcome", { name: user?.firstName || "" }) || `Welcome back, ${user?.firstName}!`}
            </p>
          </div>
        </div>

        {enrollments.length > 0 ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-slate-900">My Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <EnrolledCourseCard key={enrollment.id} enrollment={enrollment} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {t("dashboard.noCourses") || "No courses yet"}
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {t("dashboard.noCoursesDesc") || "Start your learning journey by exploring our course catalog."}
            </p>
            <Button asChild>
              <Link href="/courses">
                {t("dashboard.browseCourses") || "Browse Courses"}
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Billing & Payments</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500">No payments yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{payment.courseTitle}</p>
                    <p className="text-slate-500">
                      {new Date(payment.createdAt).toLocaleDateString()} · {payment.currency}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {payment.amount.toFixed(2)} {payment.currency}
                    </p>
                    <p className="text-slate-500">{payment.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
