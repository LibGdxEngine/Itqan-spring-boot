"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Smartphone, Wallet, MessageCircle } from "lucide-react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PaymentMethodDialogProps {
    courseTitle: string;
    amount: number;
    couponCode?: string;
}

interface PaymentConfig {
    vodafoneNumber: string;
    instapayNumber: string;
}

export function PaymentMethodDialog({ courseTitle, amount, couponCode }: PaymentMethodDialogProps) {
    const t = useTranslations();
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
        return () => {
            active = false;
        };
    }, []);

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
                <Button className="w-full bg-[#c96442] hover:bg-[#b55836] text-[#faf9f5]">
                    {t("courses.enroll.checkout")}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-[#141413]">{t("courses.payment.title")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Paymob (online) - disabled for now */}
                    <button
                        type="button"
                        disabled
                        className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg border border-[#e8e6dc] bg-[#f5f4ed] p-4 text-start opacity-60"
                    >
                        <CreditCard className="h-6 w-6 shrink-0 text-[#87867f]" />
                        <span className="flex-1 font-medium text-[#141413]">{t("courses.payment.paymob")}</span>
                        <span className="rounded-full bg-[#e8e6dc] px-2 py-0.5 text-xs text-[#5e5d59]">
                            {t("courses.payment.comingSoon")}
                        </span>
                    </button>

                    {/* Vodafone Cash -> WhatsApp */}
                    <button
                        type="button"
                        disabled={!config.vodafoneNumber}
                        onClick={() => openWhatsApp(config.vodafoneNumber, t("courses.payment.vodafoneCash"))}
                        className="flex w-full items-center gap-3 rounded-lg border border-[#e8e6dc] bg-[#faf9f5] p-4 text-start transition-colors hover:border-[#c96442] hover:bg-[#f0eee6] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[#e8e6dc] disabled:hover:bg-[#faf9f5]"
                    >
                        <Smartphone className="h-6 w-6 shrink-0 text-[#c96442]" />
                        <span className="flex-1">
                            <span className="block font-medium text-[#141413]">{t("courses.payment.vodafoneCash")}</span>
                            <span className="block text-xs text-[#87867f]">
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
                        className="flex w-full items-center gap-3 rounded-lg border border-[#e8e6dc] bg-[#faf9f5] p-4 text-start transition-colors hover:border-[#c96442] hover:bg-[#f0eee6] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[#e8e6dc] disabled:hover:bg-[#faf9f5]"
                    >
                        <Wallet className="h-6 w-6 shrink-0 text-[#c96442]" />
                        <span className="flex-1">
                            <span className="block font-medium text-[#141413]">{t("courses.payment.instapay")}</span>
                            <span className="block text-xs text-[#87867f]">
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
