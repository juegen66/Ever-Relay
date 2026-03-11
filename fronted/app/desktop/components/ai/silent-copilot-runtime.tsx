"use client"

import { useEffect, useRef } from "react"

import { CopilotKit, useCopilotChatInternal } from "@copilotkit/react-core"

import { CopilotToolsRegistry } from "@/features/desktop-copilot/tools/use-register-copilot-tools"
import { useDesktopUIStore } from "@/lib/stores/desktop-ui-store"
import { usePredictionStore } from "@/lib/stores/prediction-store"
import {
  DESKTOP_COPILOT_ENDPOINT,
  DESKTOP_PREDICTION_CHAT_ID,
  DESKTOP_COPILOT_SILENT_CHAT_ID,
  DESKTOP_COPILOT_SILENT_EVENT,
  PREDICTION_AGENT_ID,
} from "@/shared/copilot/constants"
import type { SilentCopilotMessagePayload } from "@/shared/copilot/silent"

import { DesktopAgentContextProvider } from "./desktop-agent-context-provider"
import { queueDesktopPredictionRun } from "./prediction-control"

const PREDICTION_PROMPT =
  "Based on my current desktop state, open windows, and recent action history, generate predicted next steps and improvement suggestions. Call update_predictions with the result."

const PREDICTION_INTERVAL_MS = 5 * 60 * 1000

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
    queueDesktopPredictionRun()

    const interval = window.setInterval(() => {
      queueDesktopPredictionRun()
    }, PREDICTION_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
      useDesktopUIStore.getState().resetSilentPredictionSession()
      usePredictionStore.getState().setLoading(false)
    }
  }, [])

  return null
}

function SilentPredictionRuntime() {
  const { reset, sendMessage, stopGeneration, isLoading } = useCopilotChatInternal({
    id: DESKTOP_PREDICTION_CHAT_ID,
  })
  const silentRunRequestId = useDesktopUIStore((state) => state.silentRunRequestId)
  const silentRunning = useDesktopUIStore((state) => state.silentRunning)
  const finishSilentPredictionRun = useDesktopUIStore(
    (state) => state.finishSilentPredictionRun
  )
  const handledRunRef = useRef(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  useEffect(() => {
    if (
      !silentRunning ||
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
        console.error("[silent-copilot-runtime] Failed to generate predictions", error)
      } finally {
        reset()

        if (
          active &&
          useDesktopUIStore.getState().silentRunning &&
          useDesktopUIStore.getState().silentRunRequestId === silentRunRequestId
        ) {
          finishSilentPredictionRun()
        }

        usePredictionStore.getState().setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [finishSilentPredictionRun, reset, sendMessage, silentRunRequestId, silentRunning])

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

export function SilentCopilotRuntime() {
  const silentThreadId = useDesktopUIStore((state) => state.silentThreadId)

  return (
    <>
      <SilentMessageRuntime />
      <CopilotKit
        runtimeUrl={DESKTOP_COPILOT_ENDPOINT}
        credentials="include"
        agent={PREDICTION_AGENT_ID}
        threadId={silentThreadId}
        showDevConsole={false}
      >
        <CopilotToolsRegistry agentId={PREDICTION_AGENT_ID} />
        <DesktopAgentContextProvider />
        <DesktopPredictionScheduler />
        <SilentPredictionRuntime />
      </CopilotKit>
    </>
  )
}
