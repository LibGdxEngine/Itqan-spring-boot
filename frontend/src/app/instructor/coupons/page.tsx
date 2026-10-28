"use client"

import { useTranslations } from "next-intl"

import { PageHeader } from "@/components/admin/ui"
import { CouponManager } from "@/components/instructor/CouponManager"
import { StudioShell } from "@/components/studio/StudioShell"

export default function InstructorCouponsPage() {
  const t = useTranslations("studio.coupons")
  return (
    <StudioShell>
      <PageHeader title={t("title")} description={t("description")} />
      <CouponManager />
    </StudioShell>
  )
}
