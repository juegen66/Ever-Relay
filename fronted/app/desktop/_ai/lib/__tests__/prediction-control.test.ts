import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  createCopilotThreadId,
  useDesktopAgentStore,
} from "../../../../../lib/stores/desktop-agent-store"
import { usePredictionStore } from "../../../../../lib/stores/prediction-store"
import {
  __resetPredictionControlForTests,
  queueDesktopPredictionRun,
} from "../prediction-control"

function resetPredictionState() {
  __resetPredictionControlForTests()

  useDesktopAgentStore.setState({
    silentAgentId: null,
    silentThreadId: createCopilotThreadId(),
    silentStatus: "idle",
    silentRunning: false,
    silentLastStartedAt: null,
    silentRunRequestId: 0,
  })

  usePredictionStore.setState({
    predictions: [],
    suggestions: [],
    proactiveReminder: null,
    lastUpdated: null,
    isLoading: false,
  })
}

beforeEach(() => {
  resetPredictionState()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("queueDesktopPredictionRun", () => {
  it("starts a prediction run when idle", async () => {
    const result = await queueDesktopPredictionRun()
    const state = useDesktopAgentStore.getState()

    expect(result).toBe("started")
    expect(state.silentRunning).toBe(true)
    expect(state.silentStatus).toBe("running")
    expect(usePredictionStore.getState().isLoading).toBe(true)
  })

  it("restarts with a fresh thread when forced during an active run", async () => {
    const stopResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ stopped: true }),
    }

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(stopResponse))

    await queueDesktopPredictionRun()
    const firstState = useDesktopAgentStore.getState()

    const result = await queueDesktopPredictionRun({ force: true })
    const nextState = useDesktopAgentStore.getState()

    expect(result).toBe("restarted")
    expect(fetch).toHaveBeenCalledWith(
      `/api/copilotkit/predict/agent/prediction_agent/stop/${encodeURIComponent(firstState.silentThreadId)}`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    )
    expect(nextState.silentStatus).toBe("running")
    expect(nextState.silentThreadId).not.toBe(firstState.silentThreadId)
    expect(nextState.silentRunRequestId).toBe(firstState.silentRunRequestId + 1)
  })

  it("returns running for non-forced overlap and does not stop the active thread", async () => {
    vi.stubGlobal("fetch", vi.fn())

    await queueDesktopPredictionRun()
    const result = await queueDesktopPredictionRun()

    expect(result).toBe("running")
    expect(fetch).not.toHaveBeenCalled()
  })

  it("ignores stale completion from an older request id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ stopped: true }),
      })
    )

    await queueDesktopPredictionRun()
    const firstRequestId = useDesktopAgentStore.getState().silentRunRequestId

    await queueDesktopPredictionRun({ force: true })
    const currentState = useDesktopAgentStore.getState()

    const finished = useDesktopAgentStore
      .getState()
      .finishSilentPredictionRun(firstRequestId)

    expect(finished).toBe(false)
    expect(useDesktopAgentStore.getState().silentRunRequestId).toBe(
      currentState.silentRunRequestId
    )
    expect(useDesktopAgentStore.getState().silentRunning).toBe(true)
  })
})
