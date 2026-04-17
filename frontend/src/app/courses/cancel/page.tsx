"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

export default function CheckoutCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <XCircle className="mb-4 h-12 w-12 text-red-600" />
        <h1 className="text-2xl font-semibold">Checkout canceled</h1>
        <p className="mt-2 text-slate-600">No payment was charged. You can return to the course page and try again.</p>

        <div className="mt-6 flex gap-3">
          <Button onClick={() => router.push("/courses")}>Browse Courses</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
