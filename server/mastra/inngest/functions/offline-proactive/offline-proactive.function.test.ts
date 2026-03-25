import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  syncDefaultRegistryEntries: vi.fn(),
  listRunnableOfflineAgents: vi.fn(),
  getRegistration: vi.fn(),
  getRunnableRegistration: vi.fn(),
  resolveRuntimeAgentId: vi.fn(),
  getFullContext: vi.fn(),
  formatFullContext: vi.fn(),
  generate: vi.fn(),
  createActivity: vi.fn(),
  deleteItem: vi.fn(),
}))

vi.mock("@/server/mastra/offline/constants", () => ({
  TEXTEDIT_PROACTIVE_AGENT_ID: "textedit_proactive_agent",
  OFFLINE_DISCOVERY_AGENT_ID: "offline_discovery_agent",
  OFFLINE_ACTIVITY_SOURCE: "offline_workflow",
  OFFLINE_ACTIVITY_TYPE: "offline-proactive",
}))

vi.mock("@/server/modules/agent-activity/agent-registry.service", () => ({
  agentRegistryService: {
    syncDefaultRegistryEntries: mocks.syncDefaultRegistryEntries,
    listRunnableOfflineAgents: mocks.listRunnableOfflineAgents,
    getRegistration: mocks.getRegistration,
    getRunnableRegistration: mocks.getRunnableRegistration,
    resolveRuntimeAgentId: mocks.resolveRuntimeAgentId,
  },
}))

vi.mock("@/server/mastra/offline/offline-context.service", () => ({
  offlineContextService: {
    getFullContext: mocks.getFullContext,
    formatFullContext: mocks.formatFullContext,
  },
}))

vi.mock("@/server/mastra/agents/proactive/offline-discovery-agent", () => ({
  offlineDiscoveryAgent: {
    generate: mocks.generate,
  },
}))

vi.mock("@/server/modules/agent-activity/agent-activity.service", () => ({
  agentActivityService: {
    createActivity: mocks.createActivity,
  },
}))

vi.mock("@/server/modules/files/files.service", () => ({
  filesService: {
    deleteItem: mocks.deleteItem,
  },
}))

import { TEXTEDIT_PROACTIVE_AGENT_ID } from "@/server/mastra/offline/constants"

import { executeOfflineProactiveWaveStep } from "./execute-wave.function"
import { gatherOfflineProactiveContextStep } from "./gather-context.function"
import { logOfflineAgentActivityStep } from "./log-activity.function"
import { planOfflineProactiveStep } from "./plan.function"

const runnableTextEditAgent = {
  agentId: TEXTEDIT_PROACTIVE_AGENT_ID,
  name: "TextEdit Proactive Agent",
  description: "Creates candidate TextEdit drafts.",
  offlineCapable: true,
  metadata: {},
}

const fullContext = {
  userId: "user-1",
  workingMemory: null,
  preferredWorkstyle: null,
  preferredWorkstyleDescription: null,
  recentTextFiles: [
    {
      id: "file-1",
      name: "Draft.md",
      parentId: null,
      contentVersion: 7,
      updatedAt: "2026-03-24T12:00:00.000Z",
      preview: "Latest draft preview",
    },
  ],
  recentHistory: [
    {
      id: "history-1",
      scope: "Desktop",
      bucket: "workflow-runs",
      actionType: null,
      status: "completed",
      content: "background workflow log",
      createdAt: "2026-03-24T12:10:00.000Z",
      metadata: {},
    },
  ],
  recentMemories: [],
  lastActivityAt: "2026-03-24T12:10:00.000Z",
  isRecentlyActive: false,
}

const plannedTask = {
  id: "T1",
  name: "Create candidate draft",
  agentId: TEXTEDIT_PROACTIVE_AGENT_ID,
  dependsOn: [],
  location: "Draft.md",
  prerequisites: "source file id=file-1\nsource file name=Draft.md\nsource content version=7",
  description: "Create a conservative candidate draft for the latest TextEdit file.",
  acceptanceCriteria: [
    "Verify the source file before drafting.",
    "Create a new candidate draft instead of overwriting the source file.",
  ],
  validation: "Return completed only if a candidate draft was created.",
}

