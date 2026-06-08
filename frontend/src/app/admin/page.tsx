"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { BarChart3, BookOpen, CheckCircle2, Crown, GraduationCap, Loader2, ShieldCheck, UserCog, Users } from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { CourseResponse, CoursesService, OpenAPI, StudentResponse, StudentsService } from "@/lib/api"
import { AdminUser, adminsApi } from "@/lib/admins"
import { InstructorUser, instructorsApi } from "@/lib/instructors"
import { LandingPageAdmin } from "@/app/admin/_components/LandingPageAdmin"
import { MuqtatafatAdmin } from "@/app/admin/_components/MuqtatafatAdmin"

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface ListErrors {
  students?: string
  courses?: string
  admins?: string
  instructors?: string
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

interface InstructorFormState {
  firstName: string
  lastName: string
  email: string
  password: string
  enabled: boolean
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

function sortInstructors(items: InstructorUser[]) {
  return [...items].sort((a, b) => {
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

const defaultInstructorForm: InstructorFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  enabled: true,
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
  const [instructors, setInstructors] = useState<InstructorUser[]>([])
  const [instructorCreateForm, setInstructorCreateForm] = useState<InstructorFormState>(defaultInstructorForm)
  const [creatingInstructor, setCreatingInstructor] = useState(false)
  const [editingInstructorId, setEditingInstructorId] = useState<number | null>(null)
  const [instructorEditingForm, setInstructorEditingForm] = useState<InstructorFormState | null>(null)
  const [savingInstructor, setSavingInstructor] = useState(false)
  const [deactivatingInstructorIds, setDeactivatingInstructorIds] = useState<Set<number>>(new Set())

  const fetchAdminData = useCallback(async () => {
    setLoading(true)
    setErrors({})

    const [adminsResult, studentsResult, coursesResult, instructorsResult] = await Promise.allSettled([
      adminsApi.getAll(),
      StudentsService.getAllStudents({}),
      CoursesService.getMyCourses({}),
      instructorsApi.getAll(),
    ])

    const nextErrors: ListErrors = {}

    if (adminsResult.status === "fulfilled") {
      setAdmins(sortAdmins(adminsResult.value))
    } else {
      nextErrors.admins = getErrorMessage(adminsResult.reason)
    }

    if (studentsResult.status === "fulfilled") {
      setStudents(studentsResult.value.content ?? [])
    } else {
      nextErrors.students = getErrorMessage(studentsResult.reason)
    }

    if (coursesResult.status === "fulfilled") {
      setCourses(coursesResult.value.content ?? [])
    } else {
      nextErrors.courses = getErrorMessage(coursesResult.reason)
    }

    if (instructorsResult.status === "fulfilled") {
      setInstructors(sortInstructors(instructorsResult.value))
    } else {
      nextErrors.instructors = getErrorMessage(instructorsResult.reason)
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

    const activeInstructors = instructors.filter((instructor) => instructor.enabled).length

    return {
      totalAdmins: admins.length,
      superAdmins: admins.filter((admin) => admin.superAdmin).length,
      totalStudents: students.length,
      activeStudents,
      totalCourses: courses.length,
      activeCourses,
      totalInstructors: instructors.length,
      activeInstructors,
    }
  }, [admins, students, courses, instructors])

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

  const createInstructor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManageAdmins) return

    setCreatingInstructor(true)
    try {
      const created = await instructorsApi.create({
        firstName: instructorCreateForm.firstName.trim(),
        lastName: instructorCreateForm.lastName.trim(),
        email: instructorCreateForm.email.trim(),
        password: instructorCreateForm.password,
        enabled: instructorCreateForm.enabled,
      })

      setInstructors((prev) => sortInstructors([...prev, created]))
      setInstructorCreateForm(defaultInstructorForm)
      toast({ title: t("admin.actions.instructorCreated") })
    } catch (error) {
      toast({
        title: t("admin.states.failed"),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setCreatingInstructor(false)
    }
  }

  const startEditingInstructor = (instructor: InstructorUser) => {
    setEditingInstructorId(instructor.id)
    setInstructorEditingForm({
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      email: instructor.email,
      password: "",
      enabled: instructor.enabled,
    })
  }

  const cancelEditingInstructor = () => {
    setEditingInstructorId(null)
    setInstructorEditingForm(null)
  }

  const saveInstructorChanges = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManageAdmins || !instructorEditingForm || editingInstructorId === null) return

    setSavingInstructor(true)
    try {
      const updated = await instructorsApi.update(editingInstructorId, {
        firstName: instructorEditingForm.firstName.trim(),
        lastName: instructorEditingForm.lastName.trim(),
        email: instructorEditingForm.email.trim(),
        password: instructorEditingForm.password || undefined,
        enabled: instructorEditingForm.enabled,
      })

      setInstructors((prev) => sortInstructors(prev.map((item) => (item.id === updated.id ? updated : item))))
      cancelEditingInstructor()
      toast({ title: t("admin.actions.instructorUpdated") })
    } catch (error) {
      toast({
        title: t("admin.states.failed"),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setSavingInstructor(false)
    }
  }

  const deactivateInstructor = async (instructor: InstructorUser) => {
    if (!canManageAdmins || !instructor.enabled) return

    setDeactivatingInstructorIds((prev) => new Set(prev).add(instructor.id))
    try {
      const updated = await instructorsApi.deactivate(instructor.id)
      setInstructors((prev) => sortInstructors(prev.map((item) => (item.id === updated.id ? updated : item))))
      toast({ title: t("admin.actions.instructorDeactivated") })
    } catch (error) {
      toast({
        title: t("admin.states.failed"),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setDeactivatingInstructorIds((prev) => {
        const next = new Set(prev)
        next.delete(instructor.id)
        return next
      })
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
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-24 pb-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-[#141413]">
            <ShieldCheck className="h-8 w-8 text-[#c96442]" />
            {t("admin.dashboard")}
          </h1>
          <p className="mt-2 text-[#5e5d59]">{t("admin.welcome", { name: user.firstName })}</p>
        </div>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-2 self-start rounded-lg border border-[#c96442] bg-[#c96442] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#b3573a] md:self-auto"
        >
          <BarChart3 className="h-4 w-4" />
          {t("admin.analytics.title")}
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <p className="text-sm text-[#87867f]">{t("admin.stats.totalInstructors")}</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#141413]">
            <GraduationCap className="h-5 w-5 text-[#87867f]" />
            {stats.totalInstructors}
          </p>
        </div>
        <div className="rounded-xl border border-[#f0eee6] bg-[#faf9f5] p-4">
          <p className="text-sm text-[#87867f]">{t("admin.stats.activeInstructors")}</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#141413]">
            <CheckCircle2 className="h-5 w-5 text-[#c96442]" />
            {stats.activeInstructors}
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
            <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" onSubmit={createAdmin}>
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
            <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" onSubmit={saveAdminChanges}>
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
          <ResponsiveTable
            rows={admins}
            getRowKey={(admin, i) => admin.id ?? i}
            columns={[
              {
                header: t("admin.admins.name"),
                cell: (admin) => (
                  <span className="font-medium text-[#141413]">
                    {[admin.firstName, admin.lastName].filter(Boolean).join(" ").trim() || "-"}
                  </span>
                ),
              },
              { header: t("admin.admins.email"), cell: (admin) => admin.email },
              { header: t("admin.admins.createdAt"), cell: (admin) => formatDate(admin.createdAt) },
              {
                header: t("admin.admins.accountType"),
                cell: (admin) => (
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      admin.superAdmin ? "bg-[#c96442] text-[#faf9f5]" : "bg-[#e8e6dc] text-[#4d4c48]"
                    }`}
                  >
                    {admin.superAdmin ? t("admin.admins.superAdmin") : t("admin.admins.admin")}
                  </span>
                ),
              },
              {
                header: t("admin.admins.status"),
                cell: (admin) => (
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      admin.enabled ? "bg-[#e8e6dc] text-[#4d4c48]" : "bg-[#f0eee6] text-[#87867f]"
                    }`}
                  >
                    {admin.enabled ? t("admin.status.active") : t("admin.status.inactive")}
                  </span>
                ),
              },
            ]}
            actionsHeader={canManageAdmins ? t("admin.admins.actions") : undefined}
            actions={
              canManageAdmins
                ? (admin) => (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditingAdmin(admin)}
                      disabled={savingAdmin}
                    >
                      {editingAdminId === admin.id ? t("admin.actions.editing") : t("admin.actions.edit")}
                    </Button>
                  )
                : undefined
            }
          />
        )}
      </section>

      <section className="mb-8 rounded-xl border border-[#f0eee6] bg-[#faf9f5]">
        <div className="flex items-center justify-between border-b border-[#f0eee6] px-4 py-3">
          <h2 className="text-lg font-semibold text-[#141413]">{t("admin.instructors.title")}</h2>
          <span className="text-sm text-[#87867f]">{instructors.length}</span>
        </div>

        {errors.instructors && (
          <div className="flex flex-col gap-3 px-4 py-4 text-sm text-[#b53333] md:flex-row md:items-center md:justify-between">
            <p>{errors.instructors}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchAdminData()}>
              {t("admin.actions.retry")}
            </Button>
          </div>
        )}

        {!errors.instructors && !canManageAdmins && (
          <div className="mx-4 mt-4 rounded-lg border border-[#e8e6dc] bg-[#f0eee6] px-4 py-3 text-sm text-[#4d4c48]">
            {t("admin.instructors.permissionsHint")}
          </div>
        )}

        {!errors.instructors && canManageAdmins && (
          <div className="border-b border-[#f0eee6] px-4 py-4">
            <h3 className="mb-3 text-sm font-semibold text-[#141413]">{t("admin.instructors.createTitle")}</h3>
            <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" onSubmit={createInstructor}>
              <div className="space-y-1.5">
                <Label htmlFor="create-instructor-first-name">{t("admin.instructors.firstName")}</Label>
                <Input
                  id="create-instructor-first-name"
                  value={instructorCreateForm.firstName}
                  onChange={(event) => setInstructorCreateForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-instructor-last-name">{t("admin.instructors.lastName")}</Label>
                <Input
                  id="create-instructor-last-name"
                  value={instructorCreateForm.lastName}
                  onChange={(event) => setInstructorCreateForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-instructor-email">{t("admin.instructors.email")}</Label>
                <Input
                  id="create-instructor-email"
                  type="email"
                  value={instructorCreateForm.email}
                  onChange={(event) => setInstructorCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-instructor-password">{t("admin.instructors.password")}</Label>
                <Input
                  id="create-instructor-password"
                  type="password"
                  value={instructorCreateForm.password}
                  onChange={(event) => setInstructorCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                  minLength={8}
                  required
                />
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-[#f0eee6] px-3 py-2 text-sm text-[#4d4c48]">
                <input
                  type="checkbox"
                  checked={instructorCreateForm.enabled}
                  onChange={(event) => setInstructorCreateForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                {t("admin.instructors.enabled")}
              </label>
              <div className="md:col-span-2 xl:col-span-3">
                <Button type="submit" disabled={creatingInstructor}>
                  {creatingInstructor ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("admin.actions.creating")}
                    </span>
                  ) : (
                    t("admin.actions.createInstructor")
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {!errors.instructors && canManageAdmins && instructorEditingForm && editingInstructorId !== null && (
          <div className="border-b border-[#f0eee6] px-4 py-4">
            <h3 className="mb-3 text-sm font-semibold text-[#141413]">{t("admin.instructors.editTitle")}</h3>
            <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" onSubmit={saveInstructorChanges}>
              <div className="space-y-1.5">
                <Label htmlFor="edit-instructor-first-name">{t("admin.instructors.firstName")}</Label>
                <Input
                  id="edit-instructor-first-name"
                  value={instructorEditingForm.firstName}
                  onChange={(event) =>
                    setInstructorEditingForm((prev) => (prev ? { ...prev, firstName: event.target.value } : prev))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-instructor-last-name">{t("admin.instructors.lastName")}</Label>
                <Input
                  id="edit-instructor-last-name"
                  value={instructorEditingForm.lastName}
                  onChange={(event) =>
                    setInstructorEditingForm((prev) => (prev ? { ...prev, lastName: event.target.value } : prev))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-instructor-email">{t("admin.instructors.email")}</Label>
                <Input
                  id="edit-instructor-email"
                  type="email"
                  value={instructorEditingForm.email}
                  onChange={(event) =>
                    setInstructorEditingForm((prev) => (prev ? { ...prev, email: event.target.value } : prev))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-instructor-password">{t("admin.instructors.newPassword")}</Label>
                <Input
                  id="edit-instructor-password"
                  type="password"
                  value={instructorEditingForm.password}
                  onChange={(event) =>
                    setInstructorEditingForm((prev) => (prev ? { ...prev, password: event.target.value } : prev))
                  }
                  minLength={8}
                  placeholder={t("admin.instructors.passwordOptional")}
                />
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-[#f0eee6] px-3 py-2 text-sm text-[#4d4c48]">
                <input
                  type="checkbox"
                  checked={instructorEditingForm.enabled}
                  onChange={(event) =>
                    setInstructorEditingForm((prev) => (prev ? { ...prev, enabled: event.target.checked } : prev))
                  }
                />
                {t("admin.instructors.enabled")}
              </label>
              <div className="flex items-center gap-2 md:col-span-2 xl:col-span-3">
                <Button type="submit" disabled={savingInstructor}>
                  {savingInstructor ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("admin.actions.saving")}
                    </span>
                  ) : (
                    t("admin.actions.save")
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEditingInstructor} disabled={savingInstructor}>
                  {t("admin.actions.cancel")}
                </Button>
              </div>
            </form>
          </div>
        )}

        {!errors.instructors && instructors.length === 0 && (
          <div className="px-4 py-6 text-sm text-[#87867f]">{t("admin.states.noInstructors")}</div>
        )}

        {!errors.instructors && instructors.length > 0 && (
          <ResponsiveTable
            rows={instructors}
            getRowKey={(instructor, i) => instructor.id ?? i}
            columns={[
              {
                header: t("admin.instructors.name"),
                cell: (instructor) => (
                  <span className="font-medium text-[#141413]">
                    {[instructor.firstName, instructor.lastName].filter(Boolean).join(" ").trim() || "-"}
                  </span>
                ),
              },
              { header: t("admin.instructors.email"), cell: (instructor) => instructor.email },
              { header: t("admin.instructors.createdAt"), cell: (instructor) => formatDate(instructor.createdAt) },
              {
                header: t("admin.instructors.status"),
                cell: (instructor) => (
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      instructor.enabled ? "bg-[#e8e6dc] text-[#4d4c48]" : "bg-[#f0eee6] text-[#87867f]"
                    }`}
                  >
                    {instructor.enabled ? t("admin.status.active") : t("admin.status.inactive")}
                  </span>
                ),
              },
            ]}
            actionsHeader={canManageAdmins ? t("admin.instructors.actions") : undefined}
            actions={
              canManageAdmins
                ? (instructor) => {
                    const isEditing = editingInstructorId === instructor.id
                    const isDeactivating = deactivatingInstructorIds.has(instructor.id)
                    return (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditingInstructor(instructor)}
                          disabled={savingInstructor}
                        >
                          {isEditing ? t("admin.actions.editing") : t("admin.actions.edit")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!instructor.enabled || isDeactivating}
                          onClick={() => void deactivateInstructor(instructor)}
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
                      </>
                    )
                  }
                : undefined
            }
          />
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
          <ResponsiveTable
            rows={students}
            getRowKey={(student, index) => student.id ?? student.email ?? `student-${index}`}
            columns={[
              {
                header: t("admin.students.name"),
                cell: (student) => (
                  <span className="font-medium text-[#141413]">
                    {[student.firstName, student.lastName].filter(Boolean).join(" ").trim() || "-"}
                  </span>
                ),
              },
              { header: t("admin.students.email"), cell: (student) => student.email || "-" },
              { header: t("admin.students.phone"), cell: (student) => student.phoneNumber || "-" },
              { header: t("admin.students.createdAt"), cell: (student) => formatDate(student.createdAt) },
              {
                header: t("admin.students.status"),
                cell: (student) => (
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      student.active ? "bg-[#e8e6dc] text-[#4d4c48]" : "bg-[#f0eee6] text-[#87867f]"
                    }`}
                  >
                    {student.active ? t("admin.status.active") : t("admin.status.inactive")}
                  </span>
                ),
              },
            ]}
            actionsHeader={t("admin.students.actions")}
            actions={(student) => {
              const studentId = student.id
              const isDeactivating = typeof studentId === "number" && deactivatingStudentIds.has(studentId)
              const isActive = !!student.active
              return (
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
              )
            }}
          />
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
          <ResponsiveTable
            rows={courses}
            getRowKey={(course, index) => course.id ?? course.title ?? `course-${index}`}
            columns={[
              {
                header: t("admin.courses.titleCol"),
                cell: (course) => <span className="font-medium text-[#141413]">{course.title || "-"}</span>,
              },
              { header: t("admin.courses.instructor"), cell: (course) => course.instructor || "-" },
              { header: t("admin.courses.price"), cell: (course) => formatPrice(course.price) },
              { header: t("admin.courses.createdAt"), cell: (course) => formatDate(course.createdAt) },
              {
                header: t("admin.courses.status"),
                cell: (course) => (
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      course.active ? "bg-[#e8e6dc] text-[#4d4c48]" : "bg-[#f0eee6] text-[#87867f]"
                    }`}
                  >
                    {course.active ? t("admin.status.active") : t("admin.status.inactive")}
                  </span>
                ),
              },
            ]}
            actionsHeader={t("admin.courses.actions")}
            actions={(course) => {
              const courseId = course.id
              const isDeactivating = typeof courseId === "number" && deactivatingCourseIds.has(courseId)
              const isActive = !!course.active
              return (
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
              )
            }}
          />
        )}
      </section>

      <LandingPageAdmin />

      <MuqtatafatAdmin />
    </div>
    </div>
  )
}
