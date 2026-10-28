"use client"

import { useTranslations } from "next-intl"

import { PageHeader } from "@/components/admin/ui"
import { LandingPageAdmin } from "@/app/admin/_components/LandingPageAdmin"

export default function AdminLandingPage() {
  const t = useTranslations("admin.landingPage")
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <LandingPageAdmin />
    </>
  )
}