describe("offline proactive parallel workflow helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.syncDefaultRegistryEntries.mockResolvedValue(undefined)
    mocks.listRunnableOfflineAgents.mockResolvedValue([runnableTextEditAgent])
    mocks.getRunnableRegistration.mockResolvedValue(runnableTextEditAgent)
    mocks.resolveRuntimeAgentId.mockReturnValue(TEXTEDIT_PROACTIVE_AGENT_ID)
    mocks.getFullContext.mockResolvedValue(fullContext)
    mocks.formatFullContext.mockReturnValue("formatted full context")
    mocks.deleteItem.mockResolvedValue(true)
    mocks.generate.mockResolvedValue({
      object: {
        tasks: [plannedTask],
      },
    })
  })

  it("bypasses the recent activity gate during force-run context gathering", async () => {
    mocks.getFullContext.mockResolvedValue({
      ...fullContext,
      isRecentlyActive: true,
    })

    const result = await gatherOfflineProactiveContextStep.execute({
      inputData: {
        userId: "user-1",
        forceRun: true,
      },
    } as never) as any

    expect(result.skip).toBe(false)
    expect(result.skipReason).toBeUndefined()
    expect(result.context).toBe("formatted full context")
  })

  it("skips gathering when the user is recently active and forceRun is absent", async () => {
    mocks.getFullContext.mockResolvedValue({
      ...fullContext,
      isRecentlyActive: true,
    })

    const result = await gatherOfflineProactiveContextStep.execute({
      inputData: {
        userId: "user-1",
      },
    } as never) as any

    expect(result.skip).toBe(true)
    expect(result.skipReason).toContain("recent foreground activity")
  })

  it("injects a deterministic TextEdit task during force-run planning", async () => {
    const setState = vi.fn().mockResolvedValue(undefined)

    const result = await planOfflineProactiveStep.execute({
      inputData: {
        userId: "user-1",
        forceRun: true,
        context: "formatted full context",
        runnableAgents: [
          {
            agentId: TEXTEDIT_PROACTIVE_AGENT_ID,
            name: "TextEdit Proactive Agent",
            description: "Creates candidate TextEdit drafts.",
            metadata: {},
          },
        ],
        recentTextFiles: fullContext.recentTextFiles,
        skip: false,
      },
      requestContext: new Map(),
      setState,
    } as never) as any

    expect(result.done).toBe(false)
    expect(result.plan.tasks).toHaveLength(1)
    expect(result.plan.tasks[0]?.agentId).toBe(TEXTEDIT_PROACTIVE_AGENT_ID)
    expect(result.plan.tasks[0]?.description).toContain("[FORCE_TEST]")
    expect(mocks.generate).not.toHaveBeenCalled()
    expect(setState).toHaveBeenCalledWith({
      plan: result.plan,
      completedTaskIds: [],
      allReports: [],
    })
  })

  it("hydrates requestContext.userId before executing a wave task", async () => {
    const runtimeAgentGenerate = vi.fn().mockResolvedValue({
      object: {
        status: "completed",
        summary: "Created candidate draft",
        artifact: null,
        sourceFingerprint: "v7",
        agentId: TEXTEDIT_PROACTIVE_AGENT_ID,
      },
    })
    const setState = vi.fn().mockResolvedValue(undefined)

    const result = await executeOfflineProactiveWaveStep.execute({
      inputData: {
        userId: "user-1",
        forceRun: true,
        done: false,
        synthesis: "Planned 1 offline proactive task(s).",
        plan: {
          tasks: [plannedTask],
        },
      },
      state: {
        plan: {
          tasks: [plannedTask],
        },
        completedTaskIds: [],
        allReports: [],
      },
      setState,
      mastra: {
        getAgent() {
          return {
            generate: runtimeAgentGenerate,
          }
        },
      },
      requestContext: {
        get(key: string) {
          return key === "runId" ? "run-1" : undefined
        },
      },
    } as never) as any

    const [, options] = runtimeAgentGenerate.mock.calls[0] ?? []

    expect(options.requestContext.get("userId")).toBe("user-1")
    expect(options.requestContext.get("runId")).toBe("run-1")
    expect(result.done).toBe(true)
    expect(setState).toHaveBeenCalledWith({
      plan: {
        tasks: [plannedTask],
      },
      completedTaskIds: ["T1"],
      allReports: [
        expect.objectContaining({
          taskId: "T1",
          status: "completed",
          agentId: TEXTEDIT_PROACTIVE_AGENT_ID,
        }),
      ],
    })
  })

  it("rebuilds a standard requestContext before calling the worker agent", async () => {
    const runtimeAgentGenerate = vi.fn().mockResolvedValue({
      object: {
        status: "completed",
        summary: "Created candidate draft",
        artifact: null,
        sourceFingerprint: "v7",
        agentId: TEXTEDIT_PROACTIVE_AGENT_ID,
      },
    })
    const setState = vi.fn().mockResolvedValue(undefined)
    const incomingRequestContext = {
      get(key: string) {
        if (key === "userId") return "user-1"
        if (key === "runId") return "run-1"
        return undefined
      },
    }

    await executeOfflineProactiveWaveStep.execute({
      inputData: {
        userId: "user-1",
        forceRun: true,
        done: false,
        synthesis: "Planned 1 offline proactive task(s).",
        plan: {
          tasks: [plannedTask],
        },
      },
      state: {
        plan: {
          tasks: [plannedTask],
        },
        completedTaskIds: [],
        allReports: [],
      },
      setState,
      mastra: {
        getAgent() {
          return {
            generate: runtimeAgentGenerate,
          }
        },
      },
      requestContext: incomingRequestContext,
    } as never)

    const [, options] = runtimeAgentGenerate.mock.calls[0] ?? []

    expect(options.requestContext).not.toBe(incomingRequestContext)
    expect(options.requestContext.get("userId")).toBe("user-1")
    expect(options.requestContext.get("runId")).toBe("run-1")
  })

  it("falls back to TextEdit tool results when the worker returns malformed JSON", async () => {
    const malformedStructuredResponse: Record<string, unknown> = {
      text: "Created candidate draft Draft.md - Optimized Draft v7.",
      toolResults: [
        {
          toolName: "readDesktopFile",
          args: {
            fileId: "file-1",
          },
          result: {
            ok: true,
            file: {
              id: "file-1",
              name: "Draft.md",
              contentVersion: 7,
              content: "Original draft content",
            },
          },
        },
        {
          toolName: "createDesktopItem",
          args: {
            name: "Draft.md - Optimized Draft v7",
            itemType: "text",
            parentId: null,
            content: "Original draft content with clearer flow.",
          },
          result: {
            ok: true,
            created: true,
            alreadyExists: false,
            item: {
              id: "11111111-1111-4111-8111-111111111111",
              name: "Draft.md - Optimized Draft v7",
              itemType: "text",
              parentId: null,
            },
          },
        },
      ],
    }

    Object.defineProperty(malformedStructuredResponse, "object", {
      get() {
        throw new Error("Invalid JSON response")
      },
    })

    const runtimeAgentGenerate = vi
      .fn()
      .mockResolvedValue(malformedStructuredResponse)
    const setState = vi.fn().mockResolvedValue(undefined)

    const result = await executeOfflineProactiveWaveStep.execute({
      inputData: {
        userId: "user-1",
        forceRun: true,
        done: false,
        synthesis: "Planned 1 offline proactive task(s).",
        plan: {
          tasks: [plannedTask],
        },
      },
      state: {
        plan: {
          tasks: [plannedTask],
        },
        completedTaskIds: [],
        allReports: [],
      },
      setState,
      mastra: {
        getAgent() {
          return {
            generate: runtimeAgentGenerate,
          }
        },
      },
      requestContext: {
        get(key: string) {
          return key === "runId" ? "run-1" : undefined
        },
      },
    } as never) as any

    expect(result.done).toBe(true)
    expect(setState).toHaveBeenCalledWith({
      plan: {
        tasks: [plannedTask],
      },
      completedTaskIds: ["T1"],
      allReports: [
        expect.objectContaining({
          taskId: "T1",
          status: "completed",
          sourceFingerprint: "v7",
          artifact: expect.objectContaining({
            id: "11111111-1111-4111-8111-111111111111",
            name: "Draft.md - Optimized Draft v7",
            type: "text",
          }),
        }),
      ],
    })
  })

  it("rejects and rolls back identical TextEdit candidate drafts", async () => {
    const malformedStructuredResponse: Record<string, unknown> = {
      text: "Created candidate draft Draft.md - Optimized Draft v7.",
      toolResults: [
        {
          toolName: "readDesktopFile",
          args: {
            fileId: "file-1",
          },
          result: {
            ok: true,
            file: {
              id: "file-1",
              name: "Draft.md",
              contentVersion: 7,
              content: "Original draft content",
            },
          },
        },
        {
          toolName: "createDesktopItem",
          args: {
            name: "Draft.md - Optimized Draft v7",
            itemType: "text",
            parentId: null,
            content: "Original draft content",
          },
          result: {
            ok: true,
            created: true,
            alreadyExists: false,
            item: {
              id: "22222222-2222-4222-8222-222222222222",
              name: "Draft.md - Optimized Draft v7",
              itemType: "text",
              parentId: null,
            },
          },
        },
      ],
    }

    Object.defineProperty(malformedStructuredResponse, "object", {
      get() {
        throw new Error("Invalid JSON response")
      },
    })

    const runtimeAgentGenerate = vi
      .fn()
      .mockResolvedValue(malformedStructuredResponse)
    const setState = vi.fn().mockResolvedValue(undefined)

    const result = await executeOfflineProactiveWaveStep.execute({
      inputData: {
        userId: "user-1",
        forceRun: true,
        done: false,
        synthesis: "Planned 1 offline proactive task(s).",
        plan: {
          tasks: [plannedTask],
        },
      },
      state: {
        plan: {
          tasks: [plannedTask],
        },
        completedTaskIds: [],
        allReports: [],
      },
      setState,
      mastra: {
        getAgent() {
          return {
            generate: runtimeAgentGenerate,
          }
        },
      },
      requestContext: {
        get(key: string) {
          return key === "runId" ? "run-1" : undefined
        },
      },
    } as never) as any

    expect(result.done).toBe(true)
    expect(mocks.deleteItem).toHaveBeenCalledWith(
      "22222222-2222-4222-8222-222222222222",
      "user-1"
    )
    expect(setState).toHaveBeenCalledWith({
      plan: {
        tasks: [plannedTask],
      },
      completedTaskIds: [],
      allReports: [
        expect.objectContaining({
          taskId: "T1",
          status: "skipped",
          artifact: null,
          summary:
            "Candidate draft content matched the source file, so the no-op duplicate was rejected.",
        }),
      ],
    })
  })

  it("logs the full plan and reports while preserving the legacy output contract", async () => {
    mocks.getRegistration.mockResolvedValue({
      agentId: TEXTEDIT_PROACTIVE_AGENT_ID,
      name: "TextEdit Proactive Agent",
    })
    mocks.createActivity.mockResolvedValue({
      id: "0b4ec423-bbd9-4c2b-bd31-c94c91256722",
    })

    const result = await logOfflineAgentActivityStep.execute({
      inputData: {
        userId: "user-1",
        forceRun: true,
        done: true,
        synthesis: "Completed 1/1 offline proactive tasks. [T1] Created candidate draft",
        plan: {
          tasks: [plannedTask],
        },
      },
      state: {
        plan: {
          tasks: [plannedTask],
        },
        completedTaskIds: ["T1"],
        allReports: [
          {
            taskId: "T1",
            taskName: plannedTask.name,
            agentId: TEXTEDIT_PROACTIVE_AGENT_ID,
            status: "completed",
            summary: "Created candidate draft",
            artifact: {
              id: "draft-1",
              name: "Draft - Optimized Draft v7",
              type: "text",
              href: null,
            },
            sourceFingerprint: "v7",
          },
        ],
      },
      requestContext: {
        get(key: string) {
          return key === "runId" ? "run-1" : undefined
        },
      },
    } as never) as any

    expect(mocks.createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          forceRun: true,
          plan: expect.objectContaining({
            tasks: [expect.objectContaining({ id: "T1" })],
          }),
          reports: [
            expect.objectContaining({
              taskId: "T1",
              status: "completed",
            }),
          ],
        }),
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        userId: "user-1",
        forceRun: true,
        background:
          "Completed 1/1 offline proactive tasks. [T1] Created candidate draft",
        task: plannedTask.description,
        targetAgentId: TEXTEDIT_PROACTIVE_AGENT_ID,
        execution: expect.objectContaining({
          status: "completed",
          agentId: TEXTEDIT_PROACTIVE_AGENT_ID,
          sourceFingerprint: "v7",
        }),
      })
    )
  })
})
