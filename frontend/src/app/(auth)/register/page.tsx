"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, Check, X } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { GoogleIcon, GitHubIcon, AppleIcon } from "@/components/icons/social-icons"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/components/auth-context"
import { getErrorMessage } from "@/lib/api-axios"

export default function RegisterPage() {
  const t = useTranslations()
  const router = useRouter()
  const { showToast } = useToast()
  const { register: registerUser } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [socialLoading, setSocialLoading] = React.useState<string | null>(null)

  const registerSchema = z.object({
    name: z.string().min(2, t("auth.validation.nameMinLength")),
    email: z.string().email(t("auth.validation.emailInvalid")),
    password: z
      .string()
      .min(8, t("auth.validation.passwordMinLength"))
      .regex(/[A-Z]/, t("auth.validation.passwordUppercase"))
      .regex(/[a-z]/, t("auth.validation.passwordLowercase"))
      .regex(/[0-9]/, t("auth.validation.passwordNumber")),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: t("auth.validation.acceptTermsRequired"),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("auth.validation.passwordsNoMatch"),
    path: ["confirmPassword"],
  })

  type RegisterFormData = z.infer<typeof registerSchema>

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
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  })

  const password = watch("password")

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      // Parse full name into first and last name
      const nameParts = data.name.trim().split(/\s+/)
      const firstName = nameParts[0]
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
      
      await registerUser(data.email, data.password, firstName, lastName)
      
      showToast('success', t('auth.register.success'))
      // Navigation is handled in useAuth
    } catch (error) {
      const message = getErrorMessage(error)
      showToast('error', message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider)
    try {
      // Social login requires OAuth setup - show coming soon message for now
      showToast('info', `${provider} signup coming soon!`)
    } catch (error) {
      console.error(`${provider} signup error:`, error)
    } finally {
      setSocialLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          {t("auth.register.title")}
        </h1>
        <p className="text-slate-500">
          {t("auth.register.description")}
        </p>
      </div>

      {/* Social login buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-12"
          onClick={() => handleSocialLogin("google")}
          disabled={!!socialLoading}
        >
          {socialLoading === "google" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <GoogleIcon className="w-5 h-5" />
          )}
        </Button>
        <Button
          variant="outline"
          className="h-12"
          onClick={() => handleSocialLogin("github")}
          disabled={!!socialLoading}
        >
          {socialLoading === "github" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <GitHubIcon className="w-5 h-5" />
          )}
        </Button>
        <Button
          variant="outline"
          className="h-12"
          onClick={() => handleSocialLogin("apple")}
          disabled={!!socialLoading}
        >
          {socialLoading === "apple" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <AppleIcon className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50/50 px-3 text-slate-500">
            {t("common.orContinueWithEmail")}
          </span>
        </div>
      </div>

      {/* Register form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="name">{t("auth.register.fullName")}</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="name"
              type="text"
              placeholder={t("auth.register.namePlaceholder")}
              className="pl-11"
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.register.email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder={t("auth.register.emailPlaceholder")}
              className="pl-11"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.register.password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.register.passwordPlaceholder")}
              className="pl-11 pr-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                      "flex items-center gap-1.5 text-xs transition-colors ltr-flex",
                      isMet ? "text-emerald-600" : "text-slate-400"
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
          <Label htmlFor="confirmPassword">{t("auth.register.confirmPassword")}</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("auth.register.confirmPasswordPlaceholder")}
              className="pl-11 pr-11"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms and conditions */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 ltr-flex">
            <Controller
              name="acceptTerms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="acceptTerms"
                  className="mt-0.5"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="acceptTerms" className="text-sm font-normal cursor-pointer leading-snug">
              {t("auth.register.acceptTerms")}{" "}
              <Link href="/terms" className="text-sky-600 hover:text-sky-700 underline underline-offset-2">
                {t("common.termsOfService")}
              </Link>{" "}
              {t("auth.register.and")}{" "}
              <Link href="/privacy" className="text-sky-600 hover:text-sky-700 underline underline-offset-2">
                {t("common.privacyPolicy")}
              </Link>
            </Label>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full h-12" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t("auth.register.creatingAccount")}</span>
            </>
          ) : (
            <>
              <span>{t("common.createAccount")}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </form>

      {/* Sign in link */}
      <p className="text-center text-sm text-slate-500">
        {t("common.alreadyHaveAccount")}{" "}
        <Link
          href="/login"
          className="font-semibold text-sky-600 hover:text-sky-700 transition-colors"
        >
          {t("common.signIn")}
        </Link>
      </p>
    </div>
  )
}
