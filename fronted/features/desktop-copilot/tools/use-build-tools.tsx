"use client"

import { useCallback } from "react"

import { useCopilotChat, useFrontendTool } from "@copilotkit/react-core"

import { buildsApi } from "@/lib/api/modules/builds"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { useWorkflowProgressStore } from "@/lib/stores/workflow-progress-store"

import {
  START_NEW_CHAT_THREAD_PARAMS,
  TRIGGER_BUILD_PARAMS,
  toErrorMessage,
  toolErr,
  toolOk,
} from "./types"

export function useBuildTools() {
  const { reset, stopGeneration, isLoading } = useCopilotChat()
  const openWorkflowProgress = useWorkflowProgressStore((state) => state.openForRun)
  const startNewCopilotThread = useDesktopAgentStore((state) => state.startNewCopilotThread)
  const activeCodingApp = useDesktopAgentStore((state) => state.activeCodingApp)
  const clearActiveCodingApp = useDesktopAgentStore((state) => state.clearActiveCodingApp)

  const triggerBuild = useCallback(
    async (args: { prompt?: string; projectId?: string }) => {
      const prompt = typeof args.prompt === "string" ? args.prompt.trim() : ""
      const projectId = typeof args.projectId === "string" ? args.projectId.trim() : ""

      if (!prompt) {
        return toolErr("prompt is required")
      }

      try {
        const response = await buildsApi.triggerBuild({
          prompt,
          projectId: projectId || undefined,
        })

        openWorkflowProgress(response.runId, "build")
        return toolOk(
          `Succeeded: build workflow started (runId ${response.runId}, stage ${String(response.stage)}, status ${String(response.status)}). The progress panel should open.`,
          {
            runId: response.runId,
            stage: response.stage,
            workflowStatus: response.status,
          },
          {
            shouldStop: true,
            nextAction: "reply_to_user",
          }
        )
      } catch (error) {
        return toolErr(toErrorMessage(error))
      }
    },
    [openWorkflowProgress]
  )

  const startNewChatThread = useCallback(
    async (args: { reason?: string }) => {
      const { copilotAgentMode: previousAgentMode } = useDesktopAgentStore.getState()

      if (isLoading) {
        stopGeneration()
      }

      reset()

      if (activeCodingApp) {
        clearActiveCodingApp({ freshMainThread: true })

        const { copilotThreadId: newThreadId } = useDesktopAgentStore.getState()
        const reason = typeof args.reason === "string" ? args.reason.trim() : ""

        return toolOk(
          `Succeeded: started a fresh chat thread (newThreadId ${newThreadId}). Previous agent mode was ${String(previousAgentMode)}.`,
          {
            newThreadId,
            previousAgentMode,
            reason: reason || null,
          }
        )
      }

      startNewCopilotThread()

      const { copilotThreadId: newThreadId } = useDesktopAgentStore.getState()
      const reason = typeof args.reason === "string" ? args.reason.trim() : ""

      return toolOk(
        `Succeeded: started a fresh chat thread (newThreadId ${newThreadId}).`,
        {
          newThreadId,
          previousAgentMode,
          reason: reason || null,
        }
      )
    },
    [
      activeCodingApp,
      clearActiveCodingApp,
      isLoading,
      reset,
      startNewCopilotThread,
      stopGeneration,
    ]
  )

  useFrontendTool(
    {
      name: "trigger_build",
      description: "Trigger backend multi-agent build workflow and open progress panel.",
      followUp: true,
      parameters: TRIGGER_BUILD_PARAMS,
      handler: async (args) => {
        return triggerBuild({
          prompt: typeof args.prompt === "string" ? args.prompt : undefined,
          projectId: typeof args.projectId === "string" ? args.projectId : undefined,
        })
      },
    },
    [triggerBuild]
  )

  useFrontendTool(
    {
      name: "start_new_chat_thread",
      description: "Create a fresh Copilot chat thread only when the user explicitly asks for a brand-new conversation.",
      followUp: true,
      parameters: START_NEW_CHAT_THREAD_PARAMS,
      handler: async (args) => {
        return startNewChatThread({
          reason: typeof args.reason === "string" ? args.reason : undefined,
        })
      },
    },
    [startNewChatThread]
  )
}
