import type { ReactNode } from "react"

export type ToastVariant = "default" | "destructive"

export interface ToastStateProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: ToastVariant
}

export type ToastActionElement = ReactNode
