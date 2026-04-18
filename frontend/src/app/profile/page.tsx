"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/Navbar"
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

const ROLE_BADGE: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  STUDENT: { label: "Student", className: "bg-[#f0eee6] text-[#c96442]", icon: GraduationCap },
  INSTRUCTOR: { label: "Instructor", className: "bg-[#f0eee6] text-[#c96442]", icon: GraduationCap },
  ADMIN: { label: "Admin", className: "bg-[#e8e6dc] text-[#c96442]", icon: ShieldCheck },
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

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
        if (user?.role === "STUDENT") {
          const profile = await StudentsService.getProfile()
          setStudentProfile(profile)
          setForm({
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            email: profile.email || "",
            phoneNumber: profile.phoneNumber || "",
            dateOfBirth: profile.dateOfBirth || "",
            address: profile.address || "",
          })
        }
      } catch (err) {
        console.error("Failed to load profile", err)
        toast({
          title: "Failed to load profile",
          description: getErrorMessage(err),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [authLoading, isAuthenticated, user, router, toast])

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
      toast({ title: "Profile updated successfully" })
    } catch (err) {
      toast({
        title: "Failed to update profile",
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
          <h1 className="text-3xl font-bold text-[#141413]">My Profile</h1>
          <p className="text-[#5e5d59] mt-1">View and manage your personal information</p>
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
                  {badge.label}
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
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={form.phoneNumber}
                      onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="Your address"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={saving} className="gap-2">
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={User} label="First Name" value={studentProfile.firstName} />
                    <InfoRow icon={User} label="Last Name" value={studentProfile.lastName} />
                  </div>
                  <InfoRow icon={Mail} label="Email" value={studentProfile.email} />
                  <InfoRow icon={Phone} label="Phone Number" value={studentProfile.phoneNumber} />
                  <InfoRow icon={Calendar} label="Date of Birth" value={studentProfile.dateOfBirth} />
                  <InfoRow icon={MapPin} label="Address" value={studentProfile.address} />

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditing(true)}
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={User} label="First Name" value={user?.firstName} />
                  <InfoRow icon={User} label="Last Name" value={user?.lastName} />
                </div>
                <InfoRow icon={Mail} label="Email" value={user?.email} />
                <InfoRow icon={BadgeIcon} label="Role" value={badge.label} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
