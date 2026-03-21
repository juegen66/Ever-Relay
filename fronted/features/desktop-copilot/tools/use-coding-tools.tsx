"use client"

import { useCallback } from "react"

import { useFrontendTool } from "@copilotkit/react-core"

import { codingRunsApi } from "@/lib/api/modules/coding-runs"
import {
  useCodingWorkspaceStore,
  type CodingWorkspacePhase,
} from "@/lib/stores/coding-workspace-store"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { useWorkflowProgressStore } from "@/lib/stores/workflow-progress-store"
import type { CodingReport } from "@/shared/contracts/coding-runs"

import {
  OPEN_CODING_SIDEBAR_PARAMS,
  SET_CODING_PROJECT_STATUS_PARAMS,
  TRIGGER_CODING_WORKFLOW_PARAMS,
  toErrorMessage,
  toolErr,
  toolOk,
} from "./types"

export function useCodingTools() {
  const openWorkflowProgress = useWorkflowProgressStore((state) => state.openForRun)
  const activeCodingApp = useDesktopAgentStore((state) => state.activeCodingApp)
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)
  const setCopilotAgentMode = useDesktopAgentStore((state) => state.setCopilotAgentMode)
  const setProjectPhase = useCodingWorkspaceStore((state) => state.setProjectPhase)
  const markWorkflowRunning = useCodingWorkspaceStore((state) => state.markWorkflowRunning)

  const openCodingSidebar = useCallback(
    async (args: { reason?: string }) => {
      setCopilotAgentMode("coding")
      setCopilotSidebarOpen(true)

      const reason = typeof args.reason === "string" ? args.reason.trim() : ""

      return toolOk(
        "Succeeded: coding sidebar is open and agent mode is set to coding.",
        {
          opened: true,
          reason: reason || null,
        },
        {
          nextAction: "ask_user_follow_up",
        }
      )
    },
    [setCopilotAgentMode, setCopilotSidebarOpen]
  )

  const setCodingProjectStatus = useCallback(
    async (args: {
      status?: string
      summary?: string
      appId?: string
    }) => {
      const appId =
        typeof args.appId === "string" && args.appId.trim()
          ? args.appId.trim()
          : activeCodingApp?.id
      if (!appId) {
        return toolErr("No active coding app. Create or activate a coding app first.")
      }

      const status =
        typeof args.status === "string" ? args.status.trim() : ""
      const allowedStatuses: CodingWorkspacePhase[] = [
        "reviewing_request",
        "needs_clarification",
        "ready_for_confirmation",
      ]

      if (!allowedStatuses.includes(status as CodingWorkspacePhase)) {
        return toolErr(
          "status must be one of: reviewing_request, needs_clarification, ready_for_confirmation"
        )
      }

      const summary =
        typeof args.summary === "string" && args.summary.trim()
          ? args.summary.trim()
          : undefined

      setProjectPhase({
        appId,
        phase: status as Exclude<
          CodingWorkspacePhase,
          "workflow_running" | "workflow_completed" | "workflow_failed"
        >,
        summary,
      })

      return toolOk(
        `Succeeded: updated coding workspace status to "${status}" for app ${appId}.`,
        {
          appId,
          projectStatus: status,
          summary: summary ?? null,
        },
        {
          nextAction: "continue_reasoning",
        }
      )
    },
    [activeCodingApp?.id, setProjectPhase]
  )

  const triggerCodingWorkflow = useCallback(
    async (args: { report?: CodingReport; appId?: string }) => {
      const report =
        typeof args.report === "object" && args.report !== null
          ? args.report
          : null
      const appId =
        typeof args.appId === "string" && args.appId.trim()
          ? args.appId.trim()
          : activeCodingApp?.id

      if (!report) {
        return toolErr("report is required")
      }

      if (!appId) {
        return toolErr("No active coding app. Create or activate a coding app first.")
      }

      try {
        const response = await codingRunsApi.triggerRun({
          report,
          appId,
        })

        markWorkflowRunning({
          appId,
          runId: response.runId,
        })
        openWorkflowProgress(response.runId, "coding")

        return toolOk(
          `Succeeded: coding workflow started (runId ${response.runId}, stage ${String(response.stage)}, status ${String(response.status)}). Progress panel should open.`,
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
    [activeCodingApp?.id, markWorkflowRunning, openWorkflowProgress]
  )

  useFrontendTool(
    {
      name: "open_coding_sidebar",
      description:
        "Open the coding sidebar so clarification questions or final confirmation can happen there.",
      parameters: OPEN_CODING_SIDEBAR_PARAMS,
      handler: async (args) => {
        return openCodingSidebar({
          reason: typeof args.reason === "string" ? args.reason : undefined,
        })
      },
    },
    [openCodingSidebar]
  )

  useFrontendTool(
    {
      name: "set_coding_project_status",
      description:
        "Update the Vibecoding workspace status for the active project during clarification and confirmation phases.",
      parameters: SET_CODING_PROJECT_STATUS_PARAMS,
      handler: async (args) => {
        return setCodingProjectStatus({
          status: typeof args.status === "string" ? args.status : undefined,
          summary: typeof args.summary === "string" ? args.summary : undefined,
          appId: typeof args.appId === "string" ? args.appId : undefined,
        })
      },
    },
    [setCodingProjectStatus]
  )

  useFrontendTool(
    {
      name: "trigger_coding_workflow",
      description:
        "Trigger the backend coding workflow with a confirmed report and open the workflow progress panel.",
      parameters: TRIGGER_CODING_WORKFLOW_PARAMS,
      handler: async (args) => {
        return triggerCodingWorkflow({
          report:
            typeof args.report === "object" && args.report !== null
              ? (args.report as CodingReport)
              : undefined,
          appId: typeof args.appId === "string" ? args.appId : undefined,
        })
      },
    },
    [triggerCodingWorkflow]
  )
}
