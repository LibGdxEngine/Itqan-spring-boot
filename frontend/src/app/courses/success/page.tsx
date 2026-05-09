"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentsBillingApi } from "@/lib/payments-billing";
import { Navbar } from "@/components/Navbar";

type Status = "loading" | "success" | "pending" | "failed";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();
  const sessionId = useMemo(() => searchParams.get("session_id"), [searchParams]);

  const [status, setStatus] = useState<Status>("loading");
  const [courseId, setCourseId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>(t("checkout.success.couldNotVerify"));

  useEffect(() => {
    let mounted = true;
    let attempts = 0;

    const verify = async () => {
      if (!sessionId) {
        setStatus("failed");
        setErrorMessage(t("checkout.success.missingSession"));
        return;
      }

      while (mounted && attempts < 6) {
        attempts += 1;
        try {
          const response = await paymentsBillingApi.getCheckoutSessionStatus(sessionId);
          if (response.status === "COMPLETED") {
            if (!mounted) {
              return;
            }
            setCourseId(response.courseId);
            setStatus("success");
            return;
          }

          if (response.status === "PENDING") {
            setStatus("pending");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }

          setStatus("failed");
          setErrorMessage(t("checkout.success.paymentStatus", { status: response.status }));
          return;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      if (mounted) {
        setStatus("failed");
      }
    };

    verify();
    return () => {
      mounted = false;
    };
  }, [sessionId, t]);

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      <Navbar />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        {status === "loading" && <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#c96442]" />}
        {status === "pending" && <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#c96442]" />}
        {status === "success" && <CheckCircle2 className="mb-4 h-12 w-12 text-[#c96442]" />}
        {status === "failed" && <AlertCircle className="mb-4 h-12 w-12 text-red-600" />}

        {status === "loading" && <h1 className="text-2xl font-semibold">{t("checkout.success.verifying")}</h1>}
        {status === "pending" && <h1 className="text-2xl font-semibold">{t("checkout.success.finalizing")}</h1>}
        {status === "success" && <h1 className="text-2xl font-semibold">{t("checkout.success.success")}</h1>}
        {status === "failed" && <h1 className="text-2xl font-semibold">{t("checkout.success.couldNotVerify")}</h1>}

        {status === "failed" && <p className="mt-2 text-[#5e5d59]">{errorMessage}</p>}

        <div className="mt-6 flex gap-3">
          {status === "success" && courseId !== null && (
            <Button onClick={() => router.push(`/learn/${courseId}`)}>{t("checkout.success.startLearning")}</Button>
          )}
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            {t("checkout.success.goToDashboard")}
          </Button>
        </div>
      </main>
    </div>
  );
}
