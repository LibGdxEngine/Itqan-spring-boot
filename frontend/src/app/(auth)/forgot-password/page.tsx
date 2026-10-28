"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import { authApi } from "@/lib/auth"

export default function ForgotPasswordPage() {
  const t = useTranslations()
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [submittedEmail, setSubmittedEmail] = React.useState("")

  const forgotPasswordSchema = z.object({
    email: z.string().email(t("auth.validation.emailInvalid")),
  })

  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await authApi.forgotPassword({ email: data.email })
      setSubmittedEmail(data.email)
      setIsSubmitted(true)
      showToast('success', t('auth.forgotPassword.otpSentToast'))
    } catch (error) {
      // Still show success to prevent email enumeration, but log error
      console.error("Forgot password error:", error)
      setSubmittedEmail(data.email)
      setIsSubmitted(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueToReset = () => {
    router.push(`/reset-password?email=${encodeURIComponent(submittedEmail)}`)
  }

  if (isSubmitted) {
    return (
      <div className="space-y-8 text-center">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-brand rounded-full shadow-[0_0_0_1px_var(--color-ring-warm)]">
            <CheckCircle2 className="w-12 h-12 text-on-night" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {t("auth.forgotPassword.checkEmailTitle")}
          </h1>
          <p className="text-ink-3 leading-relaxed">
            {t("auth.forgotPassword.sentCodeTo")}<br />
            <span className="font-medium text-ink-button">{submittedEmail}</span>
          </p>
        </div>

        {/* Continue to reset */}
        <Button onClick={handleContinueToReset} className="w-full h-12">
          <span>{t("auth.forgotPassword.enterOtp")}</span>
          <ArrowRight className="w-5 h-5" />
        </Button>

        {/* Instructions */}
        <div className="bg-subtle rounded-xl p-4 text-sm text-ink-2 space-y-2">
          <p>{t("auth.forgotPassword.didntReceive")}</p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="font-medium text-brand hover:text-brand-hover transition-colors"
          >
            {t("auth.forgotPassword.tryAnotherEmail")}
          </button>
        </div>

        {/* Back to login */}
        <Link href="/login">
          <Button variant="outline" className="w-full h-12">
            <ArrowLeft className="w-5 h-5" />
            <span>{t("auth.forgotPassword.backToSignIn")}</span>
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl tracking-tight text-ink" style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}>
          {t("auth.forgotPassword.title")}
        </h1>
        <p className="text-ink-3">
          {t("auth.forgotPassword.description")}
        </p>
      </div>

      {/* Forgot password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.forgotPassword.email")}</Label>
          <div className="relative">
            <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-3" />
            <Input
              id="email"
              type="email"
              placeholder={t("auth.forgotPassword.emailPlaceholder")}
              className="ps-11"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-danger">{errors.email.message}</p>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full h-12" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t("auth.forgotPassword.sending")}</span>
            </>
          ) : (
            <>
              <span>{t("auth.forgotPassword.sendCode")}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </form>

      {/* Back to login */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-3 hover:text-ink-button transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("auth.forgotPassword.backToSignIn")}</span>
        </Link>
      </div>
    </div>
  )
}
