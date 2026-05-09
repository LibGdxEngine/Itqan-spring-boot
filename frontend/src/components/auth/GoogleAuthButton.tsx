"use client"

import * as React from "react"
import { GoogleLogin } from "@react-oauth/google"
import { useTranslations } from "next-intl"

import { useAuth } from "@/components/auth-context"
import { useToast } from "@/components/ui/toast"

interface GoogleAuthButtonProps {
  onSuccess?: () => void
  text?: "signin_with" | "signup_with" | "continue_with"
}

export function GoogleAuthButton({ onSuccess, text = "continue_with" }: GoogleAuthButtonProps) {
  const t = useTranslations()
  const { showToast } = useToast()
  const { loginWithGoogle } = useAuth()

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      showToast("error", t("auth.google.failed"))
      return
    }
    try {
      await loginWithGoogle(credentialResponse.credential)
      showToast("success", t("auth.login.success"))
      onSuccess?.()
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : t("auth.google.failed"),
      )
    }
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => showToast("error", t("auth.google.failed"))}
        useOneTap={false}
        text={text}
        width={320}
      />
    </div>
  )
}
