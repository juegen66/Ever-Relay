"use client"

import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { usePredictionStore } from "@/lib/stores/prediction-store"
import {
  DESKTOP_PREDICTION_ENDPOINT,
  PREDICTION_AGENT_ID,
} from "@/shared/copilot/constants"

export const PREDICTION_INTERVAL_MS = 5 * 60 * 1000
const PREDICTION_TRIGGER_DEBOUNCE_MS = 1000

interface QueueDesktopPredictionRunOptions {
  force?: boolean
}

export type QueueDesktopPredictionRunResult =
  | "started"
  | "restarted"
  | "running"
  | "skipped"

interface StopPredictionRunResponse {
  stopped?: boolean
  message?: string
}

let predictionTransition: Promise<void> = Promise.resolve()

export function __resetPredictionControlForTests() {
  predictionTransition = Promise.resolve()
}

function shouldSkipPredictionRun(force: boolean) {
  const state = useDesktopAgentStore.getState()
  const now = Date.now()

  if (!force && state.silentRunning) {
    return true
  }

  if (
    !force &&
    state.silentLastStartedAt !== null &&
    now - state.silentLastStartedAt < PREDICTION_INTERVAL_MS
  ) {
    return true
  }

  if (
    !force &&
    state.silentLastStartedAt !== null &&
    now - state.silentLastStartedAt < PREDICTION_TRIGGER_DEBOUNCE_MS
  ) {
    return true
  }

  return false
}

async function stopDesktopPredictionRun(threadId: string) {
  const url = `${DESKTOP_PREDICTION_ENDPOINT}/agent/${PREDICTION_AGENT_ID}/stop/${encodeURIComponent(threadId)}`

  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
    })

    const payload = (await response.json().catch(() => null)) as StopPredictionRunResponse | null

    if (!response.ok) {
      console.warn("[prediction-control] Failed to stop prediction thread", {
        threadId,
        status: response.status,
        body: payload,
      })
      return false
    }

    return payload?.stopped ?? false
  } catch (error) {
    console.warn("[prediction-control] Failed to stop prediction thread", {
      threadId,
      error,
    })
    return false
  }
}

async function runPredictionTransition(
  force: boolean
): Promise<QueueDesktopPredictionRunResult> {
  if (shouldSkipPredictionRun(force)) {
    return useDesktopAgentStore.getState().silentRunning ? "running" : "skipped"
  }

  usePredictionStore.getState().setLoading(true)

  const state = useDesktopAgentStore.getState()
  if (!state.silentRunning) {
    state.queueSilentPredictionRun()
    return "started"
  }

  state.markSilentPredictionStopping(state.silentRunRequestId)
  await stopDesktopPredictionRun(state.silentThreadId)
  useDesktopAgentStore.getState().queueSilentPredictionRun()
  return "restarted"
}

export function queueDesktopPredictionRun(
  options?: QueueDesktopPredictionRunOptions
): Promise<QueueDesktopPredictionRunResult> {
  const force = options?.force ?? false
  const result = predictionTransition
    .catch(() => undefined)
    .then(() => runPredictionTransition(force))

  predictionTransition = result.then(
    () => undefined,
    () => undefined
  )

  return result
}
