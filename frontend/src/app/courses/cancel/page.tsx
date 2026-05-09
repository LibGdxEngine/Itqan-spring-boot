"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

export default function CheckoutCancelPage() {
  const router = useRouter();
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      <Navbar />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <XCircle className="mb-4 h-12 w-12 text-red-600" />
        <h1 className="text-2xl font-semibold">{t("checkout.cancel.title")}</h1>
        <p className="mt-2 text-[#5e5d59]">{t("checkout.cancel.description")}</p>

        <div className="mt-6 flex gap-3">
          <Button onClick={() => router.push("/courses")}>{t("checkout.cancel.browseCourses")}</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            {t("checkout.cancel.goToDashboard")}
          </Button>
        </div>
      </main>
    </div>
  );
}
