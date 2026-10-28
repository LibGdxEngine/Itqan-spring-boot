"use client"

import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RetryButton({ label }: { label: string }) {
  return (
    <Button className="mt-8" onClick={() => window.location.reload()}>
      <RotateCcw /> {label}
    </Button>
  )
}
