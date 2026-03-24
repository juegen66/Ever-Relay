"use client"

import type { ComponentType } from "react"

import {
  CANVAS_COPILOT_AGENT,
  CODING_COPILOT_AGENT,
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
  PREDICTION_AGENT_ID,
  THIRD_PARTY_COPILOT_AGENT,
} from "@/shared/copilot/constants"

import { useAgentHandoffTools } from "./use-agent-handoff-tools"
import { useArtifactTools } from "./use-artifact-tools"
import { useBuildTools } from "./use-build-tools"
import { useCanvasAgentTools } from "./use-canvas-agent-tools"
import { useCanvasTools } from "./use-canvas-tools"
import { useCodingAppTools } from "./use-coding-app-tools"
import { useCodingTools } from "./use-coding-tools"
import { useDesktopCoreTools } from "./use-desktop-core-tools"
import { useDesktopHitlTools } from "./use-desktop-hitl-tools"
import { useLogoTools } from "./use-logo-tools"
import { usePredictionReportTools } from "./use-prediction-report-tools"
import { usePredictionTools } from "./use-prediction-tools"
import { useTextEditTools } from "./use-textedit-tools"
import { ThirdPartyToolsMount } from "./use-third-party-tools"

/** Mounts tools for main_agent (desktop mode). */
function DesktopAgentToolsMount() {
  useDesktopCoreTools()
  useArtifactTools()
  useTextEditTools()
  useBuildTools()
  useCodingAppTools()
  useDesktopHitlTools()
  useAgentHandoffTools()
  return null
}

/** Mounts tools for canvas_agent (canvas mode). */
function CanvasAgentToolsMount() {
  useDesktopCoreTools()
  useCanvasTools()
  useCanvasAgentTools()
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

function CodingAgentToolsMount() {
  useDesktopCoreTools()
  useArtifactTools()
  useCodingAppTools()
  useCodingTools()
  useAgentHandoffTools()
  return null
}

/** Mounts tools for prediction_agent (background prediction mode). */
function PredictionAgentToolsMount() {
  useDesktopCoreTools()
  useCanvasTools()
  useTextEditTools()
  usePredictionTools()
  usePredictionReportTools()
  return null
}

function ThirdPartyAgentToolsMount() {
  useDesktopCoreTools()
  useAgentHandoffTools()
  return <ThirdPartyToolsMount />
}

const AGENT_MOUNTS: Record<string, ComponentType> = {
  [DESKTOP_COPILOT_AGENT]: DesktopAgentToolsMount,
  [CANVAS_COPILOT_AGENT]: CanvasAgentToolsMount,
  [LOGO_COPILOT_AGENT]: LogoAgentToolsMount,
  [CODING_COPILOT_AGENT]: CodingAgentToolsMount,
  [THIRD_PARTY_COPILOT_AGENT]: ThirdPartyAgentToolsMount,
  [PREDICTION_AGENT_ID]: PredictionAgentToolsMount,
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
