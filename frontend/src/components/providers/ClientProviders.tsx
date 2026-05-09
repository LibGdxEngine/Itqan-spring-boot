"use client"

import * as React from "react"
import { GoogleOAuthProvider } from "@react-oauth/google"

import { AuthProvider } from "@/components/auth-context"
import { ToastProvider } from "@/components/ui/toast"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const tree = (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  )

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
  }

  return tree
}
