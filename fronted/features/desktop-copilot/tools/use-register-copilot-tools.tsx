"use client"

import type { ComponentType } from "react"
import { DESKTOP_COPILOT_AGENT, LOGO_COPILOT_AGENT } from "@/shared/copilot/constants"
import { useDesktopCoreTools } from "./use-desktop-core-tools"
import { useCanvasTools } from "./use-canvas-tools"
import { useTextEditTools } from "./use-textedit-tools"
import { useBuildTools } from "./use-build-tools"
import { useLogoTools } from "./use-logo-tools"
import { useDesktopHitlTools } from "./use-desktop-hitl-tools"
import { useAgentHandoffTools } from "./use-agent-handoff-tools"

/** Mounts tools for main_agent (desktop mode). */
function DesktopAgentToolsMount() {
  useDesktopCoreTools()
  useCanvasTools()
  useTextEditTools()
  useBuildTools()
  useDesktopHitlTools()
  useAgentHandoffTools()
  return null
}

/** Mounts tools for logo_agent (logo mode). */
function LogoAgentToolsMount() {
  useDesktopCoreTools()
  useLogoTools()
  useAgentHandoffTools()
  return null
}

const AGENT_MOUNTS: Record<string, ComponentType> = {
  [DESKTOP_COPILOT_AGENT]: DesktopAgentToolsMount,
  [LOGO_COPILOT_AGENT]: LogoAgentToolsMount,
}

/**
 * Registry component: conditionally mounts tools for the current agent.
 * When agentId changes, the previous mount unmounts (tools unregister) and the new one mounts.
 * Add new agent: create XxxAgentToolsMount, add to AGENT_MOUNTS, and update AGENT_TOOL_GROUPS.
 */
export function CopilotToolsRegistry({ agentId }: { agentId: string }) {
  const Mount = AGENT_MOUNTS[agentId]
  if (!Mount) return null
  return <Mount />
}
