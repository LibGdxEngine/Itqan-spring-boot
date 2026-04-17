"use client";

import { useToast as useToastContext } from "./toast";

type ToastVariant = "default" | "destructive";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export function useToast() {
  const { showToast } = useToastContext();

  const toast = ({ title, description, variant }: ToastOptions) => {
    const message = description ? `${title}: ${description}` : title;
    showToast(variant === "destructive" ? "error" : "success", message);
  };

  return { toast };
}
