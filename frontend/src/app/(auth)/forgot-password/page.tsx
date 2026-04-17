"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import { authApi } from "@/lib/auth"

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [submittedEmail, setSubmittedEmail] = React.useState("")

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
      showToast('success', 'OTP sent to your email!')
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
          <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg shadow-emerald-500/25">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Check your email
          </h1>
          <p className="text-slate-500 leading-relaxed">
            We&apos;ve sent a 6-digit OTP code to<br />
            <span className="font-medium text-slate-700">{submittedEmail}</span>
          </p>
        </div>

        {/* Continue to reset */}
        <Button onClick={handleContinueToReset} className="w-full h-12">
          <span>Enter OTP code</span>
          <ArrowRight className="w-5 h-5" />
        </Button>

        {/* Instructions */}
        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-2">
          <p>Didn&apos;t receive the email? Check your spam folder or</p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="font-medium text-sky-600 hover:text-sky-700 transition-colors"
          >
            try another email address
          </button>
        </div>

        {/* Back to login */}
        <Link href="/login">
          <Button variant="outline" className="w-full h-12">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to sign in</span>
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
          Forgot password?
        </h1>
        <p className="text-slate-500">
          No worries, we&apos;ll send you a reset code
        </p>
      </div>

      {/* Forgot password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="pl-11"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full h-12" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending code...</span>
            </>
          ) : (
            <>
              <span>Send reset code</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </form>

      {/* Back to login */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to sign in</span>
        </Link>
      </div>
    </div>
  )
}
