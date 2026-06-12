"use client"

import * as React from "react"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/components/auth-context"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID


export default function LoginPage() {
  const t = useTranslations()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const loginSchema = z.object({
    email: z.string().email(t("auth.validation.emailInvalid")),
    password: z.string().min(8, t("auth.validation.passwordMinLength")),
    rememberMe: z.boolean().optional(),
  })

  type LoginFormData = z.infer<typeof loginSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      showToast('success', t('auth.login.success'))
    } catch (error) {
       showToast('error', error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1
          className="text-3xl tracking-tight text-[#141413]"
          style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
        >
          {t("auth.login.title")}
        </h1>
        <p className="text-[#87867f]">
          {t("auth.login.description")}
        </p>
      </div>

      {/* Google sign-in (only when configured) */}
      {GOOGLE_CLIENT_ID && (
        <>
          <GoogleAuthButton text="signin_with" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#f5f4ed] px-3 text-[#87867f]">
                {t("common.orContinueWithEmail")}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Login form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.login.email")}</Label>
          <div className="relative">
            <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87867f]" />
            <Input
              id="email"
              type="email"
              placeholder={t("auth.login.emailPlaceholder")}
              className="ps-11"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between ltr-flex">
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#c96442] hover:text-[#b55836] transition-colors"
            >
              {t("common.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#87867f]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.login.passwordPlaceholder")}
              className="ps-11 pe-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[#87867f] hover:text-[#5e5d59] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2 ltr-flex">
          <Checkbox id="rememberMe" {...register("rememberMe")} />
          <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
            {t("common.rememberMe")}
          </Label>
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full h-12" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t("auth.login.signingIn")}</span>
            </>
          ) : (
            <>
              <span>{t("common.signIn")}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </form>

      {/* Sign up link */}
      <p className="text-center text-sm text-[#87867f]">
        {t("common.dontHaveAccount")}{" "}
        <Link
          href="/register"
          className="font-semibold text-[#c96442] hover:text-[#b55836] transition-colors"
        >
          {t("common.createAccount")}
        </Link>
      </p>
    </div>
  )
}
