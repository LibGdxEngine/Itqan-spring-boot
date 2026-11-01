"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { CreditCard, Loader2, MessageCircle, Smartphone, Wallet } from "lucide-react"

import { PublicPage } from "@/components/layout/PublicPage"
import { FormField, formatMoney } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/api-axios"
import { donationsApi } from "@/lib/scholarships-api"
import { useSiteSettings } from "@/lib/use-site-currency"

const PRESETS = [100, 250, 500, 1000, 2500]
const MIN_AMOUNT = 10

interface PaymentConfig {
  vodafoneNumber: string
  instapayNumber: string
}

export default function DonateClient() {
  const t = useTranslations("scholarships.donate")
  const locale = useLocale()
  const { toast } = useToast()
  const settings = useSiteSettings()
  const currency = settings.defaultCurrency || "EGP"
  const onlineEnabled = settings.cardPaymentsEnabled === "true"
  const manualEnabled = settings.manualPaymentsEnabled !== "false"

  const [amount, setAmount] = React.useState<number>(250)
  const [custom, setCustom] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [name, setName] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [redirecting, setRedirecting] = React.useState(false)
  const [config, setConfig] = React.useState<PaymentConfig>({ vodafoneNumber: "", instapayNumber: "" })

  React.useEffect(() => {
    let active = true
    fetch("/api/payment-config")
      .then((res) => res.json())
      .then((data: PaymentConfig) => active && setConfig(data))
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  const finalAmount = custom ? Number(custom) : amount
  const amountValid = Number.isFinite(finalAmount) && finalAmount >= MIN_AMOUNT
  const money = (value: number) => formatMoney(value, currency, locale)

  const payOnline = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!amountValid || !email.trim()) return
    setRedirecting(true)
    try {
      const response = await donationsApi.checkout({
        amount: finalAmount,
        donorEmail: email.trim(),
        donorName: name.trim() || undefined,
        message: message.trim() || undefined,
      })
      window.location.assign(response.checkoutUrl)
    } catch (error) {
      setRedirecting(false)
      toast({ variant: "destructive", title: t("failed"), description: getErrorMessage(error) })
    }
  }

  const openWhatsApp = (number: string, method: string) => {
    if (!number || !amountValid) return
    const text = t("whatsappMessage", { amount: money(finalAmount), method })
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")
  }

  const manualButton =
    "flex w-full items-center gap-3 rounded-lg border border-line-strong bg-surface p-4 text-start transition-colors hover:border-brand hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line-strong disabled:hover:bg-surface"

  return (
    <PublicPage>
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-28 sm:px-6">
        <Link href="/scholarships" className="text-sm text-brand hover:underline">
          {t("back")}
        </Link>
        <h1 className="mt-3 text-3xl text-ink sm:text-4xl" style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}>
          {t("title")}
        </h1>
        <p className="mt-3 leading-relaxed text-ink-2">{t("intro")}</p>

        <form onSubmit={(e) => void payOnline(e)} className="mt-8 space-y-6 rounded-xl border border-line bg-surface p-6">
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-ink">{t("amount")}</legend>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={!custom && amount === value}
                  onClick={() => {
                    setAmount(value)
                    setCustom("")
                  }}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    !custom && amount === value
                      ? "border-brand bg-brand text-on-night"
                      : "border-line-strong bg-paper text-ink hover:border-brand",
                  )}
                >
                  <span dir="ltr">{money(value)}</span>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <FormField label={t("customAmount")} htmlFor="don-custom" hint={t("minAmount", { min: money(MIN_AMOUNT) })}>
                <Input
                  id="don-custom"
                  type="number"
                  inputMode="decimal"
                  min={MIN_AMOUNT}
                  step="1"
                  dir="ltr"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                />
              </FormField>
            </div>
          </fieldset>

          {onlineEnabled ? (
            <>
              <FormField label={t("email")} htmlFor="don-email" hint={t("emailHint")}>
                <Input id="don-email" type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </FormField>
              <FormField label={t("name")} htmlFor="don-name" hint={t("nameHint")}>
                <Input id="don-name" maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label={t("message")} htmlFor="don-message">
                <Textarea id="don-message" rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />
              </FormField>
              <Button type="submit" className="w-full" disabled={redirecting || !amountValid || !email.trim()}>
                {redirecting ? <Loader2 className="animate-spin" /> : <CreditCard />}
                {t("payOnline", { amount: amountValid ? money(finalAmount) : "" })}
              </Button>
              <p className="text-center text-xs text-ink-3">{t("paymobNote")}</p>
            </>
          ) : null}

          {manualEnabled ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink">{onlineEnabled ? t("orManual") : t("manualTitle")}</p>
              <button
                type="button"
                className={manualButton}
                disabled={!config.vodafoneNumber || !amountValid}
                onClick={() => openWhatsApp(config.vodafoneNumber, t("vodafoneCash"))}
              >
                <Smartphone className="h-6 w-6 shrink-0 text-brand" />
                <span className="flex-1 font-medium text-ink">{t("vodafoneCash")}</span>
                <MessageCircle className="h-5 w-5 shrink-0 text-[#25D366]" />
              </button>
              <button
                type="button"
                className={manualButton}
                disabled={!config.instapayNumber || !amountValid}
                onClick={() => openWhatsApp(config.instapayNumber, t("instapay"))}
              >
                <Wallet className="h-6 w-6 shrink-0 text-brand" />
                <span className="flex-1 font-medium text-ink">{t("instapay")}</span>
                <MessageCircle className="h-5 w-5 shrink-0 text-[#25D366]" />
              </button>
              <p className="text-xs text-ink-3">{t("manualHint")}</p>
            </div>
          ) : null}

          {!onlineEnabled && !manualEnabled ? <p className="text-sm text-ink-2">{t("unavailable")}</p> : null}
        </form>

        <p className="mt-6 text-sm leading-relaxed text-ink-3">{t("privacy")}</p>
      </div>
    </PublicPage>
  )
}
