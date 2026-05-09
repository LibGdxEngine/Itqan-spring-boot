"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/Navbar"
import { useTranslations } from "next-intl"
import { StudentsService } from "@/lib/api"
import type { StudentResponse } from "@/lib/api"
import { getErrorMessage } from "@/lib/api-axios"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Save,
  Pencil,
  GraduationCap,
  ShieldCheck,
  X,
} from "lucide-react"

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value?: string | null
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f0eee6] border border-[#f0eee6]">
      <Icon className="w-4 h-4 text-[#87867f] shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-[#87867f] font-medium">{label}</p>
        <p className="text-sm font-medium text-[#141413] truncate">{value || "—"}</p>
      </div>
    </div>
  )
}

const ROLE_BADGE: Record<string, { labelKey: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  STUDENT: { labelKey: "profile.roles.student", className: "bg-[#f0eee6] text-[#c96442]", icon: GraduationCap },
  INSTRUCTOR: { labelKey: "profile.roles.instructor", className: "bg-[#f0eee6] text-[#c96442]", icon: GraduationCap },
  ADMIN: { labelKey: "profile.roles.admin", className: "bg-[#e8e6dc] text-[#c96442]", icon: ShieldCheck },
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations()

  const [studentProfile, setStudentProfile] = useState<StudentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    address: "",
  })

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push("/login?redirect=/profile")
      return
    }

    const loadProfile = async () => {
      try {
        if (user?.role !== "STUDENT") {
          if (user?.role === "INSTRUCTOR") router.replace("/instructor")
          else if (user?.role === "ADMIN") router.replace("/admin")
          else router.replace("/")
          return
        }
        const profile = await StudentsService.getProfile()
        if (!profile?.id) {
          router.replace("/")
          return
        }
        setStudentProfile(profile)
        setForm({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email || "",
          phoneNumber: profile.phoneNumber || "",
          dateOfBirth: profile.dateOfBirth || "",
          address: profile.address || "",
        })
      } catch (err) {
        console.error("Failed to load profile", err)
        toast({
          title: t("profile.loadFailed"),
          description: getErrorMessage(err),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.role, user?.id])

  const handleSave = async () => {
    if (!studentProfile?.id) return
    setSaving(true)
    try {
      const updated = await StudentsService.updateStudent(studentProfile.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address,
      })
      setStudentProfile(updated)
      setForm({
        firstName: updated.firstName || "",
        lastName: updated.lastName || "",
        email: updated.email || "",
        phoneNumber: updated.phoneNumber || "",
        dateOfBirth: updated.dateOfBirth || "",
        address: updated.address || "",
      })
      setEditing(false)
      toast({ title: t("profile.updated") })
    } catch (err) {
      toast({
        title: t("profile.updateFailed"),
        description: getErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (studentProfile) {
      setForm({
        firstName: studentProfile.firstName || "",
        lastName: studentProfile.lastName || "",
        email: studentProfile.email || "",
        phoneNumber: studentProfile.phoneNumber || "",
        dateOfBirth: studentProfile.dateOfBirth || "",
        address: studentProfile.address || "",
      })
    }
    setEditing(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f5f4ed]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#c96442]" />
        </div>
      </div>
    )
  }

  const role = user?.role || "STUDENT"
  const badge = ROLE_BADGE[role] ?? ROLE_BADGE.STUDENT
  const BadgeIcon = badge.icon

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#141413]">{t("profile.title")}</h1>
          <p className="text-[#5e5d59] mt-1">{t("profile.subtitle")}</p>
        </div>

        {/* Profile Card */}
        <div className="bg-[#faf9f5] rounded-2xl border border-[#e8e6dc] shadow-sm overflow-hidden">
          {/* Header banner */}
          <div className="bg-[#c96442] px-6 py-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[#30302e] border-2 border-[#30302e] flex items-center justify-center text-[#faf9f5] text-2xl font-bold shrink-0 select-none">
                {user?.firstName?.[0]?.toUpperCase()}
                {user?.lastName?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#faf9f5]">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-[#faf9f5] text-sm mt-0.5">{user?.email}</p>
                <span
                  className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                >
                  <BadgeIcon className="w-3 h-3" />
                  {t(badge.labelKey)}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {user?.role === "STUDENT" && studentProfile ? (
              editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">{t("profile.firstName")}</Label>
                      <Input
                        id="firstName"
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">{t("profile.lastName")}</Label>
                      <Input
                        id="lastName"
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">{t("profile.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">{t("profile.phone")}</Label>
                    <Input
                      id="phone"
                      value={form.phoneNumber}
                      onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                      placeholder={t("profile.phonePlaceholder")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dob">{t("profile.dateOfBirth")}</Label>
                    <Input
                      id="dob"
                      type="date"
                      max={new Date(Date.now() - 86400000).toISOString().split("T")[0]}
                      value={form.dateOfBirth}
                      onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">{t("profile.address")}</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder={t("profile.addressPlaceholder")}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {t("profile.saveChanges")}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={saving} className="gap-2">
                      <X className="w-4 h-4" />
                      {t("profile.cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={User} label={t("profile.firstName")} value={studentProfile.firstName} />
                    <InfoRow icon={User} label={t("profile.lastName")} value={studentProfile.lastName} />
                  </div>
                  <InfoRow icon={Mail} label={t("profile.email")} value={studentProfile.email} />
                  <InfoRow icon={Phone} label={t("profile.phone")} value={studentProfile.phoneNumber} />
                  <InfoRow icon={Calendar} label={t("profile.dateOfBirth")} value={studentProfile.dateOfBirth} />
                  <InfoRow icon={MapPin} label={t("profile.address")} value={studentProfile.address} />

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditing(true)}
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      {t("profile.editProfile")}
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={User} label={t("profile.firstName")} value={user?.firstName} />
                  <InfoRow icon={User} label={t("profile.lastName")} value={user?.lastName} />
                </div>
                <InfoRow icon={Mail} label={t("profile.email")} value={user?.email} />
                <InfoRow icon={BadgeIcon} label={t("profile.role")} value={t(badge.labelKey)} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
