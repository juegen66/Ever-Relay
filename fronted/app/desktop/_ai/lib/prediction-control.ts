"use client"

import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { usePredictionStore } from "@/lib/stores/prediction-store"

export const PREDICTION_INTERVAL_MS = 5 * 60 * 1000
const PREDICTION_TRIGGER_DEBOUNCE_MS = 1000

interface QueueDesktopPredictionRunOptions {
  force?: boolean
}

export function queueDesktopPredictionRun(options?: QueueDesktopPredictionRunOptions) {
  const state = useDesktopAgentStore.getState()
  const now = Date.now()
  const force = options?.force ?? false

  if (state.silentRunning) {
    return false
  }

  if (
    !force &&
    state.silentLastStartedAt !== null &&
    now - state.silentLastStartedAt < PREDICTION_INTERVAL_MS
  ) {
    return false
  }

  if (
    state.silentLastStartedAt !== null &&
    now - state.silentLastStartedAt < PREDICTION_TRIGGER_DEBOUNCE_MS
  ) {
    return false
  }

  usePredictionStore.getState().setLoading(true)
  state.queueSilentPredictionRun()
  return true
}
