"use client"

import { useTranslations } from "next-intl"

import { PageHeader } from "@/components/admin/ui"
import { MuqtatafatAdmin } from "@/app/admin/_components/MuqtatafatAdmin"

export default function AdminClipsPage() {
  const t = useTranslations("admin.clipsPage")
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <MuqtatafatAdmin />
    </>
  )
}
