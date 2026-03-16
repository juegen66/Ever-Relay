"use client"

import { useCallback, useEffect, useRef } from "react"

import { logActionBatch } from "@/lib/api/modules/afs"
import type { DesktopActionInput } from "@/lib/stores/desktop-action-log-store"
import { useDesktopActionLogStore } from "@/lib/stores/desktop-action-log-store"

const FLUSH_INTERVAL_MS = 30_000
const MAX_BATCH_SIZE = 50

const pendingActions: { actionType: string; payload: Record<string, unknown>; ts: number }[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function queueForPersistence(action: DesktopActionInput) {
  const { type, ...rest } = action
  pendingActions.push({
    actionType: type,
    payload: rest as Record<string, unknown>,
    ts: Date.now(),
  })

  if (pendingActions.length >= MAX_BATCH_SIZE) {
    void flushPendingActions()
  }
}

async function flushPendingActions() {
  if (pendingActions.length === 0) return

  const batch = pendingActions.splice(0, MAX_BATCH_SIZE)
  try {
    await logActionBatch(batch)
  } catch {
    // Re-queue on failure, capped to prevent unbounded growth
    pendingActions.unshift(...batch.slice(0, MAX_BATCH_SIZE - pendingActions.length))
  }
}

export function useTrackAction(): (action: DesktopActionInput) => void {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    flushTimer = setInterval(() => {
      void flushPendingActions()
    }, FLUSH_INTERVAL_MS)

    const onBeforeUnload = () => {
      void flushPendingActions()
    }
    window.addEventListener("beforeunload", onBeforeUnload)

    return () => {
      if (flushTimer) clearInterval(flushTimer)
      window.removeEventListener("beforeunload", onBeforeUnload)
      void flushPendingActions()
    }
  }, [])

  return useCallback((action: DesktopActionInput) => {
    useDesktopActionLogStore.getState().logAction(action)
    queueForPersistence(action)
  }, [])
}
