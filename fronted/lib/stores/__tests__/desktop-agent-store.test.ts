import { beforeEach, describe, expect, it } from "vitest"

import { createCopilotThreadId, useDesktopAgentStore } from "../desktop-agent-store"

const threadId = "handoff-thread"

beforeEach(() => {
  useDesktopAgentStore.setState({
    copilotSidebarOpen: false,
    copilotAgentMode: "main",
    mainCopilotThreadId: threadId,
    copilotThreadId: threadId,
    activeCodingApp: null,
    thirdPartyWindowId: null,
    silentAgentId: null,
    silentThreadId: createCopilotThreadId(),
    silentStatus: "idle",
    silentRunning: false,
    silentLastStartedAt: null,
    silentRunRequestId: 0,
    pendingHandoff: null,
    pendingCopilotDispatch: null,
  })
})

describe("desktop-agent-store handoff state machine", () => {
  it("queues handoff with queued status", () => {
    useDesktopAgentStore.getState().queuePendingHandoff({
      id: "pending-1",
      threadId,
      sourceAgentId: "logo_agent",
      targetAgentId: "main_agent",
      targetMode: "main",
      handoffDocument: "# Agent handoff",
    })

    expect(useDesktopAgentStore.getState().pendingHandoff).toMatchObject({
      id: "pending-1",
      threadId,
      sourceAgentId: "logo_agent",
      targetAgentId: "main_agent",
      targetMode: "main",
      handoffDocument: "# Agent handoff",
      status: "queued",
    })
  })

  it("moves queued to switching", () => {
    useDesktopAgentStore.getState().queuePendingHandoff({
      id: "pending-1",
      threadId,
      sourceAgentId: "logo_agent",
      targetAgentId: "main_agent",
      targetMode: "main",
      handoffDocument: "# Agent handoff",
    })

    expect(useDesktopAgentStore.getState().markPendingHandoffSwitching("pending-1")).toBe(true)
    expect(useDesktopAgentStore.getState().pendingHandoff?.status).toBe("switching")
  })

  it("clears handoff after switching", () => {
    useDesktopAgentStore.getState().queuePendingHandoff({
      id: "pending-1",
      threadId,
      sourceAgentId: "logo_agent",
      targetAgentId: "main_agent",
      targetMode: "main",
      handoffDocument: "# Agent handoff",
    })

    useDesktopAgentStore.getState().markPendingHandoffSwitching("pending-1")
    useDesktopAgentStore.getState().clearPendingHandoff("pending-1")

    expect(useDesktopAgentStore.getState().pendingHandoff).toBeNull()
  })

  it("does not mark switching if id mismatch", () => {
    useDesktopAgentStore.getState().queuePendingHandoff({
      id: "pending-1",
      threadId,
      sourceAgentId: "logo_agent",
      targetAgentId: "main_agent",
      targetMode: "main",
      handoffDocument: "# Agent handoff",
    })

    expect(useDesktopAgentStore.getState().markPendingHandoffSwitching("wrong-id")).toBe(false)
    expect(useDesktopAgentStore.getState().pendingHandoff?.status).toBe("queued")
  })

  it("stores canvas as a valid handoff target mode", () => {
    useDesktopAgentStore.getState().queuePendingHandoff({
      id: "pending-canvas",
      threadId,
      sourceAgentId: "main_agent",
      targetAgentId: "canvas_agent",
      targetMode: "canvas",
      handoffDocument: "# Agent handoff",
    })

    expect(useDesktopAgentStore.getState().pendingHandoff).toMatchObject({
      id: "pending-canvas",
      targetAgentId: "canvas_agent",
      targetMode: "canvas",
      status: "queued",
    })
  })

  it("tracks the focused third-party window", () => {
    useDesktopAgentStore.getState().focusThirdPartyCopilot("tp-window-1")

    expect(useDesktopAgentStore.getState()).toMatchObject({
      copilotAgentMode: "third_party",
      thirdPartyWindowId: "tp-window-1",
    })
  })
})
