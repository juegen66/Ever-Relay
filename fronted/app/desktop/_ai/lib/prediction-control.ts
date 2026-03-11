"use client"

import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { usePredictionStore } from "@/lib/stores/prediction-store"

const PREDICTION_TRIGGER_DEBOUNCE_MS = 1000

export function queueDesktopPredictionRun() {
  const state = useDesktopAgentStore.getState()
  const now = Date.now()

  if (state.silentRunning) {
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
