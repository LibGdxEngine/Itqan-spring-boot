"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Eye, EyeOff, Lock, ArrowRight, Loader2, CheckCircle2, Check, X, KeyRound } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { authApi } from "@/lib/auth"
import { getErrorMessage } from "@/lib/api-axios"

function ResetPasswordContent() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const { showToast } = useToast()

  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const resetPasswordSchema = z.object({
    otp: z.string().length(6, t("auth.validation.otpLength")).regex(/^[0-9]+$/, t("auth.validation.otpDigits")),
    password: z
      .string()
      .min(8, t("auth.validation.passwordMinLength"))
      .regex(/[A-Z]/, t("auth.validation.passwordUppercase"))
      .regex(/[a-z]/, t("auth.validation.passwordLowercase"))
      .regex(/[0-9]/, t("auth.validation.passwordNumber")),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("auth.validation.passwordsNoMatch"),
    path: ["confirmPassword"],
  })

  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

  const passwordRequirements = [
    { regex: /.{8,}/, label: t("auth.register.passwordRequirements.minLength") },
    { regex: /[A-Z]/, label: t("auth.register.passwordRequirements.uppercase") },
    { regex: /[a-z]/, label: t("auth.register.passwordRequirements.lowercase") },
    { regex: /[0-9]/, label: t("auth.register.passwordRequirements.number") },
  ]

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otp: "",
      password: "",
      confirmPassword: "",
    },
  })

  const password = watch("password")

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!email) return

    setIsLoading(true)
    try {
      // First verify the OTP
      const verifyResult = await authApi.verifyOtp({ email, otp: data.otp })

      if (!verifyResult.valid) {
        showToast('error', t('auth.resetPassword.invalidOtpToast'))
        setIsLoading(false)
        return
      }

      // Then reset the password
      await authApi.resetPassword({
        email,
        otp: data.otp,
        newPassword: data.password,
      })

      setIsSubmitted(true)
      showToast('success', t('auth.resetPassword.successToast'))
    } catch (error) {
      const message = getErrorMessage(error)
      showToast('error', message)
    } finally {
      setIsLoading(false)
    }
  }

  // Check if email is provided
  if (!email) {
    return (
      <div className="space-y-8 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-red-500 rounded-full shadow-[0_0_0_1px_#d1cfc5]">
            <X className="w-12 h-12 text-[#faf9f5]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#141413]">
            {t("auth.resetPassword.missingEmailTitle")}
          </h1>
          <p className="text-[#87867f]">
            {t("auth.resetPassword.missingEmailDescription")}
          </p>
        </div>

        <Link href="/forgot-password">
          <Button className="w-full h-12">
            <span>{t("auth.resetPassword.requestReset")}</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="space-y-8 text-center">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-[#c96442] rounded-full shadow-[0_0_0_1px_#d1cfc5]">
            <CheckCircle2 className="w-12 h-12 text-[#faf9f5]" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#141413]">
            {t("auth.resetPassword.successTitle")}
          </h1>
          <p className="text-[#87867f]">
            {t("auth.resetPassword.successLine1")}<br />
            {t("auth.resetPassword.successLine2")}
          </p>
        </div>

        {/* Continue to login */}
        <Link href="/login">
          <Button className="w-full h-12">
            <span>{t("auth.resetPassword.continueToSignIn")}</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#141413]">
          {t("auth.resetPassword.title")}
        </h1>
        <p className="text-[#87867f]">
          {t.rich("auth.resetPassword.description", {
            email,
            mark: (chunks) => <span className="font-medium text-[#4d4c48]">{chunks}</span>,
          })}
        </p>
      </div>

      {/* Reset password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* OTP field */}
        <div className="space-y-2">
          <Label htmlFor="otp">{t("auth.resetPassword.otpLabel")}</Label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87867f]" />
            <Input
              id="otp"
              type="text"
              placeholder={t("auth.resetPassword.otpPlaceholder")}
              className="pl-11 text-center tracking-widest font-mono text-lg"
              maxLength={6}
              {...register("otp")}
            />
          </div>
          {errors.otp && (
            <p className="text-sm text-red-500">{errors.otp.message}</p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.resetPassword.newPassword")}</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87867f]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.resetPassword.passwordPlaceholder")}
              className="pl-11 pr-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#87867f] hover:text-[#5e5d59] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password requirements */}
          {password && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {passwordRequirements.map((req, i) => {
                const isMet = req.regex.test(password)
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-1.5 text-xs transition-colors",
                      isMet ? "text-[#c96442]" : "text-[#87867f]"
                    )}
                  >
                    {isMet ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    <span>{req.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Confirm Password field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("auth.resetPassword.confirmNewPassword")}</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87867f]" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("auth.resetPassword.confirmPlaceholder")}
              className="pl-11 pr-11"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#87867f] hover:text-[#5e5d59] transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full h-12" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t("auth.resetPassword.resetting")}</span>
            </>
          ) : (
            <>
              <span>{t("auth.resetPassword.resetButton")}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </form>

      {/* Back to forgot password */}
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-[#87867f] hover:text-[#4d4c48] transition-colors"
        >
          {t("auth.resetPassword.didntReceiveCode")}
        </Link>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <div className="h-9 w-48 mx-auto bg-[#e8e6dc] rounded animate-pulse" />
        <div className="h-5 w-72 mx-auto bg-[#f0eee6] rounded animate-pulse" />
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-[#f0eee6] rounded animate-pulse" />
          <div className="h-11 w-full bg-[#f0eee6] rounded-xl animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-[#f0eee6] rounded animate-pulse" />
          <div className="h-11 w-full bg-[#f0eee6] rounded-xl animate-pulse" />
        </div>
        <div className="h-12 w-full bg-[#e8e6dc] rounded-xl animate-pulse" />
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </React.Suspense>
  )
}
