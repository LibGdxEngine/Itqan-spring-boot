"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentsBillingApi } from "@/lib/payments-billing";
import { Navbar } from "@/components/Navbar";

// "waiting": the payment isn't finished and may not be soon, e.g. a voucher still to be paid at Fawry.
type Status = "loading" | "success" | "pending" | "waiting" | "failed";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();
  // EasyKash returns the buyer with ?status=&customerReference=&voucher= instead of session_id.
  const sessionId = useMemo(
    () => searchParams.get("session_id") ?? searchParams.get("customerReference"),
    [searchParams],
  );
  // Only used for messaging: access is decided by the server, never by these URL parameters.
  const gatewayStatus = useMemo(() => searchParams.get("status")?.toLowerCase() ?? null, [searchParams]);
  const voucher = useMemo(() => searchParams.get("voucher"), [searchParams]);

  const [status, setStatus] = useState<Status>("loading");
  const [courseId, setCourseId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>(t("checkout.success.couldNotVerify"));

  useEffect(() => {
    let mounted = true;
    let attempts = 0;
    let lastStatus: string | null = null;

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
          if (!mounted) {
            return;
          }
          lastStatus = response.status;
          setCourseId(response.courseId);
          if (response.status === "COMPLETED") {
            setStatus("success");
            return;
          }

          if (response.status === "PENDING") {
            if (gatewayStatus === "failed") {
              setStatus("failed");
              setErrorMessage(t("checkout.success.gatewayFailed"));
              return;
            }
            if (voucher || gatewayStatus === "pending") {
              setStatus("waiting");
              return;
            }
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
        setStatus(lastStatus === "PENDING" ? "waiting" : "failed");
      }
    };

    verify();
    return () => {
      mounted = false;
    };
  }, [sessionId, gatewayStatus, voucher, t]);

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main id="main-content" className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        {status === "loading" && <Loader2 className="mb-4 h-10 w-10 animate-spin text-brand" />}
        {status === "pending" && <Loader2 className="mb-4 h-10 w-10 animate-spin text-brand" />}
        {status === "success" && <CheckCircle2 className="mb-4 h-12 w-12 text-brand" />}
        {status === "waiting" && <Clock className="mb-4 h-12 w-12 text-brand" />}
        {status === "failed" && <AlertCircle className="mb-4 h-12 w-12 text-danger" />}

        {status === "loading" && <h1 className="text-2xl font-semibold">{t("checkout.success.verifying")}</h1>}
        {status === "pending" && <h1 className="text-2xl font-semibold">{t("checkout.success.finalizing")}</h1>}
        {status === "success" && <h1 className="text-2xl font-semibold">{t("checkout.success.success")}</h1>}
        {status === "waiting" && <h1 className="text-2xl font-semibold">{t("checkout.success.waitingTitle")}</h1>}
        {status === "failed" && <h1 className="text-2xl font-semibold">{t("checkout.success.couldNotVerify")}</h1>}

        {status === "failed" && <p className="mt-2 text-ink-2">{errorMessage}</p>}
        {status === "waiting" && (
          <>
            {voucher && (
              <div className="mt-4 rounded-lg border border-line-strong px-6 py-3">
                <p className="text-sm text-ink-2">{t("checkout.success.voucherLabel")}</p>
                <p className="text-2xl font-semibold text-ink" dir="ltr">{voucher}</p>
              </div>
            )}
            <p className="mt-4 text-ink-2">{t("checkout.success.waitingDescription")}</p>
          </>
        )}

        <div className="mt-6 flex gap-3">
          {status === "success" && courseId !== null && (
            <Button onClick={() => router.push(`/learn/${courseId}`)}>{t("checkout.success.startLearning")}</Button>
          )}
          {status === "failed" && courseId !== null && (
            <Button onClick={() => router.push(`/courses/${courseId}`)}>{t("checkout.success.backToCourse")}</Button>
          )}
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            {t("checkout.success.goToDashboard")}
          </Button>
        </div>
      </main>
    </div>
  );
}
