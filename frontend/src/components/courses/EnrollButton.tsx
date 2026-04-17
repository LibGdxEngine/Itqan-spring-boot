"use client";

import { useState, useEffect } from 'react';
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
                const student = await StudentsService.getProfile();
                if (!student.id) return;

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
        return "Please try again.";
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
                title: "Coupon applied",
                description: `${response.discountPercent}% discount has been applied.`,
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
                title: "Invalid coupon",
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
                    title: "Enrollment completed",
                    description: "You are now enrolled in this course.",
                });
                router.push(`/learn/${courseId}`);
                return;
            }

            if (response.checkoutUrl) {
                window.location.href = response.checkoutUrl;
                return;
            }
            throw new Error("Checkout URL is missing.");
        } catch (error) {
            console.error("Checkout failed", error);
            toast({
                title: "Checkout failed",
                description: getErrorDetail(error),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return <Button disabled variant="secondary" className="w-full">Checking...</Button>;
    }

    if (isEnrolled) {
        return (
            <Button 
                variant="outline" 
                className="w-full border-green-500 text-green-600 hover:bg-green-50"
                onClick={() => router.push(`/learn/${courseId}`)}
            >
                <CheckCircle className="mr-2 h-4 w-4" />
                Continue Learning
            </Button>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon}
                >
                    {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                    <span>Original</span>
                    <span>${pricing.originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span>Discount</span>
                    <span>- ${pricing.discountAmount.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between font-semibold text-slate-900">
                    <span>Total</span>
                    <span>${pricing.finalAmount.toFixed(2)}</span>
                </div>
            </div>

            <Button
                className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                onClick={handleCheckout}
                disabled={loading}
            >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {pricing.free ? "Enroll for Free" : "Checkout"}
            </Button>
        </div>
    );
}
