"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-context';
import { useRouter } from 'next/navigation';
import { EnrollmentsService, StudentsService } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast'; // Assuming it exists
import { Loader2, CheckCircle } from 'lucide-react';
import { paymentsBillingApi } from '@/lib/payments-billing';
import { Input } from '@/components/ui/input';

interface EnrollButtonProps {
    courseId: number;
    coursePrice: number;
}

export function EnrollButton({ courseId, coursePrice }: EnrollButtonProps) {
    const { isAuthenticated, token } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const t = useTranslations();
    const [loading, setLoading] = useState(false);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>(undefined);
    const [pricing, setPricing] = useState({
        originalAmount: coursePrice,
        discountAmount: 0,
        finalAmount: coursePrice,
        free: coursePrice === 0,
    });

    useEffect(() => {
        const checkStatus = async () => {
            if (!isAuthenticated || !token) {
                setInitializing(false);
                return;
            }

            try {
                // First get student profile to get ID
                // Optimization: Store studentId in AuthContext or cache it
                const student = await StudentsService.getProfile().catch(() => null);
                if (!student?.id) return;

                const enrolled = await EnrollmentsService.checkEnrollment(student.id, courseId);
                setIsEnrolled(enrolled);
            } catch (error) {
                console.error("Failed to check enrollment", error);
            } finally {
                setInitializing(false);
            }
        };

        checkStatus();
    }, [isAuthenticated, token, courseId]);

    useEffect(() => {
        if (!couponCode.trim()) {
            setAppliedCouponCode(undefined);
            setPricing({
                originalAmount: coursePrice,
                discountAmount: 0,
                finalAmount: coursePrice,
                free: coursePrice === 0,
            });
        }
    }, [couponCode, coursePrice]);

    const getErrorDetail = (error: unknown): string => {
        if (typeof error === "object" && error !== null) {
            const maybeError = error as {
                response?: {
                    data?: {
                        detail?: unknown;
                    };
                };
                message?: unknown;
            };
            const detail = maybeError?.response?.data?.detail;
            if (typeof detail === "string" && detail.trim().length > 0) {
                return detail;
            }
            const message = maybeError?.message;
            if (typeof message === "string" && message.trim().length > 0) {
                return message;
            }
        }
        return t('courses.enroll.tryAgain');
    };

    const handleApplyCoupon = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/courses/${courseId}`);
            return;
        }

        if (!couponCode.trim()) {
            setAppliedCouponCode(undefined);
            setPricing({
                originalAmount: coursePrice,
                discountAmount: 0,
                finalAmount: coursePrice,
                free: coursePrice === 0,
            });
            return;
        }

        setValidatingCoupon(true);
        try {
            const response = await paymentsBillingApi.validateCoupon({
                courseId,
                couponCode: couponCode.trim(),
            });
            setAppliedCouponCode(response.couponCode || couponCode.trim());
            setPricing({
                originalAmount: response.originalAmount,
                discountAmount: response.discountAmount,
                finalAmount: response.finalAmount,
                free: response.free,
            });
            toast({
                title: t('courses.enroll.couponApplied'),
                description: t('courses.enroll.couponAppliedDesc', { percent: response.discountPercent }),
            });
        } catch (error) {
            setAppliedCouponCode(undefined);
            setPricing({
                originalAmount: coursePrice,
                discountAmount: 0,
                finalAmount: coursePrice,
                free: coursePrice === 0,
            });
            toast({
                title: t('courses.enroll.invalidCoupon'),
                description: getErrorDetail(error),
                variant: "destructive",
            });
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/courses/${courseId}`);
            return;
        }

        setLoading(true);
        try {
            const response = await paymentsBillingApi.createCheckoutSession({
                courseId,
                couponCode: appliedCouponCode || undefined,
            });

            if (response.mode === "FREE_ENROLLED") {
                setIsEnrolled(true);
                toast({
                    title: t('courses.enroll.enrollmentCompleted'),
                    description: t('courses.enroll.enrollmentCompletedDesc'),
                });
                router.push(`/learn/${courseId}`);
                return;
            }

            if (response.checkoutUrl) {
                window.location.href = response.checkoutUrl;
                return;
            }
            throw new Error(t('courses.enroll.checkoutUrlMissing'));
        } catch (error) {
            console.error("Checkout failed", error);
            toast({
                title: t('courses.enroll.checkoutFailed'),
                description: getErrorDetail(error),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return <Button disabled variant="secondary" className="w-full">{t('courses.enroll.checking')}</Button>;
    }

    if (isEnrolled) {
        return (
            <Button 
                variant="outline" 
                className="w-full border-[#c96442] text-[#c96442] hover:bg-[#f0eee6]"
                onClick={() => router.push(`/learn/${courseId}`)}
            >
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('courses.enroll.continueLearning')}
            </Button>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Input
                    placeholder={t('courses.enroll.couponPlaceholder')}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="text-[#141413]"
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon}
                >
                    {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : t('courses.enroll.apply')}
                </Button>
            </div>

            <div className="rounded-lg border border-[#e8e6dc] p-3 text-sm text-[#4d4c48]">
                <div className="flex items-center justify-between">
                    <span>{t('courses.enroll.original')}</span>
                    <span>${pricing.originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span>{t('courses.enroll.discount')}</span>
                    <span>- ${pricing.discountAmount.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between font-semibold text-[#141413]">
                    <span>{t('courses.enroll.total')}</span>
                    <span>${pricing.finalAmount.toFixed(2)}</span>
                </div>
            </div>

            <Button
                className="w-full bg-[#c96442] hover:bg-[#b55836] text-[#faf9f5]"
                onClick={handleCheckout}
                disabled={loading}
            >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {pricing.free ? t('courses.enroll.enrollFree') : t('courses.enroll.checkout')}
            </Button>
        </div>
    );
}
