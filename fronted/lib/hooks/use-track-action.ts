"use client"

import { useCallback } from "react"

import type { DesktopActionInput } from "@/lib/stores/desktop-action-log-store"
import { useDesktopActionLogStore } from "@/lib/stores/desktop-action-log-store"

export function useTrackAction(): (action: DesktopActionInput) => void {
  return useCallback((action: DesktopActionInput) => {
    useDesktopActionLogStore.getState().logAction(action)
  }, [])
}
