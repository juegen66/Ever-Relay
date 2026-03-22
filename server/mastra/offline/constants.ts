import {
  SKILL_TEST_AGENT_ID,
} from "@/server/mastra/agents/shared/parallel-agent.constants"
import { WORKER_AGENT_ID } from "@/server/mastra/agents/shared/worker-agent"
import {
  CANVAS_COPILOT_AGENT,
  CODING_COPILOT_AGENT,
  DESKTOP_COPILOT_AGENT,
  LOGO_COPILOT_AGENT,
  THIRD_PARTY_COPILOT_AGENT,
} from "@/shared/copilot/constants"

export const OFFLINE_DISCOVERY_AGENT_ID = "offline_discovery_agent"
export const TEXTEDIT_PROACTIVE_AGENT_ID = "textedit_proactive_agent"

export const OFFLINE_PROACTIVE_WORKFLOW_TYPE = "offline-proactive"
export const OFFLINE_PROACTIVE_WORKFLOW_ID = "offline-proactive"
export const OFFLINE_PROACTIVE_SCHEDULER_WORKFLOW_ID =
  "offline-proactive-scheduler"

export const OFFLINE_PROACTIVE_RUNNABLE_AGENT_IDS = [
  TEXTEDIT_PROACTIVE_AGENT_ID,
] as const

export type OfflineRunnableAgentId =
  (typeof OFFLINE_PROACTIVE_RUNNABLE_AGENT_IDS)[number]

export interface DefaultAgentRegistryEntry {
  agentId: string
  name: string
  description: string
  offlineCapable: boolean
  metadata: Record<string, unknown>
}

export const DEFAULT_AGENT_REGISTRY_ENTRIES: DefaultAgentRegistryEntry[] = [
  {
    agentId: OFFLINE_DISCOVERY_AGENT_ID,
    name: "Offline Discovery Agent",
    description:
      "Chooses the highest-value offline task and routes it to the correct app agent.",
    offlineCapable: false,
    metadata: {
      runtimeAgentKey: OFFLINE_DISCOVERY_AGENT_ID,
      role: "discovery",
      appId: "system",
      scope: "Desktop",
      parallelWorkflowEnabled: false,
    },
  },
  {
    agentId: TEXTEDIT_PROACTIVE_AGENT_ID,
    name: "TextEdit Proactive Agent",
    description:
      "Creates candidate TextEdit drafts based on the user's current work and preferences.",
    offlineCapable: true,
    metadata: {
      runtimeAgentKey: TEXTEDIT_PROACTIVE_AGENT_ID,
      appId: "textedit",
      scope: "Desktop",
      deliveryCapabilities: ["desktop_item_candidate"],
      offlineWorkflowEnabled: true,
      parallelWorkflowEnabled: false,
    },
  },
  {
    agentId: DESKTOP_COPILOT_AGENT,
    name: "Desktop Copilot",
    description: "Primary desktop assistant used by the main rollout.",
    offlineCapable: true,
    metadata: {
      runtimeAgentKey: DESKTOP_COPILOT_AGENT,
      appId: "desktop",
      scope: "Desktop",
      offlineWorkflowEnabled: false,
      parallelWorkflowEnabled: true,
    },
  },
  {
    agentId: CANVAS_COPILOT_AGENT,
    name: "Canvas Copilot",
    description: "Canvas specialist available for future offline workflows.",
    offlineCapable: true,
    metadata: {
      runtimeAgentKey: CANVAS_COPILOT_AGENT,
      appId: "canvas",
      scope: "Canvas",
      offlineWorkflowEnabled: false,
      parallelWorkflowEnabled: true,
    },
  },
  {
    agentId: LOGO_COPILOT_AGENT,
    name: "Logo Copilot",
    description: "Logo specialist available for future offline workflows.",
    offlineCapable: true,
    metadata: {
      runtimeAgentKey: LOGO_COPILOT_AGENT,
      appId: "logo",
      scope: "Logo",
      offlineWorkflowEnabled: false,
      parallelWorkflowEnabled: true,
    },
  },
  {
    agentId: CODING_COPILOT_AGENT,
    name: "Coding Copilot",
    description: "Coding specialist available for future offline workflows.",
    offlineCapable: true,
    metadata: {
      runtimeAgentKey: CODING_COPILOT_AGENT,
      appId: "vibecoding",
      scope: "VibeCoding",
      offlineWorkflowEnabled: false,
      parallelWorkflowEnabled: true,
    },
  },
  {
    agentId: THIRD_PARTY_COPILOT_AGENT,
    name: "Third-Party Copilot",
    description: "Third-party specialist available for future offline workflows.",
    offlineCapable: true,
    metadata: {
      runtimeAgentKey: THIRD_PARTY_COPILOT_AGENT,
      appId: "third-party",
      scope: "Desktop",
      offlineWorkflowEnabled: false,
      parallelWorkflowEnabled: true,
    },
  },
  {
    agentId: SKILL_TEST_AGENT_ID,
    name: "Skill Test Agent",
    description: "Diagnostic agent used to verify DB-backed skills and internal workflow routing.",
    offlineCapable: false,
    metadata: {
      runtimeAgentKey: SKILL_TEST_AGENT_ID,
      appId: "system",
      scope: "Desktop",
      parallelWorkflowEnabled: true,
    },
  },
  {
    agentId: WORKER_AGENT_ID,
    name: "Worker Agent",
    description: "Internal workflow worker used as the default task executor when a task does not specify an agent id.",
    offlineCapable: false,
    metadata: {
      runtimeAgentKey: WORKER_AGENT_ID,
      role: "worker",
      appId: "system",
      scope: "Desktop",
      parallelWorkflowEnabled: true,
    },
  },
]

export const OFFLINE_ACTIVITY_SOURCE = "offline_workflow"
export const OFFLINE_ACTIVITY_TYPE = "offline-proactive"
