"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, PlusCircle, TicketPercent } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("studio.couponManager");
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
        const response = await api.get<{ content: CourseResponse[] } | CourseResponse[]>("/api/courses/mine");
        const list = Array.isArray(response.data) ? response.data : response.data?.content ?? [];
        setCourses(list);
        if (list.length > 0 && list[0].id) {
          setSelectedCourseId(list[0].id);
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
        title: t("toasts.created"),
        description: t("toasts.createdDescription"),
      });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: t("toasts.createFailed"),
        description: extractErrorDetail(error) || t("toasts.createFailedDescription"),
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
        title: t("toasts.deactivateFailed"),
        description: t("toasts.tryAgain"),
      });
    }
  };

  const onDeleteCoupon = async (couponId: number) => {
    try {
      await paymentsBillingApi.deleteCoupon(couponId);
      setCoupons((prev) => prev.filter((coupon) => coupon.id !== couponId));
      toast({ title: t("toasts.deleted") });
    } catch {
      toast({
        variant: "destructive",
        title: t("toasts.deleteFailed"),
        description: t("toasts.tryAgain"),
      });
    }
  };

  if (loadingCourses) {
    return (
      <div className="rounded-xl border border-line-strong bg-surface p-6">
        <Loader2 className="h-5 w-5 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-line-strong bg-surface p-6">
      <div className="mb-4 flex items-center gap-2">
        <TicketPercent className="h-5 w-5 text-brand" />
        <h2 className="text-xl font-semibold text-ink">{t("title")}</h2>
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-ink-3">{t("noCourses")}</p>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-button">{t("courseLabel")}</label>
            <select
              className="flex h-10 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm"
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

          <form onSubmit={onCreateCoupon} className="grid grid-cols-1 gap-3 rounded-lg border border-line p-4 sm:grid-cols-2 md:grid-cols-4">
            <Input
              placeholder={t("codePlaceholder")}
              value={formState.code}
              onChange={(e) => setFormState((prev) => ({ ...prev, code: e.target.value }))}
            />
            <Input
              type="number"
              min={1}
              max={100}
              placeholder={t("discountPlaceholder")}
              value={formState.discountPercent}
              onChange={(e) => setFormState((prev) => ({ ...prev, discountPercent: e.target.value }))}
              required
            />
            <Input
              type="number"
              min={1}
              placeholder={t("usageLimitPlaceholder")}
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
                {creatingCoupon ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <PlusCircle className="me-2 h-4 w-4" />}
                {t("create")}
              </Button>
            </div>
          </form>

          <div>
            <h3 className="mb-2 text-sm font-medium text-ink-button">{t("existing")}</h3>
            {loadingCoupons ? (
              <Loader2 className="h-4 w-4 animate-spin text-ink-3" />
            ) : coupons.length === 0 ? (
              <p className="text-sm text-ink-3">{t("empty")}</p>
            ) : (
              <div className="space-y-2">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="flex flex-col gap-2 rounded-lg border border-line bg-subtle p-3 text-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-ink">{coupon.code}</p>
                      <p className="text-ink-3">
                        {coupon.usageLimit
                          ? t("summaryWithLimit", {
                              percent: coupon.discountPercent,
                              used: coupon.usedCount,
                              limit: coupon.usageLimit,
                            })
                          : t("summary", { percent: coupon.discountPercent, used: coupon.usedCount })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${coupon.active ? "bg-subtle text-brand" : "bg-sand text-ink-2"}`}>
                        {coupon.active ? t("status.active") : t("status.inactive")}
                      </span>
                      {coupon.active && (
                        <Button variant="outline" size="sm" onClick={() => onDeactivateCoupon(coupon.id)}>
                          {t("deactivate")}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="text-danger hover:bg-danger-soft hover:text-danger border-danger-soft" onClick={() => onDeleteCoupon(coupon.id)}>
                        {t("delete")}
                      </Button>
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
