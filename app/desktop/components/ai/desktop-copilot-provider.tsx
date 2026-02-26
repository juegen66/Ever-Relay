"use client"

import type { ReactNode } from "react"

import { CopilotKit } from "@copilotkit/react-core"
import { CopilotPopup } from "@copilotkit/react-ui"

import {
  DESKTOP_COPILOT_AGENT,
  DESKTOP_COPILOT_ENDPOINT,
} from "@/shared/copilot/constants"
import { useDesktopCopilotTools } from "./use-desktop-copilot-tools"

function DesktopCopilotBridge() {
  useDesktopCopilotTools()

  return (
    <CopilotPopup
      labels={{
        title: "CloudOS Copilot",
        initial: "I can open apps, inspect desktop state, and execute write actions after your approval.",
      }}
      className="text-sm"
      shortcut="k"
      clickOutsideToClose
      hitEscapeToClose
      instructions={[
        "You are an assistant embedded in CloudOS desktop.",
        "Use tools instead of guessing state.",
        "For write operations, use the human-in-the-loop tools and wait for user approval result.",
      ].join("\n")}
    />
  )
}

interface DesktopCopilotProviderProps {
  children: ReactNode
}

export function DesktopCopilotProvider({ children }: DesktopCopilotProviderProps) {
  return (
    <CopilotKit
      runtimeUrl={DESKTOP_COPILOT_ENDPOINT}
      credentials="include"
      agent={DESKTOP_COPILOT_AGENT}
      showDevConsole={process.env.NODE_ENV !== "production"}
    >
      {children}
      <DesktopCopilotBridge />
    </CopilotKit>
  )
}
