"use client"

import { useEffect, useRef } from "react"

import { CopilotKit, useCopilotChatInternal } from "@copilotkit/react-core"

import { CopilotToolsRegistry } from "@/features/desktop-copilot/tools/use-register-copilot-tools"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { usePredictionStore } from "@/lib/stores/prediction-store"
import {
  DESKTOP_PREDICTION_CHAT_ID,
  DESKTOP_PREDICTION_ENABLED,
  DESKTOP_PREDICTION_ENDPOINT,
  DESKTOP_COPILOT_SILENT_CHAT_ID,
  DESKTOP_COPILOT_SILENT_EVENT,
  PREDICTION_AGENT_ID,
} from "@/shared/copilot/constants"
import type { SilentCopilotMessagePayload } from "@/shared/copilot/silent"

import { PREDICTION_INTERVAL_MS, queueDesktopPredictionRun } from "../lib/prediction-control"
import { DesktopAgentContextProvider } from "../providers/desktop-agent-context-provider"

const PREDICTION_PROMPT = [
  "Based on my current desktop state, open windows, and recent action history, generate the next best optimization actions for the work I am already doing.",
  "Do not predict my future behavior. Focus on what I should do next to improve quality, reduce friction, or make progress faster.",
  "Prioritize the active application and active document. Do not default to Logo or Canvas suggestions unless the current context is clearly design work.",
  "If a text file is open or was recently edited, use its text content to ground your recommendations. If the excerpt is insufficient, call read_text_file_content(fileId) before making document-specific suggestions.",
  "Use update_predictions with ranked primary optimization actions in predictions[] and secondary improvements in suggestions[].",
  "",
  "IMPORTANT: If ANY primary optimization action has confidence >= 80, you MUST first activate the prediction-report-builder skill via skill-activate, generate a detailed HTML optimization report, and call generate_prediction_report BEFORE calling update_predictions.",
  "After handling the report (if needed), call update_predictions with the full result.",
].join("\n")

function toUserText(input: string) {
  return input.trim()
}

function SilentMessageRuntime() {
  const { sendMessage, reset } = useCopilotChatInternal({
    id: DESKTOP_COPILOT_SILENT_CHAT_ID,
  })
  const queueRef = useRef(Promise.resolve())

  useEffect(() => {
    const onSilentSend = (event: Event) => {
      const detail = (event as CustomEvent<SilentCopilotMessagePayload>).detail
      const message = toUserText(detail?.message ?? "")
      if (!message) {
        return
      }

      queueRef.current = queueRef.current
        .then(async () => {
          await sendMessage(
            {
              id: crypto.randomUUID(),
              role: "user",
              content: message,
            },
            {
              followUp: detail?.followUp ?? true,
            }
          )

          if (detail?.resetAfterRun ?? true) {
            reset()
          }
        })
        .catch((error) => {
          console.error("[silent-copilot-runtime] Failed to send silent message", error)
        })
    }

    window.addEventListener(DESKTOP_COPILOT_SILENT_EVENT, onSilentSend as EventListener)
    return () => {
      window.removeEventListener(DESKTOP_COPILOT_SILENT_EVENT, onSilentSend as EventListener)
    }
  }, [reset, sendMessage])

  return null
}

function DesktopPredictionScheduler() {
  useEffect(() => {
    void queueDesktopPredictionRun()

    const interval = window.setInterval(() => {
      void queueDesktopPredictionRun()
    }, PREDICTION_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  return null
}

function SilentPredictionRuntime() {
  const { reset, sendMessage, stopGeneration, isLoading } = useCopilotChatInternal({
    id: DESKTOP_PREDICTION_CHAT_ID,
  })
  const silentRunRequestId = useDesktopAgentStore((state) => state.silentRunRequestId)
  const silentStatus = useDesktopAgentStore((state) => state.silentStatus)
  const finishSilentPredictionRun = useDesktopAgentStore(
    (state) => state.finishSilentPredictionRun
  )
  const handledRunRef = useRef(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  useEffect(() => {
    if (
      silentStatus !== "running" ||
      silentRunRequestId === 0 ||
      handledRunRef.current === silentRunRequestId
    ) {
      return
    }

    handledRunRef.current = silentRunRequestId
    let active = true

    void (async () => {
      try {
        await sendMessage(
          {
            id: crypto.randomUUID(),
            role: "user",
            content: PREDICTION_PROMPT,
          },
          {
            followUp: true,
          }
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)

        if (active && message.includes("Thread already running")) {
          const state = useDesktopAgentStore.getState()

          if (state.silentRunRequestId === silentRunRequestId) {
            state.markSilentPredictionStopping(silentRunRequestId)
            void queueDesktopPredictionRun({ force: true })
          }

          return
        }

        console.error("[silent-copilot-runtime] Failed to generate predictions", error)
      } finally {
        if (active) {
          reset()

          if (useDesktopAgentStore.getState().silentRunRequestId === silentRunRequestId) {
            finishSilentPredictionRun(silentRunRequestId)
            usePredictionStore.getState().setLoading(false)
          }
        }
      }
    })()

    return () => {
      active = false
    }
  }, [finishSilentPredictionRun, reset, sendMessage, silentRunRequestId, silentStatus])

  useEffect(() => {
    // The prediction tool callback is the point where the app has the data it needs.
    // If the underlying Copilot run keeps streaming after that, stop it so the next
    // manual trigger is not blocked by a stale "running" flag.
    if (silentStatus === "stopping" && isLoading) {
      stopGeneration()
      reset()
    }
  }, [isLoading, reset, silentStatus, stopGeneration])

  useEffect(() => {
    return () => {
      if (isLoadingRef.current) {
        stopGeneration()
      }

      reset()
    }
  }, [reset, stopGeneration])

  return null
}

let runtimeCleanupTimer: number | null = null

export function SilentCopilotRuntime() {
  const silentThreadId = useDesktopAgentStore((state) => state.silentThreadId)

  useEffect(() => {
    if (runtimeCleanupTimer !== null) {
      window.clearTimeout(runtimeCleanupTimer)
      runtimeCleanupTimer = null
    }

    return () => {
      runtimeCleanupTimer = window.setTimeout(() => {
        useDesktopAgentStore.getState().resetSilentPredictionSession()
        usePredictionStore.getState().setLoading(false)
        runtimeCleanupTimer = null
      }, 0)
    }
  }, [])

  if (!DESKTOP_PREDICTION_ENABLED) {
    return <SilentMessageRuntime />
  }

  return (
    <>
      <SilentMessageRuntime />
      <CopilotKit
        key={silentThreadId}
        runtimeUrl={DESKTOP_PREDICTION_ENDPOINT}
        credentials="include"
        agent={PREDICTION_AGENT_ID}
        threadId={silentThreadId}
        showDevConsole={false}
      >
        <CopilotToolsRegistry agentId={PREDICTION_AGENT_ID} />
        <DesktopAgentContextProvider includeWorkingMemory={false} />
        <DesktopPredictionScheduler />
        <SilentPredictionRuntime />
      </CopilotKit>
    </>
  )
}
