"use client"

import * as React from "react"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { MotionConfig } from "framer-motion"

import { AuthProvider } from "@/components/auth-context"
import { ToastProvider } from "@/components/ui/toast"
import { ServiceWorkerRegister } from "@/components/providers/ServiceWorkerRegister"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const tree = (
    // reducedMotion="user": framer animations honour the OS "reduce motion" setting site-wide.
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorkerRegister />
      </AuthProvider>
    </MotionConfig>
  )

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
  }

  return tree
}
