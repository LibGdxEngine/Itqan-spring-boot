"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Eye, EyeOff, Lock, ArrowRight, Loader2, CheckCircle2, Check, X, KeyRound } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { authApi } from "@/lib/auth"
import { getErrorMessage } from "@/lib/api-axios"

const resetPasswordSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^[0-9]+$/, "OTP must contain only digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

const passwordRequirements = [
  { regex: /.{8,}/, label: "At least 8 characters" },
  { regex: /[A-Z]/, label: "One uppercase letter" },
  { regex: /[a-z]/, label: "One lowercase letter" },
  { regex: /[0-9]/, label: "One number" },
]

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const { showToast } = useToast()
  
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)

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
        showToast('error', 'Invalid OTP code. Please try again.')
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
      showToast('success', 'Password reset successful!')
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
          <div className="p-4 bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg shadow-red-500/25">
            <X className="w-12 h-12 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Missing email
          </h1>
          <p className="text-slate-500">
            Please request a password reset first.
          </p>
        </div>

        <Link href="/forgot-password">
          <Button className="w-full h-12">
            <span>Request password reset</span>
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
          <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg shadow-emerald-500/25">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Password reset successful
          </h1>
          <p className="text-slate-500">
            Your password has been successfully reset.<br />
            You can now sign in with your new password.
          </p>
        </div>

        {/* Continue to login */}
        <Link href="/login">
          <Button className="w-full h-12">
            <span>Continue to sign in</span>
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
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Set new password
        </h1>
        <p className="text-slate-500">
          Enter the OTP code sent to <span className="font-medium text-slate-700">{email}</span>
        </p>
      </div>

      {/* Reset password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* OTP field */}
        <div className="space-y-2">
          <Label htmlFor="otp">OTP Code</Label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
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
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
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
                      "flex items-center gap-1.5 text-xs transition-colors",
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
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
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

        {/* Submit button */}
        <Button type="submit" className="w-full h-12" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Resetting password...</span>
            </>
          ) : (
            <>
              <span>Reset password</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </form>

      {/* Back to forgot password */}
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          Didn&apos;t receive the code? Request again
        </Link>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <div className="h-9 w-48 mx-auto bg-slate-200 rounded animate-pulse" />
        <div className="h-5 w-72 mx-auto bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
          <div className="h-11 w-full bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
          <div className="h-11 w-full bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="h-12 w-full bg-slate-200 rounded-xl animate-pulse" />
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
