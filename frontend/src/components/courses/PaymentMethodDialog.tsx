"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CreditCard, Smartphone, Wallet, MessageCircle, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { getErrorMessage } from "@/lib/api-axios";
import { StudentsService } from "@/lib/api";
import { paymentsBillingApi } from "@/lib/payments-billing";

interface PaymentMethodDialogProps {
    courseId: number;
    courseTitle: string;
    amount: number;
    couponCode?: string;
}

interface PaymentConfig {
    vodafoneNumber: string;
    instapayNumber: string;
}

export function PaymentMethodDialog({ courseId, courseTitle, amount, couponCode }: PaymentMethodDialogProps) {
    const t = useTranslations();
    const router = useRouter();
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();
    // Online payment is offered once the EasyKash credentials are set on the server.
    const [onlineEnabled, setOnlineEnabled] = useState(false);
    const [phone, setPhone] = useState("");
    const [redirecting, setRedirecting] = useState(false);
    const [config, setConfig] = useState<PaymentConfig>({ vodafoneNumber: "", instapayNumber: "" });

    useEffect(() => {
        let active = true;
        fetch("/api/payment-config")
            .then((res) => res.json())
            .then((data: PaymentConfig) => {
                if (active) setConfig(data);
            })
            .catch(() => {
                // Numbers stay empty -> manual options render disabled.
            });
        paymentsBillingApi.getPaymentOptions()
            .then((options) => {
                if (active) setOnlineEnabled(options.easykashEnabled);
            })
            .catch(() => {
                // Stays disabled.
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        let active = true;
        StudentsService.getProfile()
            .then((profile) => {
                if (active && profile.phoneNumber) setPhone((current) => current || profile.phoneNumber || "");
            })
            .catch(() => {
                // The student just types the number.
            });
        return () => {
            active = false;
        };
    }, [isAuthenticated]);

    const payOnline = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/courses/${courseId}`);
            return;
        }
        if (!phone.trim()) {
            toast({ variant: "destructive", title: t("courses.payment.mobileRequired") });
            return;
        }
        setRedirecting(true);
        try {
            const response = await paymentsBillingApi.createEasyKashCheckout({
                courseId,
                couponCode: couponCode || undefined,
                phone: phone.trim(),
            });
            if (response.mode === "FREE_ENROLLED") {
                router.push(`/learn/${courseId}`);
                return;
            }
            if (response.checkoutUrl) {
                window.location.assign(response.checkoutUrl);
                return;
            }
            throw new Error("Missing checkout URL");
        } catch (error) {
            setRedirecting(false);
            toast({ variant: "destructive", title: t("courses.payment.onlineFailed"), description: getErrorMessage(error) });
        }
    };

    const openWhatsApp = (number: string, method: string) => {
        if (!number) return;
        const base = t("courses.payment.whatsappMessage", {
            course: courseTitle,
            amount: amount.toFixed(2),
            method,
        });
        const text = couponCode
            ? base + t("courses.payment.whatsappCoupon", { coupon: couponCode })
            : base;
        const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full bg-brand hover:bg-brand-hover text-on-night">
                    {t("courses.enroll.checkout")}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-ink">{t("courses.payment.title")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {/* EasyKash (card, wallet, Meeza, cash...) */}
                    {onlineEnabled ? (
                        <div className="space-y-1">
                            <label htmlFor="easykash-mobile" className="block text-sm font-medium text-ink">
                                {t("courses.payment.mobileLabel")}
                            </label>
                            <Input
                                id="easykash-mobile"
                                type="tel"
                                dir="ltr"
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="01012345678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="text-ink"
                            />
                        </div>
                    ) : null}
                    <button
                        type="button"
                        disabled={!onlineEnabled || redirecting}
                        onClick={() => void payOnline()}
                        className="flex w-full items-center gap-3 rounded-lg border border-line-strong bg-surface p-4 text-start transition-colors hover:border-brand hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line-strong disabled:hover:bg-surface"
                    >
                        <CreditCard className="h-6 w-6 shrink-0 text-brand" />
                        <span className="flex-1">
                            <span className="block font-medium text-ink">{t("courses.payment.online")}</span>
                            <span className="block text-xs text-ink-3">{t("courses.payment.onlineHint")}</span>
                        </span>
                        {redirecting ? (
                            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand" />
                        ) : !onlineEnabled ? (
                            <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-ink-2">
                                {t("courses.payment.comingSoon")}
                            </span>
                        ) : null}
                    </button>

                    {/* Vodafone Cash -> WhatsApp */}
                    <button
                        type="button"
                        disabled={!config.vodafoneNumber}
                        onClick={() => openWhatsApp(config.vodafoneNumber, t("courses.payment.vodafoneCash"))}
                        className="flex w-full items-center gap-3 rounded-lg border border-line-strong bg-surface p-4 text-start transition-colors hover:border-brand hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line-strong disabled:hover:bg-surface"
                    >
                        <Smartphone className="h-6 w-6 shrink-0 text-brand" />
                        <span className="flex-1">
                            <span className="block font-medium text-ink">{t("courses.payment.vodafoneCash")}</span>
                            <span className="block text-xs text-ink-3">
                                {config.vodafoneNumber ? t("courses.payment.viaWhatsapp") : t("courses.payment.numberMissing")}
                            </span>
                        </span>
                        <MessageCircle className="h-5 w-5 shrink-0 text-[#25D366]" />
                    </button>

                    {/* InstaPay -> WhatsApp */}
                    <button
                        type="button"
                        disabled={!config.instapayNumber}
                        onClick={() => openWhatsApp(config.instapayNumber, t("courses.payment.instapay"))}
                        className="flex w-full items-center gap-3 rounded-lg border border-line-strong bg-surface p-4 text-start transition-colors hover:border-brand hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line-strong disabled:hover:bg-surface"
                    >
                        <Wallet className="h-6 w-6 shrink-0 text-brand" />
                        <span className="flex-1">
                            <span className="block font-medium text-ink">{t("courses.payment.instapay")}</span>
                            <span className="block text-xs text-ink-3">
                                {config.instapayNumber ? t("courses.payment.viaWhatsapp") : t("courses.payment.numberMissing")}
                            </span>
                        </span>
                        <MessageCircle className="h-5 w-5 shrink-0 text-[#25D366]" />
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
