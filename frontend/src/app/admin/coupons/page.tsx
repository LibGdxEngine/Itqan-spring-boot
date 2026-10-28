"use client"

import { useTranslations } from "next-intl"

import { PageHeader } from "@/components/admin/ui"
import { CouponManager } from "@/components/instructor/CouponManager"

export default function AdminCouponsPage() {
  const t = useTranslations("admin.couponsPage")
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <CouponManager />
    </>
  )
}
