import { beforeEach, describe, expect, it, vi } from "vitest"

const { listActivityFeedByUser, listOfflineAgentRegistrations } = vi.hoisted(() => ({
  listActivityFeedByUser: vi.fn(),
  listOfflineAgentRegistrations: vi.fn(),
}))

vi.mock("@/server/modules/agent-activity/agent-activity.service", () => ({
  agentActivityService: {
    listActivityFeedByUser,
    listOfflineAgentRegistrations,
  },
}))

import {
  getAgentActivityFeed,
  listOfflineAgentRegistrations as listOfflineAgentRegistrationsController,
} from "@/server/modules/agent-activity/agent-activity.controller"

type MockContext = {
  get: (key: string) => unknown
  json: (payload: unknown) => unknown
  status: (code: number) => void
}

function createContext() {
  return {
    get: vi.fn((key: string) => {
      if (key === "user") {
        return { id: "user-1" }
      }
      if (key === "requestId") {
        return "request-1"
      }
      return undefined
    }),
    json: vi.fn((payload: unknown) => payload),
    status: vi.fn(),
  } as MockContext
}

describe("agent activity controller", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("formats the current user's activity feed", async () => {
    listActivityFeedByUser.mockResolvedValueOnce([
      {
        id: "00000000-0000-0000-0000-000000000001",
        userId: "user-1",
        agentId: "main_agent",
        activityType: "handoff",
        title: "Handoff complete",
        summary: "Transferred context to the desktop copilot",
        threadId: "thread-1",
        runId: "run-1",
        payload: { source: "workflow" },
        createdAt: new Date("2026-03-18T10:00:00.000Z"),
      },
    ])

    const context = createContext()
    await getAgentActivityFeed(context, { limit: 20, agentId: "main_agent" })

    expect(listActivityFeedByUser).toHaveBeenCalledWith("user-1", {
      limit: 20,
      agentId: "main_agent",
    })
    expect(context.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        code: 0,
        requestId: "request-1",
        data: {
          activities: [
            expect.objectContaining({
              createdAt: "2026-03-18T10:00:00.000Z",
              summary: "Transferred context to the desktop copilot",
            }),
          ],
        },
      })
    )
  })

  it("formats offline-capable agent registrations", async () => {
    listOfflineAgentRegistrations.mockResolvedValueOnce([
      {
        id: "00000000-0000-0000-0000-000000000010",
        agentId: "main_agent",
        name: "Desktop Copilot",
        description: "Primary desktop assistant",
        offlineCapable: true,
        metadata: { tier: "core" },
        createdAt: new Date("2026-03-18T10:00:00.000Z"),
        updatedAt: new Date("2026-03-18T10:01:00.000Z"),
      },
    ])

    const context = createContext()
    await listOfflineAgentRegistrationsController(context)

    expect(listOfflineAgentRegistrations).toHaveBeenCalledTimes(1)
    expect(context.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        code: 0,
        requestId: "request-1",
        data: {
          agents: [
            expect.objectContaining({
              updatedAt: "2026-03-18T10:01:00.000Z",
              offlineCapable: true,
            }),
          ],
        },
      })
    )
  })
})
