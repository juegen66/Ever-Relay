"use client"

import { useCallback } from "react"

import { useCodingAppsStore } from "@/lib/stores/coding-apps-store"
import { useCodingWorkspaceStore } from "@/lib/stores/coding-workspace-store"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import type { CodingApp } from "@/shared/contracts/coding-apps"
import { dispatchCodingPromptToCopilot } from "@/shared/copilot/coding-prompt"

function deriveProjectName(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim()
  if (!normalized) {
    return "Untitled Project"
  }

  const asciiTokens = normalized
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)

  if (asciiTokens.length > 0) {
    return asciiTokens
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(" ")
      .slice(0, 120)
  }

  return normalized.slice(0, 24) || "Untitled Project"
}

function formatCodingPromptForCopilot(input: {
  prompt: string
  appName: string
}) {
  return [
    "New coding project bootstrap from Vibecoding home.",
    `Project: ${input.appName}`,
    "",
    "User request:",
    input.prompt,
    "",
    "Handle this in two phases:",
    "1. If details are missing, open the coding sidebar and ask concise clarification questions there.",
    "2. Once the request is decision-complete, produce the final structured report and ask for explicit confirmation before triggering workflow.",
  ].join("\n")
}

function toDescription(prompt: string) {
  return prompt.length <= 1000 ? prompt : `${prompt.slice(0, 997)}...`
}

export function useCodingProjectSubmit() {
  const createApp = useCodingAppsStore((state) => state.createApp)
  const bootstrapProject = useCodingWorkspaceStore((state) => state.bootstrapProject)
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)
  const setCopilotAgentMode = useDesktopAgentStore((state) => state.setCopilotAgentMode)

  const submitProject = useCallback(
    async (rawPrompt: string): Promise<CodingApp> => {
      const prompt = rawPrompt.trim()
      if (!prompt) {
        throw new Error("Prompt is required")
      }

      const appName = deriveProjectName(prompt)
      const app = await createApp({
        name: appName,
        description: toDescription(prompt),
      })

      setCopilotAgentMode("coding")
      setCopilotSidebarOpen(false)
      bootstrapProject({
        appId: app.id,
        prompt,
      })

      window.requestAnimationFrame(() => {
        dispatchCodingPromptToCopilot({
          appId: app.id,
          threadId: app.threadId,
          message: formatCodingPromptForCopilot({
            prompt,
            appName,
          }),
        })
      })

      return app
    },
    [
      bootstrapProject,
      createApp,
      setCopilotAgentMode,
      setCopilotSidebarOpen,
    ]
  )

  return { submitProject }
}
