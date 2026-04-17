"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, PlusCircle, TicketPercent } from "lucide-react";
import { CourseResponse } from "@/lib/api";
import api from "@/lib/api-axios";
import { paymentsBillingApi, CouponResponse } from "@/lib/payments-billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface CouponFormState {
  code: string;
  discountPercent: string;
  usageLimit: string;
  expiresAt: string;
}

const defaultFormState: CouponFormState = {
  code: "",
  discountPercent: "20",
  usageLimit: "",
  expiresAt: "",
};

export function CouponManager() {
  const { toast } = useToast();
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [formState, setFormState] = useState<CouponFormState>(defaultFormState);

  const extractErrorDetail = (error: unknown): string | null => {
    if (typeof error !== "object" || error === null) {
      return null;
    }
    const typedError = error as {
      response?: {
        data?: {
          detail?: unknown;
        };
      };
    };
    const detail = typedError.response?.data?.detail;
    return typeof detail === "string" && detail.trim().length > 0 ? detail : null;
  };

  useEffect(() => {
    const loadCourses = async () => {
      setLoadingCourses(true);
      try {
        const response = await api.get<CourseResponse[]>("/api/courses/mine");
        setCourses(response.data);
        if (response.data.length > 0 && response.data[0].id) {
          setSelectedCourseId(response.data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch owned courses", error);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    const loadCoupons = async () => {
      if (!selectedCourseId) {
        setCoupons([]);
        return;
      }
      setLoadingCoupons(true);
      try {
        const data = await paymentsBillingApi.getCourseCoupons(selectedCourseId);
        setCoupons(data);
      } catch (error) {
        console.error("Failed to fetch coupons", error);
      } finally {
        setLoadingCoupons(false);
      }
    };

    loadCoupons();
  }, [selectedCourseId]);

  const onCreateCoupon = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCourseId) {
      return;
    }
    setCreatingCoupon(true);
    try {
      await paymentsBillingApi.createCoupon({
        courseId: selectedCourseId,
        code: formState.code.trim() ? formState.code.trim() : undefined,
        discountPercent: Number(formState.discountPercent),
        usageLimit: formState.usageLimit.trim() ? Number(formState.usageLimit) : undefined,
        expiresAt: formState.expiresAt ? new Date(formState.expiresAt).toISOString() : undefined,
      });
      setFormState(defaultFormState);
      const updated = await paymentsBillingApi.getCourseCoupons(selectedCourseId);
      setCoupons(updated);
      toast({
        title: "Coupon created",
        description: "The coupon has been created successfully.",
      });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Failed to create coupon",
        description: extractErrorDetail(error) || "Please review your input and try again.",
      });
    } finally {
      setCreatingCoupon(false);
    }
  };

  const onDeactivateCoupon = async (couponId: number) => {
    try {
      await paymentsBillingApi.deactivateCoupon(couponId);
      setCoupons((prev) => prev.map((coupon) => (
        coupon.id === couponId ? { ...coupon, active: false } : coupon
      )));
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to deactivate coupon",
        description: "Please try again.",
      });
    }
  };

  if (loadingCourses) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <TicketPercent className="h-5 w-5 text-sky-600" />
        <h2 className="text-xl font-semibold text-slate-900">Course Coupons</h2>
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-slate-500">Create a course first to manage coupons.</p>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Course</label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={selectedCourseId ?? ""}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={onCreateCoupon} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 p-4 md:grid-cols-4">
            <Input
              placeholder="Code (optional)"
              value={formState.code}
              onChange={(e) => setFormState((prev) => ({ ...prev, code: e.target.value }))}
            />
            <Input
              type="number"
              min={1}
              max={100}
              placeholder="Discount %"
              value={formState.discountPercent}
              onChange={(e) => setFormState((prev) => ({ ...prev, discountPercent: e.target.value }))}
              required
            />
            <Input
              type="number"
              min={1}
              placeholder="Usage limit"
              value={formState.usageLimit}
              onChange={(e) => setFormState((prev) => ({ ...prev, usageLimit: e.target.value }))}
            />
            <Input
              type="datetime-local"
              value={formState.expiresAt}
              onChange={(e) => setFormState((prev) => ({ ...prev, expiresAt: e.target.value }))}
            />
            <div className="md:col-span-4">
              <Button type="submit" disabled={creatingCoupon}>
                {creatingCoupon ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Create Coupon
              </Button>
            </div>
          </form>

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-700">Existing coupons</h3>
            {loadingCoupons ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            ) : coupons.length === 0 ? (
              <p className="text-sm text-slate-500">No coupons for this course yet.</p>
            ) : (
              <div className="space-y-2">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{coupon.code}</p>
                      <p className="text-slate-500">
                        {coupon.discountPercent}% off · used {coupon.usedCount}
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${coupon.active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                        {coupon.active ? "Active" : "Inactive"}
                      </span>
                      {coupon.active && (
                        <Button variant="outline" size="sm" onClick={() => onDeactivateCoupon(coupon.id)}>
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
