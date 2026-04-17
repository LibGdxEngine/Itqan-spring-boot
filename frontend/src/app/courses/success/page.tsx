"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentsBillingApi } from "@/lib/payments-billing";
import { Navbar } from "@/components/Navbar";

type Status = "loading" | "success" | "pending" | "failed";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = useMemo(() => searchParams.get("session_id"), [searchParams]);

  const [status, setStatus] = useState<Status>("loading");
  const [courseId, setCourseId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("We could not verify your payment.");

  useEffect(() => {
    let mounted = true;
    let attempts = 0;

    const verify = async () => {
      if (!sessionId) {
        setStatus("failed");
        setErrorMessage("Missing checkout session id.");
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
          setErrorMessage(`Payment status: ${response.status}`);
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
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        {status === "loading" && <Loader2 className="mb-4 h-10 w-10 animate-spin text-sky-600" />}
        {status === "pending" && <Loader2 className="mb-4 h-10 w-10 animate-spin text-sky-600" />}
        {status === "success" && <CheckCircle2 className="mb-4 h-12 w-12 text-green-600" />}
        {status === "failed" && <AlertCircle className="mb-4 h-12 w-12 text-red-600" />}

        {status === "loading" && <h1 className="text-2xl font-semibold">Verifying payment...</h1>}
        {status === "pending" && <h1 className="text-2xl font-semibold">Payment received, finalizing enrollment...</h1>}
        {status === "success" && <h1 className="text-2xl font-semibold">Payment successful</h1>}
        {status === "failed" && <h1 className="text-2xl font-semibold">Could not verify payment</h1>}

        {status === "failed" && <p className="mt-2 text-slate-600">{errorMessage}</p>}

        <div className="mt-6 flex gap-3">
          {status === "success" && courseId !== null && (
            <Button onClick={() => router.push(`/learn/${courseId}`)}>Start Learning</Button>
          )}
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
