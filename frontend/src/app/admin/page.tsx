"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2, ShieldCheck, Users, BookOpen, CheckCircle2, UserCog, Crown } from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { CourseResponse, CoursesService, OpenAPI, StudentResponse, StudentsService } from "@/lib/api"
import { AdminUser, adminsApi } from "@/lib/admins"

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface ListErrors {
  students?: string
  courses?: string
  admins?: string
}

interface CreateAdminForm {
  firstName: string
  lastName: string
  email: string
  password: string
  enabled: boolean
  superAdmin: boolean
}

interface EditAdminForm {
  firstName: string
  lastName: string
  email: string
  password: string
  enabled: boolean
  superAdmin: boolean
}

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString()
}

function formatPrice(value?: number) {
  if (typeof value !== "number") return "-"
  return value.toFixed(2)
}

function sortAdmins(items: AdminUser[]) {
  return [...items].sort((a, b) => {
    if (a.superAdmin !== b.superAdmin) return a.superAdmin ? -1 : 1
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

const defaultCreateForm: CreateAdminForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  enabled: true,
  superAdmin: false,
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations()
  const { toast } = useToast()

  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [students, setStudents] = useState<StudentResponse[]>([])
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<ListErrors>({})
  const [deactivatingStudentIds, setDeactivatingStudentIds] = useState<Set<number>>(new Set())
  const [deactivatingCourseIds, setDeactivatingCourseIds] = useState<Set<number>>(new Set())
  const [createForm, setCreateForm] = useState<CreateAdminForm>(defaultCreateForm)
  const [creatingAdmin, setCreatingAdmin] = useState(false)
  const [editingAdminId, setEditingAdminId] = useState<number | null>(null)
  const [editingForm, setEditingForm] = useState<EditAdminForm | null>(null)
  const [savingAdmin, setSavingAdmin] = useState(false)

  const fetchAdminData = useCallback(async () => {
    setLoading(true)
    setErrors({})

    const [adminsResult, studentsResult, coursesResult] = await Promise.allSettled([
      adminsApi.getAll(),
      StudentsService.getAllStudents(),
      CoursesService.getMyCourses(),
    ])

    const nextErrors: ListErrors = {}

    if (adminsResult.status === "fulfilled") {
      setAdmins(sortAdmins(adminsResult.value))
    } else {
      nextErrors.admins = getErrorMessage(adminsResult.reason)
    }

    if (studentsResult.status === "fulfilled") {
      setStudents(studentsResult.value)
    } else {
      nextErrors.students = getErrorMessage(studentsResult.reason)
    }

    if (coursesResult.status === "fulfilled") {
      setCourses(coursesResult.value)
    } else {
      nextErrors.courses = getErrorMessage(coursesResult.reason)
    }

    setErrors(nextErrors)
    setLoading(false)
  }, [])

  const currentAdmin = useMemo(() => {
    if (!user?.email) return null
    const normalizedEmail = user.email.toLowerCase()
    return admins.find((admin) => admin.email.toLowerCase() === normalizedEmail) || null
  }, [admins, user?.email])

  const canManageAdmins = useMemo(
    () => Boolean(user?.superAdmin) || Boolean(currentAdmin?.superAdmin),
    [currentAdmin?.superAdmin, user?.superAdmin]
  )

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    const timer = window.setTimeout(() => {
      void fetchAdminData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [authLoading, fetchAdminData, isAuthenticated, router, user?.role])

  const stats = useMemo(() => {
    const activeStudents = students.filter((student) => student.active).length
    const activeCourses = courses.filter((course) => course.active).length

    return {
      totalAdmins: admins.length,
      superAdmins: admins.filter((admin) => admin.superAdmin).length,
      totalStudents: students.length,
      activeStudents,
      totalCourses: courses.length,
      activeCourses,
    }
  }, [admins, students, courses])

  const deactivateStudent = async (student: StudentResponse) => {
    const studentId = student.id
    if (!studentId || !student.active) return

    setDeactivatingStudentIds((prev) => new Set(prev).add(studentId))
    try {
      await StudentsService.deactivateStudent(studentId)
      setStudents((prev) => prev.map((item) => (item.id === studentId ? { ...item, active: false } : item)))
      toast({
        title: t("admin.actions.studentDeactivated"),
      })
    } catch (error) {
      toast({
        title: t("admin.states.failed"),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setDeactivatingStudentIds((prev) => {
        const next = new Set(prev)
        next.delete(studentId)
        return next
      })
    }
  }

  const deactivateCourse = async (course: CourseResponse) => {
    const courseId = course.id
    if (!courseId || !course.active) return

    setDeactivatingCourseIds((prev) => new Set(prev).add(courseId))
    try {
      await CoursesService.deactivateCourse(courseId)
      setCourses((prev) => prev.map((item) => (item.id === courseId ? { ...item, active: false } : item)))
      toast({
        title: t("admin.actions.courseDeactivated"),
      })
    } catch (error) {
      toast({
        title: t("admin.states.failed"),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setDeactivatingCourseIds((prev) => {
        const next = new Set(prev)
        next.delete(courseId)
        return next
      })
    }
  }

  const createAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManageAdmins) return

    setCreatingAdmin(true)
    try {
      const createdAdmin = await adminsApi.create({
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        enabled: createForm.enabled,
        superAdmin: createForm.superAdmin,
      })

      setAdmins((prev) => sortAdmins([...prev, createdAdmin]))
      setCreateForm(defaultCreateForm)
      toast({ title: t("admin.actions.adminCreated") })
    } catch (error) {
      toast({
        title: t("admin.states.failed"),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setCreatingAdmin(false)
    }
  }

  const startEditingAdmin = (admin: AdminUser) => {
    setEditingAdminId(admin.id)
    setEditingForm({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      password: "",
      enabled: admin.enabled,
      superAdmin: admin.superAdmin,
    })
  }

  const cancelEditingAdmin = () => {
    setEditingAdminId(null)
    setEditingForm(null)
  }

  const saveAdminChanges = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManageAdmins || !editingForm || editingAdminId === null) return

    setSavingAdmin(true)
    try {
      const updatedAdmin = await adminsApi.update(editingAdminId, {
        firstName: editingForm.firstName.trim(),
        lastName: editingForm.lastName.trim(),
        email: editingForm.email.trim(),
        password: editingForm.password || undefined,
        enabled: editingForm.enabled,
        superAdmin: editingForm.superAdmin,
      })

      setAdmins((prev) => sortAdmins(prev.map((admin) => (admin.id === updatedAdmin.id ? updatedAdmin : admin))))
      cancelEditingAdmin()
      toast({ title: t("admin.actions.adminUpdated") })
    } catch (error) {
      toast({
        title: t("admin.states.failed"),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setSavingAdmin(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f5f4ed]">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#c96442]" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#f5f4ed]">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#c96442]" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      <Navbar />
    <div className="container mx-auto max-w-7xl px-4 pt-24 pb-10">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-[#141413]">
          <ShieldCheck className="h-8 w-8 text-[#c96442]" />
          {t("admin.dashboard")}
        </h1>
        <p className="mt-2 text-[#5e5d59]">{t("admin.welcome", { name: user.firstName })}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#f0eee6] bg-[#faf9f5] p-4">
          <p className="text-sm text-[#87867f]">{t("admin.stats.totalAdmins")}</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#141413]">
            <UserCog className="h-5 w-5 text-[#87867f]" />
            {stats.totalAdmins}
          </p>
        </div>
        <div className="rounded-xl border border-[#f0eee6] bg-[#faf9f5] p-4">
          <p className="text-sm text-[#87867f]">{t("admin.stats.superAdmins")}</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#141413]">
            <Crown className="h-5 w-5 text-[#c96442]" />
            {stats.superAdmins}
          </p>
        </div>
        <div className="rounded-xl border border-[#f0eee6] bg-[#faf9f5] p-4">
          <p className="text-sm text-[#87867f]">{t("admin.stats.totalStudents")}</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#141413]">
            <Users className="h-5 w-5 text-[#87867f]" />
            {stats.totalStudents}
          </p>
        </div>
        <div className="rounded-xl border border-[#f0eee6] bg-[#faf9f5] p-4">
          <p className="text-sm text-[#87867f]">{t("admin.stats.activeStudents")}</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#141413]">
            <CheckCircle2 className="h-5 w-5 text-[#c96442]" />
            {stats.activeStudents}
          </p>
        </div>
        <div className="rounded-xl border border-[#f0eee6] bg-[#faf9f5] p-4">
          <p className="text-sm text-[#87867f]">{t("admin.stats.totalCourses")}</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#141413]">
            <BookOpen className="h-5 w-5 text-[#87867f]" />
            {stats.totalCourses}
          </p>
        </div>
        <div className="rounded-xl border border-[#f0eee6] bg-[#faf9f5] p-4">
          <p className="text-sm text-[#87867f]">{t("admin.stats.activeCourses")}</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#141413]">
            <CheckCircle2 className="h-5 w-5 text-[#c96442]" />
            {stats.activeCourses}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-xl border border-[#f0eee6] bg-[#faf9f5]">
        <div className="flex items-center justify-between border-b border-[#f0eee6] px-4 py-3">
          <h2 className="text-lg font-semibold text-[#141413]">{t("admin.admins.title")}</h2>
          <span className="text-sm text-[#87867f]">{admins.length}</span>
        </div>

        {errors.admins && (
          <div className="flex flex-col gap-3 px-4 py-4 text-sm text-[#b53333] md:flex-row md:items-center md:justify-between">
            <p>{errors.admins}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchAdminData()}>
              {t("admin.actions.retry")}
            </Button>
          </div>
        )}

        {!errors.admins && !canManageAdmins && (
          <div className="mx-4 mt-4 rounded-lg border border-[#e8e6dc] bg-[#f0eee6] px-4 py-3 text-sm text-[#4d4c48]">
            {t("admin.admins.permissionsHint")}
          </div>
        )}

        {!errors.admins && canManageAdmins && (
          <div className="border-b border-[#f0eee6] px-4 py-4">
            <h3 className="mb-3 text-sm font-semibold text-[#141413]">{t("admin.admins.createTitle")}</h3>
            <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={createAdmin}>
              <div className="space-y-1.5">
                <Label htmlFor="create-admin-first-name">{t("admin.admins.firstName")}</Label>
                <Input
                  id="create-admin-first-name"
                  value={createForm.firstName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-admin-last-name">{t("admin.admins.lastName")}</Label>
                <Input
                  id="create-admin-last-name"
                  value={createForm.lastName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-admin-email">{t("admin.admins.email")}</Label>
                <Input
                  id="create-admin-email"
                  type="email"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-admin-password">{t("admin.admins.password")}</Label>
                <Input
                  id="create-admin-password"
                  type="password"
                  value={createForm.password}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                  minLength={8}
                  required
                />
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-[#f0eee6] px-3 py-2 text-sm text-[#4d4c48]">
                <input
                  type="checkbox"
                  checked={createForm.enabled}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                {t("admin.admins.enabled")}
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[#f0eee6] px-3 py-2 text-sm text-[#4d4c48]">
                <input
                  type="checkbox"
                  checked={createForm.superAdmin}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, superAdmin: event.target.checked }))}
                />
                {t("admin.admins.superAdmin")}
              </label>
              <div className="md:col-span-2 xl:col-span-3">
                <Button type="submit" disabled={creatingAdmin}>
                  {creatingAdmin ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("admin.actions.creating")}
                    </span>
                  ) : (
                    t("admin.actions.createAdmin")
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {!errors.admins && canManageAdmins && editingForm && editingAdminId !== null && (
          <div className="border-b border-[#f0eee6] px-4 py-4">
            <h3 className="mb-3 text-sm font-semibold text-[#141413]">{t("admin.admins.editTitle")}</h3>
            <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={saveAdminChanges}>
              <div className="space-y-1.5">
                <Label htmlFor="edit-admin-first-name">{t("admin.admins.firstName")}</Label>
                <Input
                  id="edit-admin-first-name"
                  value={editingForm.firstName}
                  onChange={(event) => setEditingForm((prev) => (prev ? { ...prev, firstName: event.target.value } : prev))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-admin-last-name">{t("admin.admins.lastName")}</Label>
                <Input
                  id="edit-admin-last-name"
                  value={editingForm.lastName}
                  onChange={(event) => setEditingForm((prev) => (prev ? { ...prev, lastName: event.target.value } : prev))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-admin-email">{t("admin.admins.email")}</Label>
                <Input
                  id="edit-admin-email"
                  type="email"
                  value={editingForm.email}
                  onChange={(event) => setEditingForm((prev) => (prev ? { ...prev, email: event.target.value } : prev))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-admin-password">{t("admin.admins.newPassword")}</Label>
                <Input
                  id="edit-admin-password"
                  type="password"
                  value={editingForm.password}
                  onChange={(event) => setEditingForm((prev) => (prev ? { ...prev, password: event.target.value } : prev))}
                  minLength={8}
                  placeholder={t("admin.admins.passwordOptional")}
                />
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-[#f0eee6] px-3 py-2 text-sm text-[#4d4c48]">
                <input
                  type="checkbox"
                  checked={editingForm.enabled}
                  onChange={(event) =>
                    setEditingForm((prev) => (prev ? { ...prev, enabled: event.target.checked } : prev))
                  }
                />
                {t("admin.admins.enabled")}
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[#f0eee6] px-3 py-2 text-sm text-[#4d4c48]">
                <input
                  type="checkbox"
                  checked={editingForm.superAdmin}
                  onChange={(event) =>
                    setEditingForm((prev) => (prev ? { ...prev, superAdmin: event.target.checked } : prev))
                  }
                />
                {t("admin.admins.superAdmin")}
              </label>
              <div className="flex items-center gap-2 md:col-span-2 xl:col-span-3">
                <Button type="submit" disabled={savingAdmin}>
                  {savingAdmin ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("admin.actions.saving")}
                    </span>
                  ) : (
                    t("admin.actions.save")
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEditingAdmin} disabled={savingAdmin}>
                  {t("admin.actions.cancel")}
                </Button>
              </div>
            </form>
          </div>
        )}

        {!errors.admins && admins.length === 0 && <div className="px-4 py-6 text-sm text-[#87867f]">{t("admin.states.noAdmins")}</div>}

        {!errors.admins && admins.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f0eee6] text-left text-[#5e5d59]">
                <tr>
                  <th className="px-4 py-3">{t("admin.admins.name")}</th>
                  <th className="px-4 py-3">{t("admin.admins.email")}</th>
                  <th className="px-4 py-3">{t("admin.admins.createdAt")}</th>
                  <th className="px-4 py-3">{t("admin.admins.accountType")}</th>
                  <th className="px-4 py-3">{t("admin.admins.status")}</th>
                  {canManageAdmins && <th className="px-4 py-3 text-right">{t("admin.admins.actions")}</th>}
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isCurrentRowEditing = editingAdminId === admin.id
                  return (
                    <tr key={admin.id} className="border-t border-[#f0eee6]">
                      <td className="px-4 py-3 font-medium text-[#141413]">
                        {[admin.firstName, admin.lastName].filter(Boolean).join(" ").trim() || "-"}
                      </td>
                      <td className="px-4 py-3 text-[#4d4c48]">{admin.email}</td>
                      <td className="px-4 py-3 text-[#4d4c48]">{formatDate(admin.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            admin.superAdmin ? "bg-[#c96442] text-[#faf9f5]" : "bg-[#e8e6dc] text-[#4d4c48]"
                          }`}
                        >
                          {admin.superAdmin ? t("admin.admins.superAdmin") : t("admin.admins.admin")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            admin.enabled ? "bg-[#e8e6dc] text-[#4d4c48]" : "bg-[#f0eee6] text-[#87867f]"
                          }`}
                        >
                          {admin.enabled ? t("admin.status.active") : t("admin.status.inactive")}
                        </span>
                      </td>
                      {canManageAdmins && (
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditingAdmin(admin)}
                            disabled={savingAdmin}
                          >
                            {isCurrentRowEditing ? t("admin.actions.editing") : t("admin.actions.edit")}
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-8 rounded-xl border border-[#f0eee6] bg-[#faf9f5]">
        <div className="flex items-center justify-between border-b border-[#f0eee6] px-4 py-3">
          <h2 className="text-lg font-semibold text-[#141413]">{t("admin.students.title")}</h2>
          <span className="text-sm text-[#87867f]">{students.length}</span>
        </div>

        {errors.students && (
          <div className="flex flex-col gap-3 px-4 py-4 text-sm text-[#b53333] md:flex-row md:items-center md:justify-between">
            <p>{errors.students}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchAdminData()}>
              {t("admin.actions.retry")}
            </Button>
          </div>
        )}

        {!errors.students && students.length === 0 && (
          <div className="px-4 py-6 text-sm text-[#87867f]">{t("admin.states.noStudents")}</div>
        )}

        {!errors.students && students.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f0eee6] text-left text-[#5e5d59]">
                <tr>
                  <th className="px-4 py-3">{t("admin.students.name")}</th>
                  <th className="px-4 py-3">{t("admin.students.email")}</th>
                  <th className="px-4 py-3">{t("admin.students.phone")}</th>
                  <th className="px-4 py-3">{t("admin.students.createdAt")}</th>
                  <th className="px-4 py-3">{t("admin.students.status")}</th>
                  <th className="px-4 py-3 text-right">{t("admin.students.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const studentId = student.id
                  const isDeactivating = typeof studentId === "number" && deactivatingStudentIds.has(studentId)
                  const isActive = !!student.active
                  return (
                    <tr key={studentId ?? student.email ?? `student-${index}`} className="border-t border-[#f0eee6]">
                      <td className="px-4 py-3 font-medium text-[#141413]">
                        {[student.firstName, student.lastName].filter(Boolean).join(" ").trim() || "-"}
                      </td>
                      <td className="px-4 py-3 text-[#4d4c48]">{student.email || "-"}</td>
                      <td className="px-4 py-3 text-[#4d4c48]">{student.phoneNumber || "-"}</td>
                      <td className="px-4 py-3 text-[#4d4c48]">{formatDate(student.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            isActive ? "bg-[#e8e6dc] text-[#4d4c48]" : "bg-[#f0eee6] text-[#87867f]"
                          }`}
                        >
                          {isActive ? t("admin.status.active") : t("admin.status.inactive")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!studentId || !isActive || isDeactivating}
                          onClick={() => void deactivateStudent(student)}
                        >
                          {isDeactivating ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {t("admin.actions.deactivating")}
                            </span>
                          ) : (
                            t("admin.actions.deactivate")
                          )}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[#f0eee6] bg-[#faf9f5]">
        <div className="flex items-center justify-between border-b border-[#f0eee6] px-4 py-3">
          <h2 className="text-lg font-semibold text-[#141413]">{t("admin.courses.title")}</h2>
          <span className="text-sm text-[#87867f]">{courses.length}</span>
        </div>

        {errors.courses && (
          <div className="flex flex-col gap-3 px-4 py-4 text-sm text-[#b53333] md:flex-row md:items-center md:justify-between">
            <p>{errors.courses}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchAdminData()}>
              {t("admin.actions.retry")}
            </Button>
          </div>
        )}

        {!errors.courses && courses.length === 0 && (
          <div className="px-4 py-6 text-sm text-[#87867f]">{t("admin.states.noCourses")}</div>
        )}

        {!errors.courses && courses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f0eee6] text-left text-[#5e5d59]">
                <tr>
                  <th className="px-4 py-3">{t("admin.courses.titleCol")}</th>
                  <th className="px-4 py-3">{t("admin.courses.instructor")}</th>
                  <th className="px-4 py-3">{t("admin.courses.price")}</th>
                  <th className="px-4 py-3">{t("admin.courses.createdAt")}</th>
                  <th className="px-4 py-3">{t("admin.courses.status")}</th>
                  <th className="px-4 py-3 text-right">{t("admin.courses.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course, index) => {
                  const courseId = course.id
                  const isDeactivating = typeof courseId === "number" && deactivatingCourseIds.has(courseId)
                  const isActive = !!course.active
                  return (
                    <tr key={courseId ?? course.title ?? `course-${index}`} className="border-t border-[#f0eee6]">
                      <td className="px-4 py-3 font-medium text-[#141413]">{course.title || "-"}</td>
                      <td className="px-4 py-3 text-[#4d4c48]">{course.instructor || "-"}</td>
                      <td className="px-4 py-3 text-[#4d4c48]">{formatPrice(course.price)}</td>
                      <td className="px-4 py-3 text-[#4d4c48]">{formatDate(course.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            isActive ? "bg-[#e8e6dc] text-[#4d4c48]" : "bg-[#f0eee6] text-[#87867f]"
                          }`}
                        >
                          {isActive ? t("admin.status.active") : t("admin.status.inactive")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!courseId || !isActive || isDeactivating}
                          onClick={() => void deactivateCourse(course)}
                        >
                          {isDeactivating ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {t("admin.actions.deactivating")}
                            </span>
                          ) : (
                            t("admin.actions.deactivate")
                          )}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
    </div>
  )
}
