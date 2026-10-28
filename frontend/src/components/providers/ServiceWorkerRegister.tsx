"use client"

import { useEffect } from "react"

/** Registers /sw.js in production builds only (it would cache dev assets otherwise). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => undefined)
    if (document.readyState === "complete") register()
    else window.addEventListener("load", register, { once: true })
  }, [])
  return null
}
